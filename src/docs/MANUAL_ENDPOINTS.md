# Manual de endpoints del catálogo demo

## 1. Alcance

Este módulo administra exclusivamente la tabla `dm_products` creada para la primera demo del agente de propuestas.

Los endpoints permiten:

- Crear productos.
- Consultar productos con filtros y paginación.
- Consultar un producto por UUID o código.
- Actualizar productos.
- Activar o desactivar productos.
- Cambiar el estado de varios productos.
- Duplicar productos.
- Reordenar productos.
- Calcular el precio preliminar de un producto.
- Consultar estadísticas del catálogo.
- Consultar opciones para formularios.
- Eliminar productos de forma permanente.

Esta fase no utiliza autenticación, guards, permisos ni tokens.

## 2. Instalación

Desde la raíz del proyecto ejecuta:

```bash
npm install class-validator class-transformer @nestjs/mapped-types
```

Después descomprime la carpeta entregada y colócala en:

```text
src/modules/
```

La estructura debe quedar así:

```text
src/
├── modules/
│   ├── modules.module.ts
│   └── products/
│       ├── dto/
│       │   ├── bulk-product-status.dto.ts
│       │   ├── calculate-product.dto.ts
│       │   ├── create-product.dto.ts
│       │   ├── query-products.dto.ts
│       │   ├── reorder-products.dto.ts
│       │   ├── update-product-status.dto.ts
│       │   └── update-product.dto.ts
│       ├── products.controller.ts
│       ├── products.module.ts
│       └── products.service.ts
├── prisma/
└── generated/
```

## 3. Importar el módulo

Modifica `src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModulesModule } from './modules/modules.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ModulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## 4. Habilitar validación y CORS

Modifica `src/main.ts`:

```ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

La opción `transform: true` convierte parámetros como `page`, `limit`, `quantity` y `billingCycles` al tipo esperado por los DTO.

## 5. Generar Prisma Client

Después de copiar los archivos ejecuta:

```bash
npx prisma generate
```

Verifica la compilación:

```bash
npm run build
```

Levanta el backend:

```bash
npm run start:dev
```

La URL local predeterminada será:

```text
http://localhost:3000
```

## 6. Formato general de respuestas

Las respuestas exitosas utilizan la propiedad `data`:

```json
{
  "data": {}
}
```

Los listados agregan `meta`:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

Los errores de NestJS tienen una estructura similar a:

```json
{
  "message": "Producto no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

## 7. Valores permitidos

### Área

```text
DESIGN
DEVELOPMENT
```

### Tipo de precio

```text
PER_UNIT
FIXED
RECURRING
```

### Periodicidad

```text
ONE_TIME
MONTHLY
QUARTERLY
YEARLY
```

### Unidad de entrega

```text
BUSINESS_DAYS
CALENDAR_DAYS
WEEKS
MONTHS
```

### Campos de ordenamiento

```text
createdAt
updatedAt
name
code
basePrice
displayOrder
```

### Dirección de ordenamiento

```text
asc
desc
```

## 8. Resumen de endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/products` | Listar productos con filtros y paginación |
| GET | `/products/options` | Obtener opciones para formularios |
| GET | `/products/stats` | Obtener estadísticas del catálogo |
| GET | `/products/:id` | Consultar un producto por UUID |
| GET | `/products/code/:code` | Consultar un producto por código |
| POST | `/products` | Crear un producto |
| POST | `/products/:id/duplicate` | Duplicar un producto |
| POST | `/products/:id/calculate` | Calcular un precio preliminar |
| PATCH | `/products/:id` | Actualizar un producto |
| PATCH | `/products/:id/status` | Activar o desactivar un producto |
| PATCH | `/products/bulk/status` | Cambiar el estado de varios productos |
| PATCH | `/products/reorder` | Reordenar productos |
| DELETE | `/products/:id` | Eliminar un producto permanentemente |

---

# 9. Detalle de endpoints

## 9.1 Listar productos

```http
GET /products
```

### Parámetros de consulta

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `search` | string | No | Busca en código, nombre y descripción |
| `area` | enum | No | `DESIGN` o `DEVELOPMENT` |
| `pricingType` | enum | No | `PER_UNIT`, `FIXED` o `RECURRING` |
| `billingPeriod` | enum | No | Periodicidad del producto |
| `isActive` | boolean | No | `true` o `false` |
| `page` | integer | No | Página, valor predeterminado `1` |
| `limit` | integer | No | Registros por página, máximo `100` |
| `sortBy` | enum | No | Campo de ordenamiento |
| `sortOrder` | enum | No | `asc` o `desc` |

### Ejemplo

```http
GET /products?search=video&area=DESIGN&isActive=true&page=1&limit=20&sortBy=displayOrder&sortOrder=asc
```

### Respuesta `200`

```json
{
  "data": [
    {
      "id": "00e4dd57-d681-43c9-80ae-f8a4a0b08f7f",
      "code": "AI_VIDEO",
      "name": "Video generado con IA",
      "description": "Producción de un video utilizando herramientas de inteligencia artificial.",
      "area": "DESIGN",
      "pricingType": "PER_UNIT",
      "basePrice": 400,
      "currency": "USD",
      "unitName": "video",
      "billingPeriod": "ONE_TIME",
      "estimatedDeliveryValue": 2,
      "estimatedDeliveryUnit": "WEEKS",
      "minimumQuantity": 1,
      "isActive": true,
      "displayOrder": 1,
      "createdAt": "2026-07-15T16:00:00.000Z",
      "updatedAt": "2026-07-15T16:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

## 9.2 Obtener opciones para formularios

```http
GET /products/options
```

Este endpoint evita duplicar enums de backend en el frontend.

### Respuesta `200`

```json
{
  "data": {
    "areas": ["DESIGN", "DEVELOPMENT"],
    "pricingTypes": ["PER_UNIT", "FIXED", "RECURRING"],
    "billingPeriods": ["ONE_TIME", "MONTHLY", "QUARTERLY", "YEARLY"],
    "deliveryUnits": [
      "BUSINESS_DAYS",
      "CALENDAR_DAYS",
      "WEEKS",
      "MONTHS"
    ],
    "currencies": ["USD"],
    "sortFields": [
      "createdAt",
      "updatedAt",
      "name",
      "code",
      "basePrice",
      "displayOrder"
    ],
    "sortOrders": ["asc", "desc"]
  }
}
```

## 9.3 Obtener estadísticas

```http
GET /products/stats
```

### Respuesta `200`

```json
{
  "data": {
    "total": 8,
    "active": 7,
    "inactive": 1,
    "byArea": {
      "DESIGN": 5,
      "DEVELOPMENT": 3
    },
    "byPricingType": {
      "PER_UNIT": 4,
      "FIXED": 3,
      "RECURRING": 1
    }
  }
}
```

Los grupos que no tengan registros pueden no aparecer en `byArea` o `byPricingType`.

## 9.4 Consultar producto por UUID

```http
GET /products/:id
```

### Respuesta `200`

```json
{
  "data": {
    "id": "00e4dd57-d681-43c9-80ae-f8a4a0b08f7f",
    "code": "AI_VIDEO",
    "name": "Video generado con IA",
    "description": "Producción de un video utilizando herramientas de inteligencia artificial.",
    "area": "DESIGN",
    "pricingType": "PER_UNIT",
    "basePrice": 400,
    "currency": "USD",
    "unitName": "video",
    "billingPeriod": "ONE_TIME",
    "estimatedDeliveryValue": 2,
    "estimatedDeliveryUnit": "WEEKS",
    "minimumQuantity": 1,
    "isActive": true,
    "displayOrder": 1,
    "createdAt": "2026-07-15T16:00:00.000Z",
    "updatedAt": "2026-07-15T16:00:00.000Z"
  }
}
```

### Errores

- `400`: el identificador no es un UUID v4 válido.
- `404`: el producto no existe.

## 9.5 Consultar producto por código

```http
GET /products/code/:code
```

El backend normaliza el código a mayúsculas y guiones bajos.

Ejemplo:

```http
GET /products/code/ai-video
```

Busca internamente:

```text
AI_VIDEO
```

### Errores

- `404`: el producto no existe.

## 9.6 Crear producto

```http
POST /products
Content-Type: application/json
```

### Cuerpo para producto por unidad

```json
{
  "code": "AI_VIDEO",
  "name": "Video generado con IA",
  "description": "Producción de un video utilizando herramientas de inteligencia artificial.",
  "area": "DESIGN",
  "pricingType": "PER_UNIT",
  "basePrice": 400,
  "currency": "USD",
  "unitName": "video",
  "billingPeriod": "ONE_TIME",
  "estimatedDeliveryValue": 2,
  "estimatedDeliveryUnit": "WEEKS",
  "minimumQuantity": 1,
  "isActive": true,
  "displayOrder": 1
}
```

### Cuerpo para servicio fijo

```json
{
  "code": "INFORMATIONAL_WEBSITE",
  "name": "Página web informativa",
  "description": "Desarrollo de una página web informativa sin mantenimiento recurrente.",
  "area": "DEVELOPMENT",
  "pricingType": "FIXED",
  "basePrice": 1000,
  "currency": "USD",
  "unitName": "sitio web",
  "billingPeriod": "ONE_TIME",
  "estimatedDeliveryValue": 4,
  "estimatedDeliveryUnit": "WEEKS",
  "minimumQuantity": 1,
  "isActive": true,
  "displayOrder": 10
}
```

### Cuerpo para servicio recurrente

```json
{
  "code": "WEB_MAINTENANCE",
  "name": "Mantenimiento web",
  "description": "Mantenimiento recurrente de una página web.",
  "area": "DEVELOPMENT",
  "pricingType": "RECURRING",
  "basePrice": 500,
  "currency": "USD",
  "unitName": "sitio web",
  "billingPeriod": "MONTHLY",
  "minimumQuantity": 1,
  "isActive": true,
  "displayOrder": 11
}
```

### Reglas

- El código se guarda en mayúsculas y con guiones bajos.
- El código debe ser único.
- La moneda se guarda en mayúsculas.
- Un producto `RECURRING` debe tener una periodicidad distinta de `ONE_TIME`.
- Un producto no recurrente debe utilizar `ONE_TIME`.
- Si se envía `estimatedDeliveryValue`, también se debe enviar `estimatedDeliveryUnit`.
- Si se envía `estimatedDeliveryUnit`, también se debe enviar `estimatedDeliveryValue`.
- El precio debe ser igual o mayor que cero.

### Respuesta `201`

```json
{
  "data": {
    "id": "00e4dd57-d681-43c9-80ae-f8a4a0b08f7f",
    "code": "AI_VIDEO",
    "name": "Video generado con IA",
    "description": "Producción de un video utilizando herramientas de inteligencia artificial.",
    "area": "DESIGN",
    "pricingType": "PER_UNIT",
    "basePrice": 400,
    "currency": "USD",
    "unitName": "video",
    "billingPeriod": "ONE_TIME",
    "estimatedDeliveryValue": 2,
    "estimatedDeliveryUnit": "WEEKS",
    "minimumQuantity": 1,
    "isActive": true,
    "displayOrder": 1,
    "createdAt": "2026-07-15T16:00:00.000Z",
    "updatedAt": "2026-07-15T16:00:00.000Z"
  }
}
```

### Errores

- `400`: campos inválidos o reglas comerciales incompatibles.
- `409`: ya existe un producto con el mismo código.

## 9.7 Actualizar producto

```http
PATCH /products/:id
Content-Type: application/json
```

Todos los campos son opcionales. Solo se actualizan los enviados.

### Ejemplo

```json
{
  "name": "Video premium generado con IA",
  "basePrice": 450,
  "estimatedDeliveryValue": 3,
  "estimatedDeliveryUnit": "WEEKS"
}
```

### Respuesta

- `200`: devuelve el producto actualizado.

### Errores

- `400`: datos inválidos o reglas incompatibles.
- `404`: producto no encontrado.
- `409`: el nuevo código ya está siendo utilizado.

## 9.8 Activar o desactivar un producto

```http
PATCH /products/:id/status
Content-Type: application/json
```

### Cuerpo

```json
{
  "isActive": false
}
```

### Respuesta

- `200`: devuelve el producto actualizado.

Este endpoint debe utilizarse cuando se desea ocultar un producto sin perder su información.

## 9.9 Cambiar estado de varios productos

```http
PATCH /products/bulk/status
Content-Type: application/json
```

### Cuerpo

```json
{
  "ids": [
    "00e4dd57-d681-43c9-80ae-f8a4a0b08f7f",
    "b10e61a2-9e0a-40ac-886e-bda93c74ea48"
  ],
  "isActive": true
}
```

### Restricciones

- Se requiere al menos un UUID.
- Se permiten como máximo 100 UUID por solicitud.
- Todos los productos deben existir.

### Respuesta `200`

```json
{
  "data": {
    "updated": 2,
    "isActive": true
  }
}
```

## 9.10 Duplicar producto

```http
POST /products/:id/duplicate
```

La copia:

- Recibe un código único terminado en `_COPY_1`, `_COPY_2` y sucesivamente.
- Agrega `- Copia` al nombre.
- Conserva precio, área, descripción y configuración.
- Se crea inactiva para permitir revisión antes de publicarla.

### Respuesta `201`

```json
{
  "data": {
    "id": "b10e61a2-9e0a-40ac-886e-bda93c74ea48",
    "code": "AI_VIDEO_COPY_1",
    "name": "Video generado con IA - Copia",
    "isActive": false
  }
}
```

La respuesta real contiene todos los campos del producto.

## 9.11 Reordenar productos

```http
PATCH /products/reorder
Content-Type: application/json
```

### Cuerpo

```json
{
  "items": [
    {
      "id": "00e4dd57-d681-43c9-80ae-f8a4a0b08f7f",
      "displayOrder": 1
    },
    {
      "id": "b10e61a2-9e0a-40ac-886e-bda93c74ea48",
      "displayOrder": 2
    }
  ]
}
```

### Restricciones

- Se requiere al menos un producto.
- Se permiten como máximo 200 productos.
- No se permiten UUID duplicados.
- Todos los productos deben existir.

### Respuesta `200`

```json
{
  "data": {
    "updated": 2
  }
}
```

## 9.12 Calcular precio preliminar

```http
POST /products/:id/calculate
Content-Type: application/json
```

Este endpoint no guarda una cotización. Solo devuelve una vista previa del cálculo.

### Cuerpo

```json
{
  "quantity": 3,
  "billingCycles": 1
}
```

### Reglas de cálculo

| Tipo | Fórmula |
|---|---|
| `FIXED` | `precio_fijo` |
| `PER_UNIT` | `precio_unitario * cantidad` |
| `RECURRING` | `precio_unitario * cantidad * ciclos_de_facturacion` |

Si la cantidad solicitada es menor que `minimumQuantity`, el backend utiliza la cantidad mínima.

### Ejemplo para tres videos de USD 400

```json
{
  "data": {
    "product": {
      "id": "00e4dd57-d681-43c9-80ae-f8a4a0b08f7f",
      "code": "AI_VIDEO",
      "name": "Video generado con IA",
      "pricingType": "PER_UNIT",
      "basePrice": 400,
      "currency": "USD",
      "minimumQuantity": 1
    },
    "calculation": {
      "requestedQuantity": 3,
      "appliedQuantity": 3,
      "billingCycles": 1,
      "unitPrice": 400,
      "subtotal": 1200,
      "currency": "USD",
      "formula": "precio_unitario * cantidad",
      "minimumQuantityApplied": false
    }
  }
}
```

La respuesta real incluye todos los campos del producto.

## 9.13 Eliminar producto

```http
DELETE /products/:id
```

### Respuesta

```text
204 No Content
```

Este endpoint elimina el registro permanentemente. Para ocultarlo sin eliminarlo utiliza:

```http
PATCH /products/:id/status
```

con:

```json
{
  "isActive": false
}
```

## 10. Códigos HTTP principales

| Código | Uso |
|---|---|
| `200` | Consulta o actualización exitosa |
| `201` | Producto creado o duplicado |
| `204` | Producto eliminado sin cuerpo de respuesta |
| `400` | Validación fallida, UUID inválido o regla comercial incompatible |
| `404` | Producto no encontrado |
| `409` | Código de producto duplicado |
| `500` | Error interno no controlado |

## 11. Importar en Postman

Se entregan dos archivos:

```text
Quotation Demo API.postman_collection.json
Quotation Demo Local.postman_environment.json
```

En Postman:

1. Selecciona `Import`.
2. Importa ambos archivos.
3. Activa el entorno `Quotation Demo Local`.
4. Ejecuta primero `Crear producto demo`.
5. La colección guardará automáticamente `productId` y `productCode`.
6. Ejecuta `Duplicar producto` para guardar `duplicateProductId`.
7. Los demás requests reutilizarán esas variables.

Para probar Railway cambia la variable `baseUrl` por la URL pública del backend, sin `/` al final.

Ejemplo:

```text
https://quotation-api-production.up.railway.app
```
