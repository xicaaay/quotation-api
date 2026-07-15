import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { ReorderProductsDto } from './dto/reorder-products.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

/**
 * Expone los endpoints públicos del catálogo de productos de la demo.
 * No contiene guardias de autenticación porque esta fase es exclusivamente de prueba.
 */
@Controller('products')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** Crea un producto nuevo. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  /** Lista productos con búsqueda, filtros, paginación y ordenamiento. */
  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  /** Devuelve todos los productos activos para cotizaciones y selectores. */
  @Get('catalog')
  findCatalog() {
    return this.productsService.findCatalog();
  }

  /** Devuelve las opciones permitidas para construir formularios. */
  @Get('options')
  getOptions() {
    return this.productsService.getOptions();
  }

  /** Devuelve indicadores generales del catálogo. */
  @Get('summary')
  getSummary() {
    return this.productsService.getSummary();
  }

  /** Actualiza el orden visual de varios productos. */
  @Patch('reorder')
  reorder(@Body() dto: ReorderProductsDto) {
    return this.productsService.reorder(dto);
  }

  /** Obtiene el detalle de un producto. */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.findOne(id);
  }

  /** Actualiza parcialmente un producto. */
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  /** Cambia el estado activo o inactivo de un producto. */
  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductStatusDto,
  ) {
    return this.productsService.updateStatus(id, dto.isActive);
  }

  /** Duplica un producto existente y deja la copia inactiva. */
  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.duplicate(id);
  }

  /** Elimina permanentemente un producto. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.productsService.remove(id);
  }
}
