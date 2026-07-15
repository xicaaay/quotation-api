import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DmBillingPeriod,
  DmPricingType,
  DmProduct,
  DmProductArea,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  ProductSortField,
  QueryProductsDto,
  SortOrder,
} from './dto/query-products.dto';
import { ReorderProductsDto } from './dto/reorder-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponse } from './types/product-response.type';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un producto después de validar las reglas relacionadas con precio y entrega.
   */
  async create(dto: CreateProductDto): Promise<ProductResponse> {
    this.validateBusinessRules(dto);

    try {
      const product = await this.prisma.dmProduct.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description || null,
          area: dto.area,
          pricingType: dto.pricingType,
          basePrice: dto.basePrice,
          currency: dto.currency ?? 'USD',
          unitName: dto.unitName ?? 'servicio',
          billingPeriod: dto.billingPeriod ?? DmBillingPeriod.ONE_TIME,
          estimatedDeliveryValue: dto.estimatedDeliveryValue ?? null,
          estimatedDeliveryUnit: dto.estimatedDeliveryUnit ?? null,
          minimumQuantity: dto.minimumQuantity ?? 1,
          isActive: dto.isActive ?? true,
          displayOrder: dto.displayOrder ?? 0,
        },
      });

      return this.mapProduct(product);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  /**
   * Devuelve un listado paginado con filtros y ordenamiento.
   */
  async findAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'displayOrder';
    const sortOrder = query.sortOrder ?? 'asc';
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    const [products, total] = await this.prisma.$transaction([
      this.prisma.dmProduct.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dmProduct.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: products.map((product) => this.mapProduct(product)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Devuelve únicamente los productos activos para selectores y cotizaciones.
   */
  async findCatalog(): Promise<ProductResponse[]> {
    const products = await this.prisma.dmProduct.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return products.map((product) => this.mapProduct(product));
  }

  /**
   * Devuelve opciones estáticas que el frontend puede utilizar en formularios.
   */
  getOptions() {
    return {
      areas: [
        { value: DmProductArea.DESIGN, label: 'Diseño' },
        { value: DmProductArea.DEVELOPMENT, label: 'Desarrollo' },
      ],
      pricingTypes: [
        { value: DmPricingType.PER_UNIT, label: 'Por unidad' },
        { value: DmPricingType.FIXED, label: 'Precio fijo' },
        { value: DmPricingType.RECURRING, label: 'Recurrente' },
      ],
      billingPeriods: [
        { value: DmBillingPeriod.ONE_TIME, label: 'Pago único' },
        { value: DmBillingPeriod.MONTHLY, label: 'Mensual' },
        { value: DmBillingPeriod.QUARTERLY, label: 'Trimestral' },
        { value: DmBillingPeriod.YEARLY, label: 'Anual' },
      ],
      deliveryUnits: [
        { value: 'BUSINESS_DAYS', label: 'Días hábiles' },
        { value: 'CALENDAR_DAYS', label: 'Días calendario' },
        { value: 'WEEKS', label: 'Semanas' },
        { value: 'MONTHS', label: 'Meses' },
      ],
      currencies: [{ value: 'USD', label: 'Dólar estadounidense' }],
    };
  }

  /**
   * Obtiene indicadores básicos para el dashboard del catálogo.
   */
  async getSummary() {
    const [
      total,
      active,
      inactive,
      design,
      development,
      perUnit,
      fixed,
      recurring,
      priceAggregate,
    ] = await Promise.all([
      this.prisma.dmProduct.count(),
      this.prisma.dmProduct.count({ where: { isActive: true } }),
      this.prisma.dmProduct.count({ where: { isActive: false } }),
      this.prisma.dmProduct.count({ where: { area: DmProductArea.DESIGN } }),
      this.prisma.dmProduct.count({
        where: { area: DmProductArea.DEVELOPMENT },
      }),
      this.prisma.dmProduct.count({
        where: { pricingType: DmPricingType.PER_UNIT },
      }),
      this.prisma.dmProduct.count({
        where: { pricingType: DmPricingType.FIXED },
      }),
      this.prisma.dmProduct.count({
        where: { pricingType: DmPricingType.RECURRING },
      }),
      this.prisma.dmProduct.aggregate({
        _min: { basePrice: true },
        _max: { basePrice: true },
        _avg: { basePrice: true },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      byArea: {
        design,
        development,
      },
      byPricingType: {
        perUnit,
        fixed,
        recurring,
      },
      prices: {
        minimum: priceAggregate._min.basePrice
          ? Number(priceAggregate._min.basePrice)
          : null,
        maximum: priceAggregate._max.basePrice
          ? Number(priceAggregate._max.basePrice)
          : null,
        average: priceAggregate._avg.basePrice
          ? Number(priceAggregate._avg.basePrice.toFixed(2))
          : null,
        currency: 'USD',
      },
    };
  }

  /**
   * Busca un producto por su identificador.
   */
  async findOne(id: string): Promise<ProductResponse> {
    const product = await this.findProductOrFail(id);
    return this.mapProduct(product);
  }

  /**
   * Actualiza únicamente los campos enviados por el cliente.
   */
  async update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    const current = await this.findProductOrFail(id);
    this.validateBusinessRules({ ...current, ...dto });

    try {
      const product = await this.prisma.dmProduct.update({
        where: { id },
        data: {
          ...dto,
          description:
            dto.description === undefined ? undefined : dto.description || null,
          estimatedDeliveryValue:
            dto.estimatedDeliveryValue === undefined
              ? undefined
              : dto.estimatedDeliveryValue,
          estimatedDeliveryUnit:
            dto.estimatedDeliveryUnit === undefined
              ? undefined
              : dto.estimatedDeliveryUnit,
        },
      });

      return this.mapProduct(product);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  /**
   * Cambia únicamente el estado activo del producto.
   */
  async updateStatus(id: string, isActive: boolean): Promise<ProductResponse> {
    await this.findProductOrFail(id);

    const product = await this.prisma.dmProduct.update({
      where: { id },
      data: { isActive },
    });

    return this.mapProduct(product);
  }

  /**
   * Actualiza varias posiciones dentro de una única transacción.
   */
  async reorder(dto: ReorderProductsDto) {
    const uniqueIds = new Set(dto.items.map((item) => item.id));
    if (uniqueIds.size !== dto.items.length) {
      throw new BadRequestException(
        'No se permiten identificadores repetidos en el reordenamiento.',
      );
    }

    const existingCount = await this.prisma.dmProduct.count({
      where: { id: { in: [...uniqueIds] } },
    });

    if (existingCount !== dto.items.length) {
      throw new NotFoundException(
        'Uno o más productos enviados para reordenar no existen.',
      );
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.dmProduct.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    return {
      message: 'Productos reordenados correctamente.',
      updated: dto.items.length,
    };
  }

  /**
   * Duplica un producto y genera un código único para la nueva copia.
   */
  async duplicate(id: string): Promise<ProductResponse> {
    const source = await this.findProductOrFail(id);
    const code = await this.buildDuplicateCode(source.code);

    const product = await this.prisma.dmProduct.create({
      data: {
        code,
        name: `${source.name} (copia)`,
        description: source.description,
        area: source.area,
        pricingType: source.pricingType,
        basePrice: source.basePrice,
        currency: source.currency,
        unitName: source.unitName,
        billingPeriod: source.billingPeriod,
        estimatedDeliveryValue: source.estimatedDeliveryValue,
        estimatedDeliveryUnit: source.estimatedDeliveryUnit,
        minimumQuantity: source.minimumQuantity,
        isActive: false,
        displayOrder: source.displayOrder + 1,
      },
    });

    return this.mapProduct(product);
  }

  /**
   * Elimina permanentemente un producto de la demo.
   */
  async remove(id: string): Promise<void> {
    await this.findProductOrFail(id);
    await this.prisma.dmProduct.delete({ where: { id } });
  }

  private async findProductOrFail(id: string): Promise<DmProduct> {
    const product = await this.prisma.dmProduct.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('El producto solicitado no existe.');
    }

    return product;
  }

  private buildWhere(query: QueryProductsDto): Prisma.DmProductWhereInput {
    return {
      area: query.area,
      pricingType: query.pricingType,
      billingPeriod: query.billingPeriod,
      isActive: query.isActive,
      OR: query.search
        ? [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
  }

  private buildOrderBy(
    sortBy: ProductSortField,
    sortOrder: SortOrder,
  ): Prisma.DmProductOrderByWithRelationInput[] {
    const primaryOrder = {
      [sortBy]: sortOrder,
    } as Prisma.DmProductOrderByWithRelationInput;

    return [
      primaryOrder,
      ...(sortBy === 'name' ? [] : [{ name: 'asc' as const }]),
    ];
  }

  private validateBusinessRules(data: {
    pricingType?: DmPricingType;
    billingPeriod?: DmBillingPeriod;
    estimatedDeliveryValue?: number | null;
    estimatedDeliveryUnit?: unknown | null;
  }): void {
    const hasDeliveryValue = data.estimatedDeliveryValue != null;
    const hasDeliveryUnit = data.estimatedDeliveryUnit != null;

    if (hasDeliveryValue !== hasDeliveryUnit) {
      throw new BadRequestException(
        'El tiempo estimado requiere tanto el valor como la unidad de entrega.',
      );
    }

    if (
      data.pricingType === DmPricingType.RECURRING &&
      (!data.billingPeriod || data.billingPeriod === DmBillingPeriod.ONE_TIME)
    ) {
      throw new BadRequestException(
        'Los productos recurrentes requieren una periodicidad diferente de ONE_TIME.',
      );
    }

    if (
      data.pricingType !== DmPricingType.RECURRING &&
      data.billingPeriod &&
      data.billingPeriod !== DmBillingPeriod.ONE_TIME
    ) {
      throw new BadRequestException(
        'Solo los productos recurrentes pueden utilizar una periodicidad de cobro.',
      );
    }
  }

  private async buildDuplicateCode(sourceCode: string): Promise<string> {
    const base = `${sourceCode}_COPY`.slice(0, 45);
    let candidate = base;
    let suffix = 2;

    while (
      await this.prisma.dmProduct.findUnique({ where: { code: candidate } })
    ) {
      candidate = `${base}_${suffix}`.slice(0, 50);
      suffix += 1;
    }

    return candidate;
  }

  private mapProduct(product: DmProduct): ProductResponse {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      area: product.area,
      pricingType: product.pricingType,
      basePrice: Number(product.basePrice),
      currency: product.currency,
      unitName: product.unitName,
      billingPeriod: product.billingPeriod,
      estimatedDeliveryValue: product.estimatedDeliveryValue,
      estimatedDeliveryUnit: product.estimatedDeliveryUnit,
      minimumQuantity: product.minimumQuantity,
      isActive: product.isActive,
      displayOrder: product.displayOrder,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private handleDatabaseError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Ya existe un producto con el código proporcionado.',
      );
    }

    throw error;
  }
}
