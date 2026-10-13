import {
  INITIAL_CATEGORIES,
  INITIAL_COMMERCIAL_DOCUMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_DESTINATIONS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_SUPPLIERS,
  INITIAL_USERS,
  OFFICIAL_BUSINESS_INFO,
} from '../constants/initialData';
import {
  AuditLog,
  Category,
  CommercialDocument,
  CommercialDocumentItem,
  CommercialDocumentType,
  CrmActivity,
  CurrencyCode,
  Customer,
  DeliveryDestination,
  DocumentStatus,
  FollowUpReminder,
  InventoryAdjustmentReason,
  InventoryMovement,
  Product,
  Sale,
  SaleItem,
  StockIntake,
  Supplier,
  User,
  WebsiteSettings,
} from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'dabin_fashion_products_v1',
  CATEGORIES: 'dabin_fashion_categories_v1',
  CUSTOMERS: 'dabin_fashion_customers_v1',
  ACTIVITIES: 'dabin_fashion_crm_activities_v1',
  REMINDERS: 'dabin_fashion_reminders_v1',
  SALES: 'dabin_fashion_sales_v1',
  INVENTORY_MOVEMENTS: 'dabin_fashion_movements_v1',
  SUPPLIERS: 'dabin_fashion_suppliers_v1',
  STOCK_INTAKES: 'dabin_fashion_intakes_v1',
  DESTINATIONS: 'dabin_fashion_destinations_v1',
  SETTINGS: 'dabin_fashion_settings_v1',
  USERS: 'dabin_fashion_users_v1',
  CURRENT_USER: 'dabin_fashion_current_user_v1',
  AUDIT_LOGS: 'dabin_fashion_audit_logs_v1',
  APP_LANGUAGE: 'dabin_fashion_lang_v1',
  APP_CURRENCY: 'dabin_fashion_currency_v1',
  COMMERCIAL_DOCUMENTS: 'dabin_fashion_documents_v1',
};

class StorageService {
  constructor() {
    this.initializeIfEmpty();
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage setItem failed:', e);
    }
  }

  public initializeIfEmpty(): void {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      this.setItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DESTINATIONS)) {
      this.setItem(STORAGE_KEYS.DESTINATIONS, INITIAL_DESTINATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
      this.setItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMERCIAL_DOCUMENTS)) {
      this.setItem(STORAGE_KEYS.COMMERCIAL_DOCUMENTS, INITIAL_COMMERCIAL_DOCUMENTS);
    }
    // Session is null by default; requires DABIN Staff authentication
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      // Seed an initial verified showroom sale
      const seedSale: Sale = {
        id: 'sale-seed-1',
        receiptNumber: 'DABIN-REC-2026-0001',
        timestamp: '2026-02-05T14:30:00Z',
        cashierId: 'user-cashier-3',
        cashierName: 'Jean-Luc Habimana',
        customerId: 'cust-1',
        customerName: 'Alain Kanyamihigo',
        customerPhone: '+243998123456',
        items: [
          {
            productId: 'prod-1',
            sku: 'DAB-JKT-001',
            productName: 'Vintage Heritage Trench Coat',
            quantity: 2,
            unitPrice: 4500,
            currency: 'KES',
            costPriceAtSale: 2200,
            totalPrice: 9000,
          },
        ],
        subtotal: 9000,
        discount: 0,
        total: 9000,
        currency: 'KES',
        exchangeRateUsed: 130,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        amountPaid: 9000,
        outstandingBalance: 0,
        channel: 'physical_shop',
        notes: 'Dispatched to Bukavu cargo forwarding.',
      };
      this.setItem(STORAGE_KEYS.SALES, [seedSale]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY_MOVEMENTS)) {
      const initialMovements: InventoryMovement[] = [
        {
          id: 'mov-init-1',
          productId: 'prod-1',
          productSku: 'DAB-JKT-001',
          productName: 'Vintage Heritage Trench Coat',
          quantityBefore: 6,
          quantityChanged: -2,
          quantityAfter: 4,
          reason: 'sale',
          referenceId: 'sale-seed-1',
          notes: 'Sold in showroom for Bukavu client',
          staffName: 'Jean-Luc Habimana',
          timestamp: '2026-02-05T14:30:00Z',
        },
      ];
      this.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, initialMovements);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      const initialActivities: CrmActivity[] = [
        {
          id: 'act-1',
          customerId: 'cust-1',
          type: 'whatsapp',
          title: 'Confirmed Bukavu Dispatch',
          details: 'Informed client of cargo carrier dispatch details and estimated arrival in 4 days.',
          staffName: 'Sarah Mwangi',
          createdAt: '2026-02-05T15:00:00Z',
        },
      ];
      this.setItem(STORAGE_KEYS.ACTIVITIES, initialActivities);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REMINDERS)) {
      this.setItem(STORAGE_KEYS.REMINDERS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_INTAKES)) {
      this.setItem(STORAGE_KEYS.STOCK_INTAKES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, [
        {
          id: 'audit-1',
          action: 'SYSTEM_INIT',
          details: 'DABIN Fashion database initialized with official Nairobi configuration.',
          userId: 'user-owner-1',
          userName: 'DABIN Director',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }

  // --- SETTINGS & CURRENCY ---
  public getSettings(): WebsiteSettings {
    return this.getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public updateSettings(updates: Partial<WebsiteSettings>): WebsiteSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    this.setItem(STORAGE_KEYS.SETTINGS, updated);
    this.logAudit('UPDATE_SETTINGS', 'Storefront and currency configuration updated');
    return updated;
  }

  public getExchangeRate(): number {
    return this.getSettings().exchangeRateUsdToKes || 130;
  }

  public convertPrice(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
    if (fromCurrency === toCurrency) return amount;
    const rate = this.getExchangeRate();
    if (fromCurrency === 'KES' && toCurrency === 'USD') {
      return Number((amount / rate).toFixed(2));
    }
    if (fromCurrency === 'USD' && toCurrency === 'KES') {
      return Math.round(amount * rate);
    }
    return amount;
  }

  public formatPrice(amount: number, currency: CurrencyCode): string {
    if (currency === 'KES') {
      return `Ksh ${Math.round(amount).toLocaleString('en-US')}`;
    }
    return `$ ${amount.toFixed(2)}`;
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.getItem(STORAGE_KEYS.PRODUCTS, []);
  }

  public getPublishedProducts(): Product[] {
    // Only published available/low_stock/out_of_stock products (NOT draft, hidden, archived)
    return this.getProducts().filter(
      (p) => p.status !== 'draft' && p.status !== 'hidden' && p.status !== 'archived'
    );
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  public saveProduct(product: Partial<Product> & { id?: string }): Product {
    const products = this.getProducts();
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();

    if (product.id) {
      const index = products.findIndex((p) => p.id === product.id);
      if (index !== -1) {
        const existing = products[index];
        const updated: Product = {
          ...existing,
          ...product,
          updatedAt: now,
        };
        // Auto-recalculate status if inventory changed
        const available = Math.max(0, updated.quantityOnHand - updated.reservedQuantity);
        if (updated.status !== 'draft' && updated.status !== 'hidden' && updated.status !== 'archived') {
          if (available === 0) {
            updated.status = 'out_of_stock';
          } else if (available <= updated.lowStockThreshold) {
            updated.status = 'low_stock';
          } else {
            updated.status = 'available';
          }
        }
        products[index] = updated;
        this.setItem(STORAGE_KEYS.PRODUCTS, products);
        this.logAudit('UPDATE_PRODUCT', `Updated product ${updated.nameEn} (SKU: ${updated.sku})`);
        return updated;
      }
    }

    // New product
    const newId = `prod-${Date.now()}`;
    const qty = product.quantityOnHand || 0;
    const reserved = product.reservedQuantity || 0;
    const available = Math.max(0, qty - reserved);

    let calculatedStatus = product.status || 'available';
    if (calculatedStatus !== 'draft' && calculatedStatus !== 'hidden' && calculatedStatus !== 'archived') {
      if (available === 0) calculatedStatus = 'out_of_stock';
      else if (available <= (product.lowStockThreshold || 2)) calculatedStatus = 'low_stock';
      else calculatedStatus = 'available';
    }

    const newProduct: Product = {
      id: newId,
      sku: product.sku || `DAB-${Math.floor(1000 + Math.random() * 9000)}`,
      nameEn: product.nameEn || 'Untitled Product',
      nameFr: product.nameFr || 'Produit sans titre',
      descriptionEn: product.descriptionEn || '',
      descriptionFr: product.descriptionFr || '',
      categoryId: product.categoryId || 'cat-clothes',
      subcategoryId: product.subcategoryId,
      brand: product.brand,
      condition: product.condition || 'excellent',
      size: product.size,
      color: product.color,
      material: product.material,
      basePrice: typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 1000,
      baseCurrency: product.baseCurrency || 'KES',
      costPrice: typeof product.costPrice === 'number' && !isNaN(product.costPrice) ? product.costPrice : Math.round((product.basePrice || 1000) * 0.5),
      quantityOnHand: qty,
      reservedQuantity: reserved,
      lowStockThreshold: product.lowStockThreshold ?? 2,
      status: calculatedStatus,
      featured: product.featured ?? false,
      publicStockVisible: product.publicStockVisible ?? true,
      images:
        product.images && product.images.length > 0
          ? product.images
          : ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80'],
      videos: product.videos || [],
      supplierId: product.supplierId,
      notes: product.notes,
      createdAt: now,
      updatedAt: now,
    };

    products.unshift(newProduct);
    this.setItem(STORAGE_KEYS.PRODUCTS, products);

    // Record initial inventory movement if quantity > 0
    if (qty > 0) {
      this.recordInventoryMovement({
        productId: newProduct.id,
        productSku: newProduct.sku,
        productName: newProduct.nameEn,
        quantityBefore: 0,
        quantityChanged: qty,
        quantityAfter: qty,
        reason: 'stock_intake',
        staffName: currentUser?.name || 'Staff',
        notes: 'Initial product stock creation',
      });
    }

    this.logAudit('CREATE_PRODUCT', `Created product ${newProduct.nameEn} (SKU: ${newProduct.sku})`);
    return newProduct;
  }

  public deleteProductSafe(productId: string): { success: boolean; message: string } {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, message: 'Product not found' };

    // Check if referenced by completed sales
    const sales = this.getSales();
    const isReferencedInSales = sales.some((s) =>
      s.items.some((i) => i.productId === productId)
    );

    if (isReferencedInSales) {
      // Safe archival instead of hard delete
      product.status = 'archived';
      product.updatedAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.PRODUCTS, products);
      this.logAudit(
        'ARCHIVE_PRODUCT',
        `Product ${product.nameEn} (${product.sku}) archived to preserve past transaction history.`
      );
      return {
        success: true,
        message: 'Product is linked to sales history and has been safely archived instead of deleted.',
      };
    }

    // Safe to permanently delete if never sold
    const filtered = products.filter((p) => p.id !== productId);
    this.setItem(STORAGE_KEYS.PRODUCTS, filtered);
    this.logAudit('DELETE_PRODUCT', `Permanently deleted unsold product ${product.nameEn}`);
    return { success: true, message: 'Product deleted permanently.' };
  }

  // --- INVENTORY ADJUSTMENT ---
  public adjustInventory(
    productId: string,
    newQuantity: number,
    reason: InventoryAdjustmentReason,
    notes?: string
  ): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) throw new Error('Product not found');

    const product = products[index];
    const prevQty = product.quantityOnHand;
    const diff = newQuantity - prevQty;
    product.quantityOnHand = Math.max(0, newQuantity);
    product.updatedAt = new Date().toISOString();

    // Auto-update status
    const available = Math.max(0, product.quantityOnHand - product.reservedQuantity);
    if (product.status !== 'draft' && product.status !== 'hidden' && product.status !== 'archived') {
      if (available === 0) product.status = 'out_of_stock';
      else if (available <= product.lowStockThreshold) product.status = 'low_stock';
      else product.status = 'available';
    }

    products[index] = product;
    this.setItem(STORAGE_KEYS.PRODUCTS, products);

    const currentUser = this.getCurrentUser();
    this.recordInventoryMovement({
      productId: product.id,
      productSku: product.sku,
      productName: product.nameEn,
      quantityBefore: prevQty,
      quantityChanged: diff,
      quantityAfter: product.quantityOnHand,
      reason,
      notes: notes || `Manual stock adjustment to ${newQuantity}`,
      staffName: currentUser?.name || 'Staff',
    });

    this.logAudit(
      'ADJUST_INVENTORY',
      `Adjusted ${product.sku} stock from ${prevQty} to ${product.quantityOnHand}. Reason: ${reason}`
    );

    return product;
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return this.getItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  public saveCategory(category: Category): void {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === category.id);
    if (index !== -1) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  // --- POS & SALES ENGINE ---
  public getSales(): Sale[] {
    return this.getItem(STORAGE_KEYS.SALES, []);
  }

  public recordSale(saleData: {
    items: { productId: string; quantity: number }[];
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    currency: CurrencyCode;
    paymentMethod: Sale['paymentMethod'];
    paymentStatus: Sale['paymentStatus'];
    amountPaid: number;
    channel: Sale['channel'];
    notes?: string;
  }): { success: boolean; sale?: Sale; error?: string } {
    const products = this.getProducts();
    const saleItems: SaleItem[] = [];
    let subtotal = 0;
    const rate = this.getExchangeRate();
    const currentUser = this.getCurrentUser();

    // Validate inventory stock first
    for (const req of saleData.items) {
      const prod = products.find((p) => p.id === req.productId);
      if (!prod) {
        return { success: false, error: `Product ID ${req.productId} not found.` };
      }
      const available = Math.max(0, prod.quantityOnHand - prod.reservedQuantity);
      if (available < req.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.nameEn}" (${prod.sku}). Available: ${available}, requested: ${req.quantity}.`,
        };
      }

      // Convert unit price to transaction currency
      const unitPriceInTxCurrency = this.convertPrice(prod.basePrice, prod.baseCurrency, saleData.currency);
      const totalItemPrice = unitPriceInTxCurrency * req.quantity;
      subtotal += totalItemPrice;

      saleItems.push({
        productId: prod.id,
        sku: prod.sku,
        productName: prod.nameEn,
        quantity: req.quantity,
        unitPrice: unitPriceInTxCurrency,
        currency: saleData.currency,
        costPriceAtSale: prod.costPrice,
        totalPrice: totalItemPrice,
      });
    }

    const total = subtotal;
    const amountPaid = Math.min(total, Math.max(0, saleData.amountPaid));
    const outstandingBalance = Math.max(0, total - amountPaid);

    const now = new Date();
    const dateStr = now.toISOString();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `DABIN-REC-${now.getFullYear()}-${randomDigits}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receiptNumber,
      timestamp: dateStr,
      cashierId: currentUser?.id || 'cashier-anon',
      cashierName: currentUser?.name || 'Cashier Desk',
      customerId: saleData.customerId,
      customerName: saleData.customerName || (saleData.customerId ? undefined : 'Walk-in Customer'),
      customerPhone: saleData.customerPhone,
      items: saleItems,
      subtotal,
      discount: 0,
      total,
      currency: saleData.currency,
      exchangeRateUsed: rate,
      paymentMethod: saleData.paymentMethod,
      paymentStatus:
        outstandingBalance === 0
          ? 'paid'
          : saleData.paymentStatus === 'pending_verification'
          ? 'pending_verification'
          : 'partial',
      amountPaid,
      outstandingBalance,
      channel: saleData.channel,
      notes: saleData.notes,
    };

    // 1. Deduct Inventory At-Once
    for (const item of saleItems) {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      if (pIndex !== -1) {
        const prod = products[pIndex];
        const before = prod.quantityOnHand;
        prod.quantityOnHand = Math.max(0, prod.quantityOnHand - item.quantity);
        prod.updatedAt = dateStr;

        const available = Math.max(0, prod.quantityOnHand - prod.reservedQuantity);
        if (prod.status !== 'draft' && prod.status !== 'hidden' && prod.status !== 'archived') {
          if (available === 0) prod.status = 'out_of_stock';
          else if (available <= prod.lowStockThreshold) prod.status = 'low_stock';
          else prod.status = 'available';
        }

        products[pIndex] = prod;

        this.recordInventoryMovement({
          productId: prod.id,
          productSku: prod.sku,
          productName: prod.nameEn,
          quantityBefore: before,
          quantityChanged: -item.quantity,
          quantityAfter: prod.quantityOnHand,
          reason: 'sale',
          referenceId: newSale.id,
          staffName: currentUser?.name || 'Cashier Desk',
          notes: `POS Sale Receipt ${receiptNumber}`,
        });
      }
    }
    this.setItem(STORAGE_KEYS.PRODUCTS, products);

    // 2. Save Sale
    const sales = this.getSales();
    sales.unshift(newSale);
    this.setItem(STORAGE_KEYS.SALES, sales);

    // 3. Update Customer History if linked
    if (saleData.customerId) {
      const customers = this.getCustomers();
      const cIndex = customers.findIndex((c) => c.id === saleData.customerId);
      if (cIndex !== -1) {
        const cust = customers[cIndex];
        cust.totalPurchasesCount += 1;
        cust.lastPurchaseDate = dateStr;

        if (saleData.currency === 'KES') {
          cust.totalSpentKes += total;
          cust.outstandingBalanceKes += outstandingBalance;
        } else {
          cust.totalSpentUsd += total;
          cust.outstandingBalanceUsd += outstandingBalance;
        }

        customers[cIndex] = cust;
        this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    this.logAudit(
      'RECORD_SALE',
      `Completed sale ${receiptNumber} (${this.formatPrice(total, saleData.currency)}) via ${saleData.channel}`
    );

    return { success: true, sale: newSale };
  }

  public refundSale(saleId: string, reason: string): { success: boolean; message: string } {
    const sales = this.getSales();
    const sIndex = sales.findIndex((s) => s.id === saleId);
    if (sIndex === -1) return { success: false, message: 'Sale not found.' };

    const sale = sales[sIndex];
    if (sale.paymentStatus === 'refunded' || sale.paymentStatus === 'voided') {
      return { success: false, message: 'Sale has already been refunded or voided.' };
    }

    sale.paymentStatus = 'refunded';
    sale.refundedReason = reason;
    sales[sIndex] = sale;
    this.setItem(STORAGE_KEYS.SALES, sales);

    // Restore stock to inventory
    const products = this.getProducts();
    const currentUser = this.getCurrentUser();

    for (const item of sale.items) {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      if (pIndex !== -1) {
        const prod = products[pIndex];
        const before = prod.quantityOnHand;
        prod.quantityOnHand += item.quantity;
        prod.updatedAt = new Date().toISOString();

        // recalculate status
        const available = Math.max(0, prod.quantityOnHand - prod.reservedQuantity);
        if (prod.status === 'out_of_stock' && available > 0) {
          prod.status = available <= prod.lowStockThreshold ? 'low_stock' : 'available';
        }

        products[pIndex] = prod;

        this.recordInventoryMovement({
          productId: prod.id,
          productSku: prod.sku,
          productName: prod.nameEn,
          quantityBefore: before,
          quantityChanged: item.quantity,
          quantityAfter: prod.quantityOnHand,
          reason: 'sale_refund',
          referenceId: sale.id,
          staffName: currentUser?.name || 'Staff',
          notes: `Refund for Receipt ${sale.receiptNumber}: ${reason}`,
        });
      }
    }
    this.setItem(STORAGE_KEYS.PRODUCTS, products);

    this.logAudit('REFUND_SALE', `Refunded sale ${sale.receiptNumber}. Reason: ${reason}`);
    return { success: true, message: 'Sale successfully refunded and items restored to inventory.' };
  }

  // --- CRM & CUSTOMERS ---
  public getCustomers(): Customer[] {
    return this.getItem(STORAGE_KEYS.CUSTOMERS, []);
  }

  public saveCustomer(customer: Partial<Customer> & { id?: string }): Customer {
    const customers = this.getCustomers();
    const now = new Date().toISOString();

    if (customer.id) {
      const index = customers.findIndex((c) => c.id === customer.id);
      if (index !== -1) {
        const updated = { ...customers[index], ...customer };
        customers[index] = updated;
        this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
        this.logAudit('UPDATE_CUSTOMER', `Updated client ${updated.fullName}`);
        return updated;
      }
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      fullName: customer.fullName || 'New Customer',
      phone: customer.phone || '',
      whatsappNumber: customer.whatsappNumber || customer.phone || '',
      email: customer.email,
      preferredLanguage: customer.preferredLanguage || 'fr',
      city: customer.city || 'Nairobi',
      country: customer.country || 'Kenya',
      type: customer.type || 'individual',
      registrationDate: now,
      notes: customer.notes,
      communicationConsent: customer.communicationConsent ?? true,
      totalPurchasesCount: 0,
      totalSpentKes: 0,
      totalSpentUsd: 0,
      outstandingBalanceKes: 0,
      outstandingBalanceUsd: 0,
    };

    customers.unshift(newCustomer);
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
    this.logAudit('CREATE_CUSTOMER', `Registered customer ${newCustomer.fullName} (${newCustomer.city})`);
    return newCustomer;
  }

  // --- CRM ACTIVITIES & REMINDERS ---
  public getCrmActivities(customerId?: string): CrmActivity[] {
    const all = this.getItem(STORAGE_KEYS.ACTIVITIES, []);
    if (!customerId) return all;
    return all.filter((a: CrmActivity) => a.customerId === customerId);
  }

  public addCrmActivity(activity: Omit<CrmActivity, 'id' | 'createdAt'>): CrmActivity {
    const activities = this.getItem<CrmActivity[]>(STORAGE_KEYS.ACTIVITIES, []);
    const newAct: CrmActivity = {
      ...activity,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    activities.unshift(newAct);
    this.setItem(STORAGE_KEYS.ACTIVITIES, activities);
    return newAct;
  }

  public getReminders(): FollowUpReminder[] {
    return this.getItem(STORAGE_KEYS.REMINDERS, []);
  }

  public saveReminder(reminder: Omit<FollowUpReminder, 'id' | 'createdAt'>): FollowUpReminder {
    const reminders = this.getReminders();
    const newRem: FollowUpReminder = {
      ...reminder,
      id: `rem-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    reminders.unshift(newRem);
    this.setItem(STORAGE_KEYS.REMINDERS, reminders);
    return newRem;
  }

  public toggleReminder(id: string): void {
    const reminders = this.getReminders();
    const index = reminders.findIndex((r) => r.id === id);
    if (index !== -1) {
      reminders[index].completed = !reminders[index].completed;
      this.setItem(STORAGE_KEYS.REMINDERS, reminders);
    }
  }

  // --- SUPPLIERS & STOCK INTAKE ---
  public getSuppliers(): Supplier[] {
    return this.getItem(STORAGE_KEYS.SUPPLIERS, []);
  }

  public saveSupplier(supplier: Partial<Supplier> & { id?: string }): Supplier {
    const suppliers = this.getSuppliers();
    if (supplier.id) {
      const idx = suppliers.findIndex((s) => s.id === supplier.id);
      if (idx !== -1) {
        suppliers[idx] = { ...suppliers[idx], ...supplier };
        this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
        return suppliers[idx];
      }
    }
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: supplier.name || 'New Supplier',
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      whatsappNumber: supplier.whatsappNumber,
      email: supplier.email,
      location: supplier.location,
      notes: supplier.notes,
      createdAt: new Date().toISOString(),
    };
    suppliers.push(newSup);
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    this.logAudit('CREATE_SUPPLIER', `Added supplier ${newSup.name}`);
    return newSup;
  }

  public getStockIntakes(): StockIntake[] {
    return this.getItem(STORAGE_KEYS.STOCK_INTAKES, []);
  }

  public recordStockIntake(intake: Omit<StockIntake, 'id'>): StockIntake {
    const intakes = this.getStockIntakes();
    const newIntake: StockIntake = {
      ...intake,
      id: `intake-${Date.now()}`,
    };
    intakes.unshift(newIntake);
    this.setItem(STORAGE_KEYS.STOCK_INTAKES, intakes);

    // Increase product inventory on hand
    const products = this.getProducts();
    const pIndex = products.findIndex((p) => p.id === intake.productId);
    if (pIndex !== -1) {
      const prod = products[pIndex];
      const before = prod.quantityOnHand;
      prod.quantityOnHand += intake.quantityReceived;
      if (intake.acquisitionCost > 0) {
        prod.costPrice = intake.acquisitionCost;
      }
      prod.updatedAt = new Date().toISOString();

      // Recalculate status
      const available = Math.max(0, prod.quantityOnHand - prod.reservedQuantity);
      if (prod.status === 'out_of_stock' && available > 0) {
        prod.status = available <= prod.lowStockThreshold ? 'low_stock' : 'available';
      }

      products[pIndex] = prod;
      this.setItem(STORAGE_KEYS.PRODUCTS, products);

      this.recordInventoryMovement({
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.nameEn,
        quantityBefore: before,
        quantityChanged: intake.quantityReceived,
        quantityAfter: prod.quantityOnHand,
        reason: 'stock_intake',
        referenceId: newIntake.id,
        staffName: intake.staffName,
        notes: `Intake from ${intake.supplierName}. Ref: ${intake.deliveryReference}`,
      });
    }

    this.logAudit(
      'STOCK_INTAKE',
      `Received ${intake.quantityReceived} units of ${intake.productName} from ${intake.supplierName}`
    );

    return newIntake;
  }

  // --- INVENTORY MOVEMENTS AUDIT ---
  public getInventoryMovements(): InventoryMovement[] {
    return this.getItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
  }

  public recordInventoryMovement(mov: Omit<InventoryMovement, 'id' | 'timestamp'>): void {
    const movements = this.getInventoryMovements();
    const newMov: InventoryMovement = {
      ...mov,
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    movements.unshift(newMov);
    this.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements.slice(0, 500)); // Keep last 500
  }

  // --- DESTINATIONS ---
  public getDestinations(): DeliveryDestination[] {
    return this.getItem(STORAGE_KEYS.DESTINATIONS, INITIAL_DESTINATIONS);
  }

  public saveDestination(destination: DeliveryDestination): void {
    const list = this.getDestinations();
    const idx = list.findIndex((d) => d.id === destination.id);
    if (idx !== -1) {
      list[idx] = destination;
    } else {
      list.push(destination);
    }
    this.setItem(STORAGE_KEYS.DESTINATIONS, list);
    this.logAudit('UPDATE_DESTINATION', `Updated delivery city ${destination.city} (${destination.country})`);
  }

  // --- AUTH & USERS ---
  public getUsers(): User[] {
    return this.getItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public getCurrentUser(): User | null {
    const user = this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (user && user.email?.trim().toLowerCase() !== 'dabin.fashion.co.ke@gmail.com') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return null;
    }
    return user;
  }

  public validateStaffLogin(
    email: string,
    pass: string
  ): { success: boolean; user?: User; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    // Authorized login requested by user:
    // E-mail: dabin.fashion.co.ke@gmail.com ; Password: Dabinfashion.77
    if (
      cleanEmail === 'dabin.fashion.co.ke@gmail.com' &&
      pass === 'Dabinfashion.77'
    ) {
      const users = this.getUsers();
      const ownerUser = users.find(
        (u) => u.email.toLowerCase() === 'dabin.fashion.co.ke@gmail.com'
      ) || {
        id: 'user-owner-1',
        name: 'DABIN Director (Owner)',
        email: 'dabin.fashion.co.ke@gmail.com',
        role: 'owner',
        createdAt: '2026-01-15T08:00:00Z',
      };
      this.setCurrentUser(ownerUser);
      this.logAudit('USER_LOGIN', `Authorized DABIN Staff portal login for ${ownerUser.email}`);
      return { success: true, user: ownerUser };
    }

    return {
      success: false,
      error: 'Invalid credentials. Access restricted to authorized DABIN Staff.',
    };
  }

  public setCurrentUser(user: User | null): void {
    if (user) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.getItem(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public logAudit(action: string, details: string): void {
    const logs = this.getAuditLogs();
    const currentUser = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      action,
      details,
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'System',
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 300));
  }

  // --- WHATSAPP CLICK-TO-CHAT URL BUILDER ---
  public getWhatsAppLink(message: string): string {
    // International WhatsApp number +254181740330 -> cleaned 254181740330
    const rawNumber = OFFICIAL_BUSINESS_INFO.whatsappRaw.replace(/[^0-9]/g, '');
    return `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
  }

  public generateProductInquiryMessage(productName: string, sku: string, lang: 'en' | 'fr'): string {
    if (lang === 'fr') {
      return `Bonjour DABIN Fashion, je suis intéressé(e) par ${productName}, référence ${sku}. Est-il disponible ?`;
    }
    return `Hello DABIN Fashion, I am interested in ${productName}, SKU ${sku}. Is it available?`;
  }

  public generateDestinationInquiryMessage(city: string, country: string, lang: 'en' | 'fr'): string {
    if (lang === 'fr') {
      return `Bonjour DABIN Fashion, je suis intéressé(e) par vos produits et souhaiterais connaître les possibilités de livraison à ${city}, ${country}. Merci de m'indiquer les options d'expédition et les frais applicables.`;
    }
    return `Hello DABIN Fashion, I am interested in your products and would like to know about delivery to ${city}, ${country}. Please share the available shipping options and costs.`;
  }

  // --- CSV EXPORTS ---
  public exportSalesCsv(): void {
    const sales = this.getSales();
    const headers = [
      'Receipt #',
      'Date',
      'Cashier',
      'Customer',
      'Items Count',
      'Total',
      'Currency',
      'Payment Method',
      'Payment Status',
      'Channel',
    ];
    const rows = sales.map((s) => [
      s.receiptNumber,
      new Date(s.timestamp).toLocaleDateString(),
      s.cashierName,
      s.customerName || 'Walk-in',
      s.items.reduce((acc, i) => acc + i.quantity, 0),
      s.total,
      s.currency,
      s.paymentMethod,
      s.paymentStatus,
      s.channel,
    ]);
    this.downloadCsv([headers, ...rows], `dabin_fashion_sales_${Date.now()}.csv`);
  }

  public exportInventoryCsv(): void {
    const products = this.getProducts();
    const headers = [
      'SKU',
      'Name (EN)',
      'Name (FR)',
      'Category',
      'Condition',
      'Base Price',
      'Currency',
      'Cost Price',
      'Quantity On Hand',
      'Reserved Qty',
      'Available Qty',
      'Status',
    ];
    const rows = products.map((p) => [
      p.sku,
      `"${p.nameEn.replace(/"/g, '""')}"`,
      `"${p.nameFr.replace(/"/g, '""')}"`,
      p.categoryId,
      p.condition,
      p.basePrice,
      p.baseCurrency,
      p.costPrice || 0,
      p.quantityOnHand,
      p.reservedQuantity,
      Math.max(0, p.quantityOnHand - p.reservedQuantity),
      p.status,
    ]);
    this.downloadCsv([headers, ...rows], `dabin_fashion_inventory_${Date.now()}.csv`);
  }

  public exportCustomersCsv(): void {
    const customers = this.getCustomers();
    const headers = [
      'Full Name',
      'Phone',
      'WhatsApp',
      'City',
      'Country',
      'Category (CRM Only)',
      'Language',
      'Total Purchases',
      'Total Spent KES',
      'Total Spent USD',
      'Outstanding Balance KES',
    ];
    const rows = customers.map((c) => [
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.phone,
      c.whatsappNumber,
      c.city,
      c.country,
      c.type,
      c.preferredLanguage,
      c.totalPurchasesCount,
      c.totalSpentKes,
      c.totalSpentUsd,
      c.outstandingBalanceKes,
    ]);
    this.downloadCsv([headers, ...rows], `dabin_fashion_customers_${Date.now()}.csv`);
  }

  private downloadCsv(data: (string | number)[][], filename: string): void {
    const csvContent =
      'data:text/csv;charset=utf-8,' + data.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- COMMERCIAL DOCUMENTS (QUOTATIONS, INVOICES, RECEIPTS) ---
  public getCommercialDocuments(): CommercialDocument[] {
    return this.getItem<CommercialDocument[]>(STORAGE_KEYS.COMMERCIAL_DOCUMENTS, []);
  }

  public getCommercialDocumentById(id: string): CommercialDocument | null {
    const list = this.getCommercialDocuments();
    return list.find((d) => d.id === id) || null;
  }

  public getNextDocumentNumber(type: CommercialDocumentType): string {
    const docs = this.getCommercialDocuments().filter((d) => d.type === type);
    const prefix = type === 'quotation' ? 'QUO' : type === 'invoice' ? 'INV' : 'REC';
    const year = new Date().getFullYear();
    const count = docs.length + 1;
    const padded = String(count).padStart(3, '0');
    return `${prefix}-${year}-${padded}`;
  }

  public saveCommercialDocument(
    docData: Partial<CommercialDocument> & { type: CommercialDocumentType; clientName: string }
  ): CommercialDocument {
    const docs = this.getCommercialDocuments();
    const isNew = !docData.id;
    const now = new Date().toISOString();
    const settings = this.getSettings();
    const currentUser = this.getCurrentUser();

    const id = docData.id || `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const documentNumber = docData.documentNumber || this.getNextDocumentNumber(docData.type);
    const currency = docData.currency || 'KES';
    const exchangeRateUsed = docData.exchangeRateUsed || settings.exchangeRateUsdToKes || 130;

    const fullDoc: CommercialDocument = {
      id,
      documentNumber,
      type: docData.type,
      status: docData.status || (docData.type === 'receipt' ? 'paid' : 'draft'),
      currency,
      exchangeRateUsed,
      showDualCurrency: docData.showDualCurrency ?? true,
      issueDate: docData.issueDate || now.split('T')[0],
      dueDate: docData.dueDate,
      paymentDate: docData.paymentDate || (docData.type === 'receipt' ? now.split('T')[0] : undefined),
      customerId: docData.customerId,
      clientName: docData.clientName,
      clientCompany: docData.clientCompany,
      clientPhone: docData.clientPhone || '',
      clientEmail: docData.clientEmail,
      clientAddress: docData.clientAddress,
      clientTaxPin: docData.clientTaxPin,
      issuerName: docData.issuerName || OFFICIAL_BUSINESS_INFO.name,
      issuerLocation: docData.issuerLocation || OFFICIAL_BUSINESS_INFO.location,
      issuerPhone: docData.issuerPhone || OFFICIAL_BUSINESS_INFO.phone,
      issuerEmail: docData.issuerEmail || OFFICIAL_BUSINESS_INFO.email,
      issuerTaxPin: docData.issuerTaxPin !== undefined ? docData.issuerTaxPin : (settings.taxPinNumber || ''),
      issuerBankName: docData.issuerBankName !== undefined ? docData.issuerBankName : (settings.bankName || ''),
      issuerBankAccount:
        docData.issuerBankAccount !== undefined
          ? docData.issuerBankAccount
          : (settings.bankAccountNumber || ''),
      issuerBankSwift: docData.issuerBankSwift !== undefined ? docData.issuerBankSwift : (settings.bankSwiftCode || ''),
      issuerMpesaPaybill:
        docData.issuerMpesaPaybill !== undefined
          ? docData.issuerMpesaPaybill
          : (settings.mpesaPaybillNumber
              ? (settings.mpesaPaybillAccount
                  ? `${settings.mpesaPaybillNumber} (A/C: ${settings.mpesaPaybillAccount})`
                  : settings.mpesaPaybillNumber)
              : ''),
      issuerMpesaTill: docData.issuerMpesaTill !== undefined ? docData.issuerMpesaTill : (settings.mpesaTillNumber || ''),
      items: docData.items || [],
      subtotal: docData.subtotal ?? 0,
      discountType: docData.discountType || 'fixed',
      discountValue: docData.discountValue ?? 0,
      discountAmount: docData.discountAmount ?? 0,
      taxRatePercent: docData.taxRatePercent ?? 0,
      taxAmount: docData.taxAmount ?? 0,
      shippingFee: docData.shippingFee ?? 0,
      total: docData.total ?? 0,
      amountPaid: docData.amountPaid ?? 0,
      balanceDue: docData.balanceDue ?? 0,
      paymentMethod: docData.paymentMethod,
      paymentReference: docData.paymentReference,
      notes: docData.notes,
      termsAndConditions: docData.termsAndConditions,
      signatureName: docData.signatureName || 'DABIN Fashion House Management',
      includeDigitalStamp: docData.includeDigitalStamp ?? true,
      createdAt: docData.createdAt || now,
      updatedAt: now,
      createdBy: docData.createdBy || currentUser?.name || 'DABIN Staff',
    };

    const existingIdx = docs.findIndex((d) => d.id === id);
    if (existingIdx >= 0) {
      docs[existingIdx] = fullDoc;
    } else {
      docs.unshift(fullDoc);
    }

    this.setItem(STORAGE_KEYS.COMMERCIAL_DOCUMENTS, docs);
    this.logAudit(
      isNew ? 'CREATE_DOCUMENT' : 'UPDATE_DOCUMENT',
      `Saved ${fullDoc.type.toUpperCase()} #${fullDoc.documentNumber} for ${fullDoc.clientName} (${fullDoc.currency} ${fullDoc.total})`
    );

    return fullDoc;
  }

  public deleteCommercialDocument(id: string): boolean {
    const docs = this.getCommercialDocuments();
    const filtered = docs.filter((d) => d.id !== id);
    if (filtered.length !== docs.length) {
      this.setItem(STORAGE_KEYS.COMMERCIAL_DOCUMENTS, filtered);
      this.logAudit('DELETE_DOCUMENT', `Deleted commercial document ID: ${id}`);
      return true;
    }
    return false;
  }

  public convertCommercialDocument(sourceId: string, targetType: CommercialDocumentType): CommercialDocument | null {
    const source = this.getCommercialDocumentById(sourceId);
    if (!source) return null;

    const newDocNumber = this.getNextDocumentNumber(targetType);
    const now = new Date().toISOString().split('T')[0];

    const convertedDoc = this.saveCommercialDocument({
      ...source,
      id: undefined,
      documentNumber: newDocNumber,
      type: targetType,
      status: targetType === 'receipt' ? 'paid' : targetType === 'invoice' ? 'sent' : 'draft',
      issueDate: now,
      paymentDate: targetType === 'receipt' ? now : undefined,
      dueDate:
        targetType === 'invoice'
          ? new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
          : targetType === 'quotation'
          ? new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
          : undefined,
      amountPaid: targetType === 'receipt' ? source.total : source.amountPaid,
      balanceDue: targetType === 'receipt' ? 0 : Math.max(0, source.total - (source.amountPaid || 0)),
      notes: `Generated from ${source.type.toUpperCase()} #${source.documentNumber}. ${source.notes || ''}`.trim(),
    });

    return convertedDoc;
  }

  // --- DATABASE JSON BACKUP / RESTORE ---
  public exportFullDatabase(): string {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      categories: this.getCategories(),
      customers: this.getCustomers(),
      sales: this.getSales(),
      inventoryMovements: this.getInventoryMovements(),
      suppliers: this.getSuppliers(),
      stockIntakes: this.getStockIntakes(),
      destinations: this.getDestinations(),
      settings: this.getSettings(),
      activities: this.getItem(STORAGE_KEYS.ACTIVITIES, []),
      reminders: this.getReminders(),
      auditLogs: this.getAuditLogs(),
      commercialDocuments: this.getCommercialDocuments(),
    };
    return JSON.stringify(fullBackup, null, 2);
  }

  public restoreDatabaseFromJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !Array.isArray(data.products)) return false;

      if (data.products) this.setItem(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.categories) this.setItem(STORAGE_KEYS.CATEGORIES, data.categories);
      if (data.customers) this.setItem(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.sales) this.setItem(STORAGE_KEYS.SALES, data.sales);
      if (data.inventoryMovements) this.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, data.inventoryMovements);
      if (data.suppliers) this.setItem(STORAGE_KEYS.SUPPLIERS, data.suppliers);
      if (data.stockIntakes) this.setItem(STORAGE_KEYS.STOCK_INTAKES, data.stockIntakes);
      if (data.destinations) this.setItem(STORAGE_KEYS.DESTINATIONS, data.destinations);
      if (data.settings) this.setItem(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.commercialDocuments) this.setItem(STORAGE_KEYS.COMMERCIAL_DOCUMENTS, data.commercialDocuments);

      this.logAudit('RESTORE_DATABASE', 'Database successfully restored from JSON backup file.');
      return true;
    } catch {
      return false;
    }
  }

  public resetToFactoryDefaults(): void {
    localStorage.clear();
    this.initializeIfEmpty();
    this.logAudit('FACTORY_RESET', 'Database reset to default seed records.');
  }
}

export const storage = new StorageService();
