# Quotation API

API REST para administrar el catálogo de productos y servicios del ecosistema **Quotation**.

Está desarrollada con NestJS, Prisma y PostgreSQL. Centraliza la persistencia, validación, reglas de negocio, búsqueda, filtros, paginación, métricas y operaciones administrativas del catálogo.

> Este backend es administrado visualmente desde [Quotation Web](https://github.com/xicaaay/quotation-web). La misma tabla PostgreSQL es consultada en modo de solo lectura por [Quotation MCP](https://github.com/xicaaay/quotation-mcp).

---

## Repositorios relacionados

| Proyecto | Responsabilidad | Repositorio |
|---|---|---|
| **Quotation API** | API REST y propietario de la lógica de escritura. | Este repositorio |
| **Quotation Web** | Panel administrativo que consume esta API. | [xicaaay/quotation-web](https://github.com/xicaaay/quotation-web) |
| **Quotation MCP** | Capa MCP de solo lectura sobre la misma base. | [xicaaay/quotation-mcp](https://github.com/xicaaay/quotation-mcp) |

### Arquitectura general

```text
Quotation Web
     |
     | REST / JSON
     v
Quotation API
     |
     | Prisma 7 + adapter-pg
     v
PostgreSQL
     ^
     |
     | SELECT + transacciones READ ONLY
     |
Quotation MCP
```

La API es el único proyecto de los tres diseñado para crear, actualizar, reordenar, activar, duplicar o eliminar productos.

---

## Funcionalidades

- Crear productos.
- Listar productos con paginación.
- Buscar por código, nombre o descripción.
- Filtrar por área, modalidad de precio, periodicidad y estado.
- Ordenar por código, nombre, precio, posición o fechas.
- Consultar únicamente productos activos.
- Obtener opciones permitidas para formularios.
- Obtener indicadores generales del catálogo.
- Consultar un producto por UUID.
- Actualizar parcialmente un producto.
- Activar o desactivar un producto.
- Reordenar múltiples productos dentro de una transacción.
- Duplicar un producto como registro inactivo.
- Eliminar permanentemente un producto.
- Cargar un catálogo de demostración mediante una seed idempotente.

---

## Tecnologías

- Node.js
- TypeScript
- NestJS 11
- Prisma 7
- `@prisma/adapter-pg`
- PostgreSQL
- `class-validator`
- `class-transformer`
- Jest
- ESLint
- Prettier

---

## Estructura principal

```text
quotation-api/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── generated/
│   │   └── prisma/
│   ├── modules/
│   │   ├── modules.module.ts
│   │   └── products/
│   │       ├── dto/
│   │       │   ├── create-product.dto.ts
│   │       │   ├── query-products.dto.ts
│   │       │   ├── reorder-products.dto.ts
│   │       │   ├── update-product-status.dto.ts
│   │       │   └── update-product.dto.ts
│   │       ├── types/
│   │       │   └── product-response.type.ts
│   │       ├── products.controller.ts
│   │       ├── products.module.ts
│   │       └── products.service.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
├── .env.example
├── nest-cli.json
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── README.md
```

---

## Modelo de datos

La aplicación utiliza la tabla física:

```text
dm_products
```

### Enumeraciones

#### `DmProductArea`

| Valor | Descripción |
|---|---|
| `DESIGN` | Productos y servicios de diseño. |
| `DEVELOPMENT` | Productos y servicios de desarrollo. |

#### `DmPricingType`

| Valor | Descripción |
|---|---|
| `PER_UNIT` | El precio base se multiplica por cantidad. |
| `FIXED` | El precio corresponde al servicio completo. |
| `RECURRING` | El precio se cobra periódicamente. |

#### `DmBillingPeriod`

- `ONE_TIME`
- `MONTHLY`
- `QUARTERLY`
- `YEARLY`

#### `DmDeliveryUnit`

- `BUSINESS_DAYS`
- `CALENDAR_DAYS`
- `WEEKS`
- `MONTHS`

### Campos de `DmProduct`

| Campo | Tipo | Reglas principales |
|---|---|---|
| `id` | UUID | Llave primaria generada automáticamente. |
| `code` | `varchar(50)` | Único y normalizado a mayúsculas. |
| `name` | `varchar(150)` | Obligatorio. |
| `description` | `text` | Opcional, máximo 5,000 caracteres desde el DTO. |
| `area` | Enum | `DESIGN` o `DEVELOPMENT`. |
| `pricingType` | Enum | `PER_UNIT`, `FIXED` o `RECURRING`. |
| `basePrice` | `decimal(12,2)` | No puede ser negativo. |
| `currency` | `varchar(3)` | `USD` por defecto. |
| `unitName` | `varchar(60)` | `servicio` por defecto. |
| `billingPeriod` | Enum | `ONE_TIME` por defecto. |
| `estimatedDeliveryValue` | Entero | Opcional, mínimo 1. |
| `estimatedDeliveryUnit` | Enum | Opcional. |
| `minimumQuantity` | Entero | Mínimo 1. |
| `isActive` | Booleano | `true` por defecto. |
| `displayOrder` | Entero | Mínimo 0. |
| `createdAt` | Timestamp | Generado automáticamente. |
| `updatedAt` | Timestamp | Actualizado automáticamente. |

### Índices

- `[area, isActive]`
- `[pricingType, isActive]`
- `[displayOrder]`

---

## Reglas de negocio

### Tiempo estimado de entrega

Los campos de entrega deben enviarse juntos:

```json
{
  "estimatedDeliveryValue": 2,
  "estimatedDeliveryUnit": "WEEKS"
}
```

No es válido enviar únicamente uno de los dos.

### Productos recurrentes

Un producto con:

```json
{
  "pricingType": "RECURRING"
}
```

debe utilizar una periodicidad diferente de `ONE_TIME`.

Ejemplo válido:

```json
{
  "pricingType": "RECURRING",
  "billingPeriod": "MONTHLY"
}
```

### Productos no recurrentes

Los productos `PER_UNIT` o `FIXED` deben utilizar:

```json
{
  "billingPeriod": "ONE_TIME"
}
```

### Código único

Si Prisma devuelve el error `P2002`, la API responde con un conflicto indicando que el código ya existe.

### Duplicación

Al duplicar un producto:

- Se genera un código basado en `CODIGO_COPY`.
- Si existe, se prueban sufijos como `_2`, `_3`, etc.
- El nombre recibe el sufijo `(copia)`.
- La copia queda inactiva.
- La posición se establece después del producto original.

### Reordenamiento

- Se permiten entre 1 y 200 elementos.
- Los identificadores no pueden repetirse.
- Todos los productos deben existir.
- Las actualizaciones se ejecutan dentro de una transacción.

---

## Requisitos

- Node.js 20 o superior recomendado.
- npm.
- PostgreSQL.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/xicaaay/quotation-api.git
cd quotation-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo `.env`

```bash
cp .env.example .env
```

Contenido base:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
PORT=3000
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

Para el frontend local, el origen relevante es:

```env
CORS_ORIGINS="http://localhost:3001"
```

La variable admite varios orígenes separados por comas.

### 4. Generar Prisma Client

```bash
npm run prisma:generate
```

También se ejecuta automáticamente antes de `npm run build` mediante el script `prebuild`.

### 5. Aplicar migraciones

En desarrollo:

```bash
npx prisma migrate dev
```

En un entorno de despliegue:

```bash
npx prisma migrate deploy
```

### 6. Cargar datos de demostración

```bash
npm run prisma:seed
```

La seed utiliza `upsert` por `code`, por lo que puede ejecutarse varias veces sin duplicar los productos definidos en el archivo.

### 7. Iniciar la API

```bash
npm run start:dev
```

Disponible en:

```text
http://localhost:3000
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run build` | Genera Prisma Client y compila NestJS. |
| `npm run format` | Aplica Prettier sobre código y pruebas. |
| `npm run start` | Ejecuta NestJS. |
| `npm run start:dev` | Ejecuta NestJS en modo watch. |
| `npm run start:debug` | Ejecuta en modo debug y watch. |
| `npm run start:prod` | Ejecuta `dist/main`. |
| `npm run lint` | Ejecuta ESLint con corrección automática. |
| `npm run test` | Ejecuta pruebas unitarias. |
| `npm run test:watch` | Ejecuta Jest en modo watch. |
| `npm run test:cov` | Genera cobertura. |
| `npm run test:e2e` | Ejecuta pruebas end-to-end. |
| `npm run prisma:generate` | Genera Prisma Client. |
| `npm run prisma:validate` | Valida el schema. |
| `npm run prisma:format` | Formatea el schema. |
| `npm run prisma:studio` | Abre Prisma Studio. |
| `npm run prisma:seed` | Ejecuta la seed. |

---

## Endpoints

La API no utiliza actualmente un prefijo global. Los endpoints comienzan directamente en `/products`.

### Estado básico

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/` | Responde actualmente `Hello World!`. |

Para validar la base de datos y el catálogo, utiliza preferentemente `/products/summary` o `/products/catalog`.

### Productos

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/products` | Crea un producto. |
| `GET` | `/products` | Lista productos con filtros y paginación. |
| `GET` | `/products/catalog` | Devuelve productos activos. |
| `GET` | `/products/options` | Devuelve opciones para formularios. |
| `GET` | `/products/summary` | Devuelve indicadores del catálogo. |
| `PATCH` | `/products/reorder` | Actualiza el orden de varios productos. |
| `GET` | `/products/:id` | Consulta un producto por UUID. |
| `PATCH` | `/products/:id` | Actualiza parcialmente un producto. |
| `PATCH` | `/products/:id/status` | Cambia el estado activo. |
| `POST` | `/products/:id/duplicate` | Duplica un producto. |
| `DELETE` | `/products/:id` | Elimina permanentemente un producto. |

---

## Consulta de productos

### Parámetros de `GET /products`

| Parámetro | Tipo | Valores o regla | Predeterminado |
|---|---|---|---|
| `search` | String | Código, nombre o descripción. | Sin búsqueda |
| `area` | Enum | `DESIGN`, `DEVELOPMENT` | Todos |
| `pricingType` | Enum | `PER_UNIT`, `FIXED`, `RECURRING` | Todos |
| `billingPeriod` | Enum | `ONE_TIME`, `MONTHLY`, `QUARTERLY`, `YEARLY` | Todos |
| `isActive` | Booleano | `true`, `false` | Todos |
| `page` | Entero | Mínimo 1 | `1` |
| `limit` | Entero | Entre 1 y 100 | `20` |
| `sortBy` | String | `code`, `name`, `basePrice`, `displayOrder`, `createdAt`, `updatedAt` | `displayOrder` |
| `sortOrder` | String | `asc`, `desc` | `asc` |

Ejemplo:

```bash
curl "http://localhost:3000/products?search=web&area=DEVELOPMENT&isActive=true&page=1&limit=20&sortBy=basePrice&sortOrder=asc"
```

Respuesta:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

## Ejemplos de uso

### Crear un producto

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DEV_CUSTOM_API",
    "name": "Desarrollo de API personalizada",
    "description": "Diseño e implementación de una API para un flujo específico.",
    "area": "DEVELOPMENT",
    "pricingType": "FIXED",
    "basePrice": 1500,
    "currency": "USD",
    "unitName": "proyecto",
    "billingPeriod": "ONE_TIME",
    "estimatedDeliveryValue": 4,
    "estimatedDeliveryUnit": "WEEKS",
    "minimumQuantity": 1,
    "isActive": true,
    "displayOrder": 140
  }'
```

### Actualizar un producto

```bash
curl -X PATCH http://localhost:3000/products/UUID_DEL_PRODUCTO \
  -H "Content-Type: application/json" \
  -d '{
    "basePrice": 1750,
    "description": "Alcance comercial actualizado."
  }'
```

### Cambiar estado

```bash
curl -X PATCH http://localhost:3000/products/UUID_DEL_PRODUCTO/status \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

### Reordenar

```bash
curl -X PATCH http://localhost:3000/products/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "id": "UUID_1", "displayOrder": 1 },
      { "id": "UUID_2", "displayOrder": 2 }
    ]
  }'
```

### Duplicar

```bash
curl -X POST http://localhost:3000/products/UUID_DEL_PRODUCTO/duplicate
```

### Eliminar

```bash
curl -X DELETE http://localhost:3000/products/UUID_DEL_PRODUCTO
```

---

## Resumen del catálogo

`GET /products/summary` devuelve:

```json
{
  "total": 13,
  "active": 13,
  "inactive": 0,
  "byArea": {
    "design": 6,
    "development": 7
  },
  "byPricingType": {
    "perUnit": 3,
    "fixed": 8,
    "recurring": 2
  },
  "prices": {
    "minimum": 50,
    "maximum": 2500,
    "average": 800,
    "currency": "USD"
  }
}
```

Los valores son ilustrativos y dependen del contenido actual de la base de datos.

---

## Opciones para formularios

`GET /products/options` expone etiquetas y valores permitidos para:

- Áreas.
- Tipos de precio.
- Periodicidades.
- Unidades de entrega.
- Monedas.

La moneda publicada actualmente por este endpoint es `USD`.

---

## Validación

El controlador aplica un `ValidationPipe` con:

```ts
{
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true
}
```

Esto significa que:

- Se eliminan o rechazan campos no declarados.
- Los valores compatibles se transforman al tipo esperado.
- Un cuerpo con propiedades desconocidas devuelve error.
- Los query params numéricos y booleanos se transforman.

---

## CORS

La API lee la variable:

```env
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

Los valores se separan por comas, se limpian y se envían directamente a NestJS.

Métodos permitidos:

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `OPTIONS`

Headers permitidos:

- `Content-Type`
- `Accept`

---

## Integración con Quotation Web

Repositorio:

[https://github.com/xicaaay/quotation-web](https://github.com/xicaaay/quotation-web)

Configura en el frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Configura en esta API:

```env
CORS_ORIGINS=http://localhost:3001
```

---

## Integración con Quotation MCP

Repositorio:

[https://github.com/xicaaay/quotation-mcp](https://github.com/xicaaay/quotation-mcp)

El MCP utiliza el mismo `DATABASE_URL`, pero debe conectarse con un usuario de PostgreSQL que solo tenga permisos de lectura.

```env
DATABASE_URL="postgresql://quotation_reader:PASSWORD@HOST:5432/DATABASE"
```

La API administra los productos; el MCP los consulta.

---

## Despliegue en Railway

El repositorio no incluye actualmente un `Dockerfile` ni un `railway.json`, por lo que Railway puede construirlo mediante su builder para Node.js.

### Variables

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=3000
CORS_ORIGINS=https://dominio-del-frontend
```

Railway suele proporcionar `PORT`. La aplicación también utiliza `3000` como valor predeterminado.

### Build recomendado

```bash
npm install
npm run build
```

### Inicio

```bash
npm run start:prod
```

### Migraciones en producción

Ejecuta durante el proceso de despliegue o como comando manual controlado:

```bash
npx prisma migrate deploy
```

La seed es opcional:

```bash
npm run prisma:seed
```

No ejecutes la seed automáticamente si los productos de demostración no deben sobrescribir registros con los mismos códigos.

---

## Pruebas y calidad

```bash
npm run lint
npm run test
npm run test:e2e
npm run test:cov
npm run build
```

El proyecto incluye la configuración base de Jest y Supertest. La cobertura real dependerá de los archivos de prueba agregados al repositorio.

---

## Seguridad y estado actual

- Los endpoints no tienen autenticación ni autorización.
- El controlador indica expresamente que es una fase pública de demostración.
- La eliminación es permanente.
- Cualquier cliente que alcance la API puede modificar el catálogo.
- No debe exponerse a Internet con datos sensibles sin agregar seguridad.

Antes de un uso productivo se recomienda:

- Autenticación con JWT o proveedor externo.
- Roles y permisos.
- Rate limiting.
- Helmet.
- Logs estructurados.
- Auditoría de cambios.
- Soft delete o historial.
- Validación estricta de CORS.
- Documentación OpenAPI/Swagger.

---

## Solución de problemas

### `DATABASE_URL` no está configurada

Verifica `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

### Prisma Client no existe

```bash
npm run prisma:generate
```

### La tabla `dm_products` no existe

```bash
npx prisma migrate dev
```

O en producción:

```bash
npx prisma migrate deploy
```

### El frontend recibe un error de CORS

Agrega su origen:

```env
CORS_ORIGINS=http://localhost:3001
```

### Código de producto duplicado

Usa un valor diferente en `code`. La columna es única.

### Producto recurrente rechazado

Asegúrate de usar una periodicidad recurrente:

```json
{
  "pricingType": "RECURRING",
  "billingPeriod": "MONTHLY"
}
```

### Tiempo de entrega rechazado

Envía ambos campos o ninguno:

```json
{
  "estimatedDeliveryValue": 5,
  "estimatedDeliveryUnit": "BUSINESS_DAYS"
}
```

---

## Mejoras recomendadas

- Reemplazar la respuesta `Hello World!` por un health check real.
- Agregar Swagger.
- Incorporar autenticación y autorización.
- Añadir pruebas del módulo de productos.
- Agregar scripts explícitos para migraciones.
- Incorporar Dockerfile y configuración de Railway.
- Implementar cotizaciones, clientes y detalle de cotización.
- Agregar auditoría y eliminación lógica.
- Crear una estrategia de monedas múltiples.

---

## Estado del proyecto

API funcional para una demostración de catálogo. Actúa como fuente de escritura y lógica de negocio para el panel web, mientras el MCP ofrece una interfaz segura de consulta para agentes de IA.
