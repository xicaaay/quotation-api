import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  DmBillingPeriod,
  DmPricingType,
  DmProductArea,
} from '../../../generated/prisma/client';

export const PRODUCT_SORT_FIELDS = [
  'code',
  'name',
  'basePrice',
  'displayOrder',
  'createdAt',
  'updatedAt',
] as const;

export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

/**
 * Convierte los valores true y false recibidos por query string a booleanos.
 */
const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

export class QueryProductsDto {
  /** Texto buscado en código, nombre y descripción. */
  @IsOptional()
  @IsString()
  search?: string;

  /** Filtro por área del producto. */
  @IsOptional()
  @IsEnum(DmProductArea)
  area?: DmProductArea;

  /** Filtro por modalidad de precio. */
  @IsOptional()
  @IsEnum(DmPricingType)
  pricingType?: DmPricingType;

  /** Filtro por periodicidad de cobro. */
  @IsOptional()
  @IsEnum(DmBillingPeriod)
  billingPeriod?: DmBillingPeriod;

  /** Filtro por estado activo o inactivo. */
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  /** Número de página solicitado. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Cantidad máxima de registros por página. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** Campo utilizado para ordenar los resultados. */
  @IsOptional()
  @IsIn(PRODUCT_SORT_FIELDS)
  sortBy?: ProductSortField = 'displayOrder';

  /** Dirección utilizada para ordenar los resultados. */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: SortOrder = 'asc';
}
