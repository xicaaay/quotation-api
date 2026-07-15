import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderProductItemDto {
  /** Identificador del producto que será reordenado. */
  @IsUUID()
  id: string;

  /** Nueva posición del producto. */
  @IsInt()
  @Min(0)
  displayOrder: number;
}

export class ReorderProductsDto {
  /** Lista de productos y sus nuevas posiciones. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ReorderProductItemDto)
  items: ReorderProductItemDto[];
}
