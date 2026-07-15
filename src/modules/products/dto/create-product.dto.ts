import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
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

export class CreateProductDto {
  /** Código único utilizado para identificar el producto. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(toUpperCase)
  code: string;

  /** Nombre comercial visible para el usuario. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  /** Descripción general del alcance del producto. */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  /** Área principal a la que pertenece el producto. */
  @IsEnum(DmProductArea)
  area: DmProductArea;

  /** Forma utilizada para calcular el precio. */
  @IsEnum(DmPricingType)
  pricingType: DmPricingType;

  /** Precio base del producto. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice: number;

  /** Código ISO de la moneda. */
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Transform(toUpperCase)
  currency?: string = 'USD';

  /** Nombre de la unidad que se cotiza. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  unitName?: string = 'servicio';

  /** Periodicidad de cobro para servicios recurrentes. */
  @IsOptional()
  @IsEnum(DmBillingPeriod)
  billingPeriod?: DmBillingPeriod = DmBillingPeriod.ONE_TIME;

  /** Cantidad numérica del tiempo estimado de entrega. */
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDeliveryValue?: number;

  /** Unidad utilizada para expresar el tiempo de entrega. */
  @IsOptional()
  @IsEnum(DmDeliveryUnit)
  estimatedDeliveryUnit?: DmDeliveryUnit;

  /** Cantidad mínima permitida para cotizar el producto. */
  @IsOptional()
  @IsInt()
  @Min(1)
  minimumQuantity?: number = 1;

  /** Estado que determina si el producto está disponible. */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  /** Posición utilizada para ordenar el producto. */
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number = 0;
}
