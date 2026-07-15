import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DmBillingPeriod,
  DmDeliveryUnit,
  DmPricingType,
  DmProductArea,
} from '../../../generated/prisma/client';

/**
 * Convierte cadenas de texto a mayúsculas para mantener valores consistentes.
 */
const toUpperCase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(toUpperCase)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string | null;

  @IsOptional()
  @IsEnum(DmProductArea)
  area?: DmProductArea;

  @IsOptional()
  @IsEnum(DmPricingType)
  pricingType?: DmPricingType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Transform(toUpperCase)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  unitName?: string;

  @IsOptional()
  @IsEnum(DmBillingPeriod)
  billingPeriod?: DmBillingPeriod;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDeliveryValue?: number | null;

  @IsOptional()
  @IsEnum(DmDeliveryUnit)
  estimatedDeliveryUnit?: DmDeliveryUnit | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
