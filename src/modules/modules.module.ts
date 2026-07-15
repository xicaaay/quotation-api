import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';

/**
 * Agrupa los módulos funcionales de la aplicación.
 * Esto permite importar todos los módulos desde un único punto en AppModule.
 */
@Module({
  imports: [ProductsModule],
  exports: [ProductsModule],
})
export class ModulesModule {}
