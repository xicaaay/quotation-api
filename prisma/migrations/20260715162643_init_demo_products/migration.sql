-- CreateEnum
CREATE TYPE "dm_product_area" AS ENUM ('DESIGN', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "dm_pricing_type" AS ENUM ('PER_UNIT', 'FIXED', 'RECURRING');

-- CreateEnum
CREATE TYPE "dm_billing_period" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "dm_delivery_unit" AS ENUM ('BUSINESS_DAYS', 'CALENDAR_DAYS', 'WEEKS', 'MONTHS');

-- CreateTable
CREATE TABLE "dm_products" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "area" "dm_product_area" NOT NULL,
    "pricing_type" "dm_pricing_type" NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "unit_name" VARCHAR(60) NOT NULL DEFAULT 'servicio',
    "billing_period" "dm_billing_period" NOT NULL DEFAULT 'ONE_TIME',
    "estimated_delivery_value" INTEGER,
    "estimated_delivery_unit" "dm_delivery_unit",
    "minimum_quantity" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "dm_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dm_products_code_key" ON "dm_products"("code");

-- CreateIndex
CREATE INDEX "dm_products_area_is_active_idx" ON "dm_products"("area", "is_active");

-- CreateIndex
CREATE INDEX "dm_products_pricing_type_is_active_idx" ON "dm_products"("pricing_type", "is_active");

-- CreateIndex
CREATE INDEX "dm_products_display_order_idx" ON "dm_products"("display_order");
