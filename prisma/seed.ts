import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  DmBillingPeriod,
  DmDeliveryUnit,
  DmPricingType,
  DmProductArea,
  Prisma,
  PrismaClient,
} from '../src/generated/prisma/client';

/**
 * Obtiene y valida la cadena de conexión utilizada por la seed.
 */
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'La variable DATABASE_URL no está configurada. Verifica el archivo .env antes de ejecutar la seed.',
    );
  }

  return databaseUrl;
}

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
});

const prisma = new PrismaClient({ adapter });

/**
 * Datos iniciales del catálogo demo.
 *
 * La propiedad code es única y se utiliza para que la seed sea idempotente.
 * Al ejecutar la seed nuevamente, los productos existentes se actualizan en
 * lugar de crear registros duplicados.
 */
const products = [
  {
    code: 'DES_AI_VIDEO',
    name: 'Video generado con inteligencia artificial',
    description:
      'Producción de un video utilizando herramientas de inteligencia artificial. Incluye conceptualización, generación visual, edición básica y una ronda de ajustes.',
    area: DmProductArea.DESIGN,
    pricingType: DmPricingType.PER_UNIT,
    basePrice: 400,
    currency: 'USD',
    unitName: 'video',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 2,
    estimatedDeliveryUnit: DmDeliveryUnit.WEEKS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 10,
  },
  {
    code: 'DES_SOCIAL_POST',
    name: 'Diseño de publicación para redes sociales',
    description:
      'Diseño de una pieza gráfica individual para redes sociales, adaptada a la identidad visual y al formato solicitado.',
    area: DmProductArea.DESIGN,
    pricingType: DmPricingType.PER_UNIT,
    basePrice: 50,
    currency: 'USD',
    unitName: 'publicación',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 3,
    estimatedDeliveryUnit: DmDeliveryUnit.BUSINESS_DAYS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 20,
  },
  {
    code: 'DES_SOCIAL_PACKAGE_12',
    name: 'Paquete de contenido para redes sociales',
    description:
      'Diseño de doce publicaciones para redes sociales con una línea visual consistente. Incluye adaptaciones básicas y una ronda de ajustes por pieza.',
    area: DmProductArea.DESIGN,
    pricingType: DmPricingType.FIXED,
    basePrice: 500,
    currency: 'USD',
    unitName: 'paquete',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 2,
    estimatedDeliveryUnit: DmDeliveryUnit.WEEKS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 30,
  },
  {
    code: 'DES_BRAND_IDENTITY',
    name: 'Identidad visual básica',
    description:
      'Desarrollo de identidad visual básica con logotipo, paleta de colores, selección tipográfica y guía breve de aplicación.',
    area: DmProductArea.DESIGN,
    pricingType: DmPricingType.FIXED,
    basePrice: 800,
    currency: 'USD',
    unitName: 'proyecto',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 3,
    estimatedDeliveryUnit: DmDeliveryUnit.WEEKS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 40,
  },
  {
    code: 'DES_PRESENTATION',
    name: 'Diseño de presentación comercial',
    description:
      'Diseño visual de una presentación comercial de hasta quince diapositivas, utilizando el contenido proporcionado por el cliente.',
    area: DmProductArea.DESIGN,
    pricingType: DmPricingType.FIXED,
    basePrice: 350,
    currency: 'USD',
    unitName: 'presentación',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 7,
    estimatedDeliveryUnit: DmDeliveryUnit.BUSINESS_DAYS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 50,
  },
  {
    code: 'DES_AI_IMAGE_PACK',
    name: 'Paquete de imágenes generadas con inteligencia artificial',
    description:
      'Creación de un paquete de diez imágenes generadas con inteligencia artificial y preparadas para uso digital.',
    area: DmProductArea.DESIGN,
    pricingType: DmPricingType.FIXED,
    basePrice: 250,
    currency: 'USD',
    unitName: 'paquete',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 5,
    estimatedDeliveryUnit: DmDeliveryUnit.BUSINESS_DAYS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 60,
  },
  {
    code: 'DEV_INFO_WEBSITE',
    name: 'Página web informativa',
    description:
      'Desarrollo de un sitio web informativo sin mantenimiento incluido. Contempla diseño responsive, secciones principales, formulario de contacto y despliegue inicial.',
    area: DmProductArea.DEVELOPMENT,
    pricingType: DmPricingType.FIXED,
    basePrice: 1000,
    currency: 'USD',
    unitName: 'sitio web',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 4,
    estimatedDeliveryUnit: DmDeliveryUnit.WEEKS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 70,
  },
  {
    code: 'DEV_LANDING_PAGE',
    name: 'Landing page',
    description:
      'Desarrollo de una página de aterrizaje responsive orientada a campañas, captación de contactos o presentación de un servicio.',
    area: DmProductArea.DEVELOPMENT,
    pricingType: DmPricingType.FIXED,
    basePrice: 650,
    currency: 'USD',
    unitName: 'landing page',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 2,
    estimatedDeliveryUnit: DmDeliveryUnit.WEEKS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 80,
  },
  {
    code: 'DEV_ECOMMERCE',
    name: 'Tienda en línea básica',
    description:
      'Desarrollo de una tienda en línea básica con catálogo, carrito de compras, configuración inicial de pagos y panel administrativo.',
    area: DmProductArea.DEVELOPMENT,
    pricingType: DmPricingType.FIXED,
    basePrice: 2500,
    currency: 'USD',
    unitName: 'tienda',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 8,
    estimatedDeliveryUnit: DmDeliveryUnit.WEEKS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 90,
  },
  {
    code: 'DEV_API_INTEGRATION',
    name: 'Integración con API externa',
    description:
      'Integración de una API externa dentro de una aplicación existente. El precio corresponde a una integración de complejidad básica o media.',
    area: DmProductArea.DEVELOPMENT,
    pricingType: DmPricingType.PER_UNIT,
    basePrice: 800,
    currency: 'USD',
    unitName: 'integración',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 3,
    estimatedDeliveryUnit: DmDeliveryUnit.WEEKS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 100,
  },
  {
    code: 'DEV_CHATBOT',
    name: 'Implementación de chatbot básico',
    description:
      'Configuración e implementación de un chatbot básico con flujo inicial, respuestas frecuentes y conexión a un canal definido.',
    area: DmProductArea.DEVELOPMENT,
    pricingType: DmPricingType.FIXED,
    basePrice: 1200,
    currency: 'USD',
    unitName: 'implementación',
    billingPeriod: DmBillingPeriod.ONE_TIME,
    estimatedDeliveryValue: 4,
    estimatedDeliveryUnit: DmDeliveryUnit.WEEKS,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 110,
  },
  {
    code: 'DEV_WEB_MAINTENANCE',
    name: 'Mantenimiento mensual de sitio web',
    description:
      'Servicio mensual de mantenimiento que incluye actualizaciones menores, revisión general, respaldo y soporte técnico básico.',
    area: DmProductArea.DEVELOPMENT,
    pricingType: DmPricingType.RECURRING,
    basePrice: 500,
    currency: 'USD',
    unitName: 'mes',
    billingPeriod: DmBillingPeriod.MONTHLY,
    estimatedDeliveryValue: null,
    estimatedDeliveryUnit: null,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 120,
  },
  {
    code: 'DEV_SUPPORT_HOURS',
    name: 'Bolsa de soporte técnico de diez horas',
    description:
      'Bolsa mensual de diez horas para correcciones, ajustes menores, soporte y acompañamiento técnico.',
    area: DmProductArea.DEVELOPMENT,
    pricingType: DmPricingType.RECURRING,
    basePrice: 450,
    currency: 'USD',
    unitName: 'bolsa mensual',
    billingPeriod: DmBillingPeriod.MONTHLY,
    estimatedDeliveryValue: null,
    estimatedDeliveryUnit: null,
    minimumQuantity: 1,
    isActive: true,
    displayOrder: 130,
  },
] satisfies Prisma.DmProductCreateInput[];

/**
 * Inserta o actualiza los productos iniciales dentro de una transacción.
 */
async function main(): Promise<void> {
  console.log('Iniciando carga de productos demo.');

  const operations = products.map((product) =>
    prisma.dmProduct.upsert({
      where: { code: product.code },
      update: {
        name: product.name,
        description: product.description,
        area: product.area,
        pricingType: product.pricingType,
        basePrice: product.basePrice,
        currency: product.currency,
        unitName: product.unitName,
        billingPeriod: product.billingPeriod,
        estimatedDeliveryValue: product.estimatedDeliveryValue,
        estimatedDeliveryUnit: product.estimatedDeliveryUnit,
        minimumQuantity: product.minimumQuantity,
        isActive: product.isActive,
        displayOrder: product.displayOrder,
      },
      create: product,
    }),
  );

  const seededProducts = await prisma.$transaction(operations);

  console.log(`Seed completada. Productos procesados: ${seededProducts.length}.`);
}

main()
  .catch((error: unknown) => {
    console.error('La seed no pudo completarse.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
