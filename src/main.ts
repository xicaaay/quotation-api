import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  /*
   * Lee los orígenes permitidos desde la variable CORS_ORIGINS.
   * Cada origen debe estar separado por una coma.
   */
  const configuredOrigins =
    configService.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000';

  /*
   * Convierte la variable de entorno en una lista de orígenes.
   * También elimina espacios y valores vacíos.
   */
  const allowedOrigins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });

  app.enableShutdownHooks();

  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);
}
bootstrap();
