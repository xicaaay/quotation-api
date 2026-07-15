import {
  DmBillingPeriod,
  DmDeliveryUnit,
  DmPricingType,
  DmProductArea,
} from '../../../generated/prisma/client';

/**
 * Forma normalizada de un producto devuelto por la API.
 * El precio se entrega como número para facilitar su uso en el frontend.
 */
export interface ProductResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  area: DmProductArea;
  pricingType: DmPricingType;
  basePrice: number;
  currency: string;
  unitName: string;
  billingPeriod: DmBillingPeriod;
  estimatedDeliveryValue: number | null;
  estimatedDeliveryUnit: DmDeliveryUnit | null;
  minimumQuantity: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
