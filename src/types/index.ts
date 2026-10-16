export type Language = 'en' | 'fr';
export type CurrencyCode = 'KES' | 'USD';

export type UserRole = 'owner' | 'admin' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type ProductStatus =
  | 'draft'
  | 'available'
  | 'low_stock'
  | 'out_of_stock'
  | 'reserved'
  | 'sold'
  | 'hidden'
  | 'archived';

export type ProductCondition =
  | 'brand_new_thrift'
  | 'like_new'
  | 'excellent'
  | 'very_good'
  | 'good';

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  categoryId: string;
  subcategoryId?: string;
  brand?: string;
  condition: ProductCondition;
  size?: string;
  color?: string;
  material?: string;
  basePrice: number; // Stored in baseCurrency
  baseCurrency: CurrencyCode;
  costPrice?: number; // Restricted to owner/admin
  quantityOnHand: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  status: ProductStatus;
  featured: boolean;
  publicStockVisible?: boolean;
  images: string[];
  videos?: string[];
  supplierId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameFr: string;
  slug: string;
  imageUrl: string;
  subcategories: {
    id: string;
    nameEn: string;
    nameFr: string;
  }[];
}

export type CustomerType = 'wholesaler' | 'retailer' | 'individual';

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email?: string;
  preferredLanguage: Language;
  city: string;
  country: string;
  type: CustomerType;
  registrationDate: string;
  notes?: string;
  communicationConsent: boolean;
  totalPurchasesCount: number;
  totalSpentKes: number;
  totalSpentUsd: number;
  outstandingBalanceKes: number;
  outstandingBalanceUsd: number;
  lastPurchaseDate?: string;
  archived?: boolean;
}

export type CrmActivityType =
  | 'call'
  | 'whatsapp'
  | 'visit'
  | 'inquiry'
  | 'note';

export interface CrmActivity {
  id: string;
  customerId: string;
  type: CrmActivityType;
  title: string;
  details: string;
  createdAt: string;
  staffName: string;
}

export interface FollowUpReminder {
  id: string;
  customerId: string;
  customerName: string;
  dueDate: string;
  reminderNote: string;
  completed: boolean;
  staffName: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'cash'
  | 'mpesa'
  | 'bank_transfer'
  | 'card'
  | 'other';

export type PaymentStatus =
  | 'paid'
  | 'partial'
  | 'pending_verification'
  | 'refunded'
  | 'voided';

export interface SaleItem {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  currency: CurrencyCode;
  costPriceAtSale?: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  timestamp: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: CurrencyCode;
  exchangeRateUsed: number; // 1 USD = X KES
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  outstandingBalance: number;
  channel: 'physical_shop' | 'whatsapp' | 'phone' | 'direct_arrangement';
  notes?: string;
  refundedReason?: string;
}

export type InventoryAdjustmentReason =
  | 'stock_intake'
  | 'sale'
  | 'sale_refund'
  | 'damaged'
  | 'lost'
  | 'count_correction'
  | 'reservation'
  | 'release_reservation';

export interface InventoryMovement {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  quantityBefore: number;
  quantityChanged: number; // positive or negative
  quantityAfter: number;
  reason: InventoryAdjustmentReason;
  referenceId?: string; // sale id, intake id
  notes?: string;
  staffName: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

export interface StockIntake {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productSku: string;
  productName: string;
  quantityReceived: number;
  acquisitionCost: number;
  currency: CurrencyCode;
  deliveryReference: string;
  dateReceived: string;
  staffName: string;
  notes?: string;
}

export interface DeliveryDestination {
  id: string;
  city: string;
  country: string; // 'DR Congo' | 'Burundi' | 'Kenya'
  active: boolean;
  estimatedTransitTimeEn: string;
  estimatedTransitTimeFr: string;
  shippingNotesEn?: string;
  shippingNotesFr?: string;
  order: number;
}

export interface WebsiteSettings {
  defaultCurrency: CurrencyCode;
  defaultLanguage: Language;
  exchangeRateUsdToKes: number; // e.g. 130
  publicStockVisible: boolean;
  onlineCheckoutEnabled: boolean;
  maintenanceMode: boolean;
  heroHeadlineEn: string;
  heroHeadlineFr: string;
  heroSubtitleEn: string;
  heroSubtitleFr: string;
  aboutTextEn: string;
  aboutTextFr: string;
  whatsappNumber: string;
  contactEmail: string;
  businessLocation: string;
  primarySloganFr?: string;
  englishSlogan?: string;
  showAnnouncementBar?: boolean;
  announcementTextEn?: string;
  announcementTextFr?: string;

  // Commercial Documents Payment & Banking Settings (Configured in CMS & Settings)
  mpesaTillNumber?: string;
  mpesaPaybillNumber?: string;
  mpesaPaybillAccount?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountCurrency?: string;
  bankSwiftCode?: string;
  bankBranchNotes?: string;
  taxPinNumber?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export type CommercialDocumentType = 'quotation' | 'invoice' | 'receipt';

export type DocumentStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'paid'
  | 'partial'
  | 'cancelled';

export interface CommercialDocumentItem {
  id: string;
  description: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  total: number;
}

export interface CommercialDocument {
  id: string;
  documentNumber: string; // e.g. QUO-2026-001, INV-2026-001, REC-2026-001
  type: CommercialDocumentType;
  status: DocumentStatus;
  currency: CurrencyCode; // 'KES' | 'USD'
  exchangeRateUsed: number; // e.g. 130
  showDualCurrency: boolean;

  // Dates
  issueDate: string;
  dueDate?: string; // For invoices or quotation validity
  paymentDate?: string; // For receipts

  // Client details (can be filled manually or loaded from CRM)
  customerId?: string;
  clientName: string;
  clientCompany?: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  clientTaxPin?: string;

  // Issuer details (defaults to DABIN Fashion, manually editable)
  issuerName: string;
  issuerLocation: string;
  issuerPhone: string;
  issuerEmail: string;
  issuerTaxPin?: string;
  issuerBankName?: string;
  issuerBankAccount?: string;
  issuerBankSwift?: string;
  issuerMpesaPaybill?: string;
  issuerMpesaTill?: string;

  // Line items
  items: CommercialDocumentItem[];

  // Financial calculations
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxRatePercent: number; // e.g. 16 or 0
  taxAmount: number;
  shippingFee: number;
  total: number;
  amountPaid: number;
  balanceDue: number;

  // Payment details
  paymentMethod?: PaymentMethod | string;
  paymentReference?: string;

  // Notes & terms
  notes?: string;
  termsAndConditions?: string;
  signatureName?: string;
  includeDigitalStamp?: boolean;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type FinanceTransactionType = 'income' | 'expense';

export type FinanceCategory =
  | 'pos_sales'
  | 'wholesale_order'
  | 'cargo_shipping_income'
  | 'tailoring_services'
  | 'client_deposit'
  | 'other_income'
  | 'inventory_purchase'
  | 'freight_shipping'
  | 'customs_clearance'
  | 'rent_utilities'
  | 'salaries_commissions'
  | 'packaging_materials'
  | 'marketing_advertising'
  | 'financial_fees'
  | 'equipment_repairs'
  | 'taxes_licenses'
  | 'miscellaneous_expense';

export interface FinanceTransaction {
  id: string;
  type: FinanceTransactionType;
  category: FinanceCategory | string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  exchangeRateUsed: number;
  date: string;
  paymentMethod: PaymentMethod | string;
  referenceNumber?: string;
  paidToOrFrom?: string;
  notes?: string;
  status: 'completed' | 'pending' | 'cancelled';
  recordedBy: string;
  createdAt: string;
  relatedSaleId?: string;
  relatedIntakeId?: string;
  relatedDocumentId?: string;
}
