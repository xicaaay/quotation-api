import { IsBoolean } from 'class-validator';

export class UpdateProductStatusDto {
  /** Nuevo estado de disponibilidad del producto. */
  @IsBoolean()
  isActive: boolean;
}
