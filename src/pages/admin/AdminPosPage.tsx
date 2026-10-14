import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Phone,
  MessageCircle,
  DollarSign,
  User,
  RotateCcw,
  Download,
  Share2,
  Loader2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { downloadPdfFromElement, sharePdfFromElement } from '../../utils/pdfGenerator';
import {
  CurrencyCode,
  Customer,
  PaymentMethod,
  PaymentStatus,
  Product,
  Sale,
} from '../../types';
import { DabinLogo } from '../../components/common/DabinLogo';
import { OFFICIAL_BUSINESS_INFO } from '../../constants/initialData';
import { ShareDocumentModal } from '../../components/admin/ShareDocumentModal';

interface CartItem {
  product: Product;
  quantity: number;
}

export const AdminPosPage: React.FC = () => {
  const { language, formatPrice, t, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'terminal' | 'history'>('terminal');

  // Products & Cart
  const products = storage.getProducts();
  const customers = storage.getCustomers();
  const [salesList, setSalesList] = useState<Sale[]>(() => storage.getSales());

  const [searchProduct, setSearchProduct] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sale transaction settings
  const [txCurrency, setTxCurrency] = useState<CurrencyCode>('KES');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [salesChannel, setSalesChannel] = useState<Sale['channel']>('physical_shop');
  const [saleNotes, setSaleNotes] = useState('');

  // Receipt Modal State
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetSale, setShareTargetSale] = useState<Sale | null>(null);
  const [autoSendReceiptWhatsApp, setAutoSendReceiptWhatsApp] = useState(true);

  // Helper to generate full itemized text for WhatsApp, social platforms, and messages
  const generateReceiptSummaryText = (sale: Sale): string => {
    const currSym = sale.currency === 'USD' ? '$' : 'Ksh ';
    const itemsList = sale.items
      .map(
        (it) =>
          `• ${it.productName} (x${it.quantity}) - ${currSym}${it.totalPrice.toLocaleString()}`
      )
      .join('\n');

    return (
      `*DABIN FASHION HOUSE — OFFICIAL RECEIPT*\n` +
      `Receipt No: #${sale.receiptNumber}\n` +
      `Date: ${new Date(sale.timestamp).toLocaleString()}\n` +
      `Customer: ${sale.customerName || 'Walk-in Client'}\n` +
      `Cashier: ${sale.cashierName}\n\n` +
      `*ITEMS PURCHASED:*\n${itemsList}\n\n` +
      `*TOTAL:* ${currSym}${sale.total.toLocaleString()}\n` +
      `*PAID:* ${currSym}${sale.amountPaid.toLocaleString()} (${sale.paymentMethod.toUpperCase()})\n` +
      (sale.outstandingBalance > 0
        ? `*OUTSTANDING BALANCE:* ${currSym}${sale.outstandingBalance.toLocaleString()}\n`
        : `*STATUS:* FULLY PAID\n`) +
      `\nNairobi, Kenya • Tel: ${OFFICIAL_BUSINESS_INFO.whatsappFormatted}\n` +
      `Thank you for shopping with DABIN Fashion House!`
    );
  };

  const handleDownloadReceiptPdf = async (sale: Sale) => {
    const elem = document.getElementById('printable-receipt');
    if (!elem) return;
    try {
      setIsDownloadingPdf(true);
      await downloadPdfFromElement(
        elem,
        `DABIN-Receipt-${sale.receiptNumber}.pdf`,
        `DABIN Fashion Receipt #${sale.receiptNumber}`
      );
    } catch (err) {
      console.error('Failed to download receipt PDF:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleShareReceiptPdf = async (sale: Sale) => {
    const elem = document.getElementById('printable-receipt');
    if (!elem) return;
    try {
      setIsSharingPdf(true);
      await sharePdfFromElement(
        elem,
        `DABIN-Receipt-${sale.receiptNumber}.pdf`,
        `DABIN Fashion Receipt #${sale.receiptNumber}`,
        generateReceiptSummaryText(sale)
      );
    } catch (err) {
      console.error('Failed to share receipt PDF:', err);
    } finally {
      setIsSharingPdf(false);
    }
  };

  // Filter available products for POS catalog
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status === 'archived' || p.status === 'draft') return false;
      if (!searchProduct.trim()) return true;
      const q = searchProduct.toLowerCase();
      return (
        p.nameEn.toLowerCase().includes(q) ||
        p.nameFr.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    });
  }, [products, searchProduct]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const priceInTxCurr = storage.convertPrice(
        item.product.basePrice,
        item.product.baseCurrency,
        txCurrency
      );
      return acc + priceInTxCurr * item.quantity;
    }, 0);
  }, [cart, txCurrency]);

  const amountPaidNumber = amountPaidInput === '' ? cartSubtotal : Number(amountPaidInput);
  const outstandingBalance = Math.max(0, cartSubtotal - amountPaidNumber);

  // Add to cart
  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.product.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;
    const availableStock = Math.max(0, product.quantityOnHand - product.reservedQuantity);

    if (currentQtyInCart + 1 > availableStock) {
      setErrorMessage(
        language === 'fr'
          ? `Stock insuffisant pour ${product.nameFr}. Disponible : ${availableStock}`
          : `Insufficient stock for ${product.nameEn}. Available: ${availableStock}`
      );
      return;
    }

    setErrorMessage('');
    if (existing) {
      setCart(
        cart.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Modify quantity
  const updateCartQty = (productId: string, delta: number) => {
    const existing = cart.find((i) => i.product.id === productId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.product.id !== productId));
      return;
    }

    const availableStock = Math.max(
      0,
      existing.product.quantityOnHand - existing.product.reservedQuantity
    );
    if (newQty > availableStock) {
      setErrorMessage(
        language === 'fr'
          ? `Stock maximum atteint (${availableStock})`
          : `Maximum stock limit reached (${availableStock})`
      );
      return;
    }

    setErrorMessage('');
    setCart(
      cart.map((i) => (i.product.id === productId ? { ...i, quantity: newQty } : i))
    );
  };

  // Finalize Sale
  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      setErrorMessage(language === 'fr' ? 'Le panier est vide.' : 'Cart is empty.');
      return;
    }

    const chosenCust = customers.find((c) => c.id === selectedCustomerId);

    const result = storage.recordSale({
      items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      customerId: selectedCustomerId || undefined,
      customerName: chosenCust?.fullName || walkInName || undefined,
      customerPhone: chosenCust?.phone || walkInPhone || undefined,
      currency: txCurrency,
      paymentMethod,
      paymentStatus: outstandingBalance === 0 ? 'paid' : 'partial',
      amountPaid: amountPaidNumber,
      channel: salesChannel,
      notes: saleNotes,
    });

    if (result.success && result.sale) {
      const recordedSale = result.sale;

      // 1. Record inflow directly in Income & Expenses
      storage.saveFinanceTransaction({
        type: 'income',
        category: 'pos_sales',
        title: `POS Sale #${recordedSale.receiptNumber} (${recordedSale.customerName || 'Walk-in'})`,
        amount: recordedSale.amountPaid,
        currency: recordedSale.currency,
        exchangeRateUsed: recordedSale.exchangeRateUsed,
        date: recordedSale.timestamp.split('T')[0],
        paymentMethod: recordedSale.paymentMethod,
        referenceNumber: recordedSale.receiptNumber,
        paidToOrFrom: recordedSale.customerName || 'Walk-in Customer',
        notes: `Recorded automatically from POS checkout. Items count: ${recordedSale.items.length}`,
        status: 'completed',
        relatedSaleId: recordedSale.id,
      });

      // 2. Automated dispatch to client via WhatsApp if enabled
      if (autoSendReceiptWhatsApp && recordedSale.customerPhone) {
        const summary = generateReceiptSummaryText(recordedSale);
        const cleanPhone = recordedSale.customerPhone.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(summary)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      setActiveReceiptSale(recordedSale);
      setCart([]);
      setAmountPaidInput('');
      setSelectedCustomerId('');
      setWalkInName('');
      setWalkInPhone('');
      setSaleNotes('');
      setErrorMessage('');
      setSalesList(storage.getSales());
    } else {
      setErrorMessage(result.error || 'Sale recording failed.');
    }
  };

  // Handle Refund
  const handleRefund = (saleId: string) => {
    const reason = prompt(
      language === 'fr'
        ? 'Raison du remboursement / retour :'
        : 'Reason for refund / return:'
    );
    if (!reason) return;

    const res = storage.refundSale(saleId, reason);
    if (res.success) {
      setSalesList(storage.getSales());
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  return (
    <AdminLayout activeTab="pos">
      <div className="space-y-6">
        {/* Top Header & View Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {t.pos.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {t.pos.subtitle}
            </p>
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'terminal'
                  ? 'bg-[#7B173B] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'fr' ? 'Terminal Caisse' : 'Checkout Terminal'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-[#7B173B] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'fr' ? 'Historique des Ventes' : 'Sales Ledger'} ({salesList.length})
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage('')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'terminal' ? (
          /* POS Terminal View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Product Catalog Picker */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              {/* Product search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  placeholder={t.pos.searchProducts}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#7B173B]"
                />
              </div>

              {/* Products list grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[68vh] overflow-y-auto pr-1">
                {availableProducts.map((product) => {
                  const available = Math.max(
                    0,
                    product.quantityOnHand - product.reservedQuantity
                  );
                  const isOut = available <= 0;
                  const priceInTx = storage.convertPrice(
                    product.basePrice,
                    product.baseCurrency,
                    txCurrency
                  );

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={isOut}
                      onClick={() => addToCart(product)}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isOut
                          ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed'
                          : 'bg-[#F9F9FB] hover:bg-white hover:border-[#7B173B] hover:shadow-sm border-gray-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <img
                          src={product.images[0] || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80'}
                          alt=""
                          className="w-full h-24 object-cover rounded-lg bg-gray-100 mb-2"
                        />
                        <div className="font-semibold text-gray-900 text-xs line-clamp-1">
                          {language === 'fr' ? product.nameFr : product.nameEn}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {product.sku}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between">
                        <span className="font-bold text-[#7B173B] text-xs">
                          {storage.formatPrice(priceInTx, txCurrency)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            isOut ? 'text-red-700 bg-red-50' : 'text-gray-500 bg-gray-200'
                          }`}
                        >
                          {available} left
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Active Order & Checkout Panel */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#7B173B]" />
                  <h3 className="font-serif-brand text-lg font-bold">
                    {language === 'fr' ? 'Panier en cours' : 'Active Order'}
                  </h3>
                </div>

                {/* Currency selector for sale */}
                <div className="flex items-center bg-[#F4F4F6] p-0.5 rounded-lg border border-gray-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTxCurrency('KES')}
                    className={`px-2 py-0.5 rounded ${
                      txCurrency === 'KES' ? 'bg-[#7B173B] text-white' : 'text-gray-600'
                    }`}
                  >
                    KES
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxCurrency('USD')}
                    className={`px-2 py-0.5 rounded ${
                      txCurrency === 'USD' ? 'bg-[#7B173B] text-white' : 'text-gray-600'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              {/* Cart items */}
              {cart.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const priceInTx = storage.convertPrice(
                      item.product.basePrice,
                      item.product.baseCurrency,
                      txCurrency
                    );
                    const itemTotal = priceInTx * item.quantity;

                    return (
                      <div
                        key={item.product.id}
                        className="p-2.5 bg-[#F9F9FB] rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                      >
                        <div className="max-w-[50%]">
                          <div className="font-semibold text-gray-900 truncate">
                            {language === 'fr' ? item.product.nameFr : item.product.nameEn}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {item.product.sku} · {storage.formatPrice(priceInTx, txCurrency)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.product.id, -1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-mono font-bold text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.product.id, 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-bold text-gray-900 w-16 text-right">
                            {storage.formatPrice(itemTotal, txCurrency)}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setCart(cart.filter((c) => c.product.id !== item.product.id))
                            }
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  {t.pos.cartEmpty}
                </div>
              )}

              {/* Customer assignment */}
              <div className="space-y-3 pt-3 border-t border-gray-100 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {t.pos.selectCustomer}
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  >
                    <option value="">{t.pos.walkInCustomer}</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.city}, {c.phone}) - {c.type}
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedCustomerId && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="Walk-in name (optional)"
                      className="p-2 bg-[#F8F8FA] border border-gray-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      placeholder="Phone / WhatsApp"
                      className="p-2 bg-[#F8F8FA] border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                )}

                {/* Sales channel & Payment method */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      {t.pos.channel}
                    </label>
                    <select
                      value={salesChannel}
                      onChange={(e) => setSalesChannel(e.target.value as any)}
                      className="w-full p-2 bg-[#F8F8FA] border border-gray-200 rounded-lg"
                    >
                      <option value="physical_shop">{t.pos.physicalShop}</option>
                      <option value="whatsapp">{t.pos.whatsappChannel}</option>
                      <option value="phone">{t.pos.phoneChannel}</option>
                      <option value="direct_arrangement">{t.pos.directArrangement}</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      {t.pos.paymentMethod}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full p-2 bg-[#F8F8FA] border border-gray-200 rounded-lg"
                    >
                      <option value="mpesa">{t.pos.mpesa}</option>
                      <option value="cash">{t.pos.cash}</option>
                      <option value="bank_transfer">{t.pos.bankTransfer}</option>
                      <option value="card">{t.pos.card}</option>
                      <option value="other">{t.pos.otherPayment}</option>
                    </select>
                  </div>
                </div>

                {/* Amount Paid input */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span>{t.pos.amountPaid}</span>
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput(cartSubtotal.toString())}
                      className="text-[10px] text-[#7B173B] hover:underline"
                    >
                      Paid in Full ({storage.formatPrice(cartSubtotal, txCurrency)})
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    placeholder={cartSubtotal.toString()}
                    className="w-full p-2 bg-[#F8F8FA] border border-gray-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              {/* Totals Summary */}
              <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>{t.pos.subtotal}</span>
                  <span className="font-semibold">{storage.formatPrice(cartSubtotal, txCurrency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#171719] pt-1">
                  <span>{t.pos.totalDue}</span>
                  <span className="text-[#7B173B] text-lg">
                    {storage.formatPrice(cartSubtotal, txCurrency)}
                  </span>
                </div>
                {outstandingBalance > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold bg-amber-50 p-2 rounded-lg">
                    <span>{t.pos.outstandingBalance}</span>
                    <span>{storage.formatPrice(outstandingBalance, txCurrency)}</span>
                  </div>
                )}
              </div>

              {/* Auto-send Receipt to Customer via WhatsApp */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-950">
                  <input
                    type="checkbox"
                    checked={autoSendReceiptWhatsApp}
                    onChange={(e) => setAutoSendReceiptWhatsApp(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>
                    {language === 'fr'
                      ? 'Transmettre le reçu automatiquement au client (WhatsApp)'
                      : 'Send receipt automatically to client (WhatsApp)'}
                  </span>
                </label>
                {(walkInPhone || selectedCustomerId) && (
                  <p className="text-[10px] text-emerald-700 pl-6">
                    {language === 'fr' ? 'Destinataire :' : 'Recipient:'}{' '}
                    {walkInPhone ||
                      customers.find((c) => c.id === selectedCustomerId)?.phone ||
                      '—'}
                  </p>
                )}
              </div>

              {/* Finalize Button */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleFinalizeSale}
                className="w-full py-3 bg-[#7B173B] hover:bg-[#62122F] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>{t.pos.finalizeSaleBtn}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sales History Ledger */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F8FA] text-gray-500 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {salesList.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {sale.receiptNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(sale.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {sale.customerName || 'Walk-in'}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{sale.cashierName}</td>
                      <td className="py-3 px-4 capitalize">{sale.channel}</td>
                      <td className="py-3 px-4 font-bold text-[#7B173B]">
                        {formatPrice(sale.total, sale.currency)}
                      </td>
                      <td className="py-3 px-4 capitalize">{sale.paymentMethod}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.paymentStatus === 'refunded'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveReceiptSale(sale)}
                            className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
                            title="View / Print Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReceiptSale(sale);
                              setShareTargetSale(sale);
                              setIsShareModalOpen(true);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Share Receipt (WhatsApp, Instagram, TikTok, Facebook, PDF)"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          {sale.paymentStatus !== 'refunded' && (
                            <button
                              type="button"
                              onClick={() => handleRefund(sale.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded"
                              title="Refund / Return"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Printable Receipt Modal (80mm Thermal / A4 Format) */}
        {activeReceiptSale && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
              {/* Receipt Control Bar */}
              <div className="px-6 py-3 bg-[#F8F8FA] border-b border-gray-200 flex items-center justify-between no-print">
                <span className="text-xs font-bold text-gray-700">Official Receipt Preview</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Download PDF */}
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={() => handleDownloadReceiptPdf(activeReceiptSale)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#7B173B] hover:bg-[#62122F] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    title="Download receipt as PDF"
                  >
                    {isDownloadingPdf ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span>{isDownloadingPdf ? 'PDF...' : 'PDF'}</span>
                  </button>

                  {/* Share to All Platforms & PDF */}
                  <button
                    type="button"
                    onClick={() => {
                      setShareTargetSale(activeReceiptSale);
                      setIsShareModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Share receipt via WhatsApp, Instagram, TikTok, Facebook, etc."
                  >
                    <Share2 className="w-3 h-3" />
                    <span>{language === 'fr' ? 'Partager' : 'Share'}</span>
                  </button>

                  {/* Print */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#171719] hover:bg-[#7B173B] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t.pos.printReceipt}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveReceiptSale(null)}
                    className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body Component */}
              <div id="printable-receipt" className="p-6 space-y-4 font-mono text-xs text-gray-900 bg-white">
                {/* Header */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                  <DabinLogo size="sm" variant="mark" className="mx-auto mb-1" />
                  <h2 className="text-base font-bold font-serif-brand">DABIN FASHION</h2>
                  <p className="text-[10px] text-gray-500 uppercase">
                    {OFFICIAL_BUSINESS_INFO.primarySloganFr}
                  </p>
                  <p className="text-[11px] text-gray-600">Nairobi, Kenya</p>
                  <p className="text-[10px] text-gray-500">
                    Tel / WhatsApp : {OFFICIAL_BUSINESS_INFO.whatsappFormatted}
                  </p>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-[11px] pb-2 border-b border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.pos.receiptNo}:</span>
                    <span className="font-bold">{activeReceiptSale.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.pos.dateLabel}:</span>
                    <span>{new Date(activeReceiptSale.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.pos.cashier}:</span>
                    <span>{activeReceiptSale.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.pos.selectCustomer}:</span>
                    <span>{activeReceiptSale.customerName || 'Walk-in'}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-2 py-2 border-b border-dashed border-gray-300">
                  {activeReceiptSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <div className="max-w-[70%]">
                        <div className="font-bold">{item.productName}</div>
                        <div className="text-[10px] text-gray-500">
                          {item.quantity} x {storage.formatPrice(item.unitPrice, item.currency)}
                        </div>
                      </div>
                      <div className="font-bold text-right">
                        {storage.formatPrice(item.totalPrice, item.currency)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-900">
                    <span>{t.pos.totalDue}:</span>
                    <span>{storage.formatPrice(activeReceiptSale.total, activeReceiptSale.currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{t.pos.amountPaid} ({activeReceiptSale.paymentMethod}):</span>
                    <span>{storage.formatPrice(activeReceiptSale.amountPaid, activeReceiptSale.currency)}</span>
                  </div>
                  {activeReceiptSale.outstandingBalance > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>{t.pos.outstandingBalance}:</span>
                      <span>{storage.formatPrice(activeReceiptSale.outstandingBalance, activeReceiptSale.currency)}</span>
                    </div>
                  )}
                </div>

                {/* Footer notes */}
                <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-dashed border-gray-300 space-y-1">
                  <p className="font-semibold text-gray-700">
                    {language === 'fr'
                      ? 'Merci pour votre confiance !'
                      : 'Thank you for shopping with DABIN Fashion!'}
                  </p>
                  <p>
                    {language === 'fr'
                      ? 'Prix standard transparent garanti pour tous nos clients.'
                      : 'Single transparent price guaranteed for all clients.'}
                  </p>
                  <p>dabin.fashion.co.ke@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Share & PDF Export Modal for POS Receipt */}
      {isShareModalOpen && (shareTargetSale || activeReceiptSale) && (
        <ShareDocumentModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareTargetSale(null);
          }}
          targetElementId="printable-receipt"
          documentTitle={`DABIN Fashion Receipt #${(shareTargetSale || activeReceiptSale)!.receiptNumber}`}
          documentNumber={(shareTargetSale || activeReceiptSale)!.receiptNumber}
          fileName={`DABIN-Receipt-${(shareTargetSale || activeReceiptSale)!.receiptNumber}.pdf`}
          summaryText={generateReceiptSummaryText(shareTargetSale || activeReceiptSale!)}
          recipientPhone={(shareTargetSale || activeReceiptSale)!.customerPhone}
          language={language}
        />
      )}
    </AdminLayout>
  );
};
