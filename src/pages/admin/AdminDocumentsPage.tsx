import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Printer,
  Copy,
  Trash2,
  Edit,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Share2,
  ArrowLeftRight,
  Download,
  Check,
  Package,
  Layers,
  Sparkles,
  CreditCard,
  Loader2,
  Send,
  ExternalLink,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DabinLogo } from '../../components/common/DabinLogo';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import {
  CommercialDocument,
  CommercialDocumentItem,
  CommercialDocumentType,
  CurrencyCode,
  DocumentStatus,
  PaymentMethod,
} from '../../types';
import { OFFICIAL_BUSINESS_INFO } from '../../constants/initialData';
import { downloadPdfFromElement, sharePdfFromElement } from '../../utils/pdfGenerator';
import { ShareDocumentModal } from '../../components/admin/ShareDocumentModal';

export const AdminDocumentsPage: React.FC = () => {
  const { language, currentUser } = useApp();

  const [documents, setDocuments] = useState<CommercialDocument[]>(() =>
    storage.getCommercialDocuments()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | CommercialDocumentType>('all');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<'all' | CurrencyCode>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | DocumentStatus>('all');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<CommercialDocument | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeShareDocId, setActiveShareDocId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetDoc, setShareTargetDoc] = useState<CommercialDocument | null>(null);
  const [autoSendToClient, setAutoSendToClient] = useState(true);
  const [autoSendChannel, setAutoSendChannel] = useState<'whatsapp' | 'email' | 'both'>('whatsapp');

  // Form State for creating/editing document
  const initialFormState: Partial<CommercialDocument> & {
    type: CommercialDocumentType;
    currency: CurrencyCode;
    items: CommercialDocumentItem[];
  } = {
    type: 'invoice',
    currency: 'KES',
    status: 'draft',
    exchangeRateUsed: storage.getSettings().exchangeRateUsdToKes || 130,
    showDualCurrency: true,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    paymentDate: '',
    clientName: '',
    clientCompany: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    clientTaxPin: '',
    issuerName: OFFICIAL_BUSINESS_INFO.name,
    issuerLocation: OFFICIAL_BUSINESS_INFO.location,
    issuerPhone: OFFICIAL_BUSINESS_INFO.phone,
    issuerEmail: OFFICIAL_BUSINESS_INFO.email,
    issuerTaxPin: storage.getSettings().taxPinNumber || '',
    issuerMpesaTill: storage.getSettings().mpesaTillNumber || '',
    issuerMpesaPaybill: storage.getSettings().mpesaPaybillNumber
      ? (storage.getSettings().mpesaPaybillAccount
          ? `${storage.getSettings().mpesaPaybillNumber} (A/C: ${storage.getSettings().mpesaPaybillAccount})`
          : storage.getSettings().mpesaPaybillNumber)
      : '',
    issuerBankName: storage.getSettings().bankName || '',
    issuerBankAccount: storage.getSettings().bankAccountNumber || '',
    issuerBankSwift: storage.getSettings().bankSwiftCode || '',
    items: [
      {
        id: `item-${Date.now()}-1`,
        description: '',
        sku: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        total: 0,
      },
    ],
    subtotal: 0,
    discountType: 'fixed',
    discountValue: 0,
    discountAmount: 0,
    taxRatePercent: 0,
    taxAmount: 0,
    shippingFee: 0,
    total: 0,
    amountPaid: 0,
    balanceDue: 0,
    paymentMethod: 'mpesa',
    paymentReference: '',
    notes: 'Thank you for choosing DABIN Fashion. For inquiries, reach out to our Nairobi team.',
    termsAndConditions:
      'Goods sold in original condition are exchangeable within 7 days with valid receipt. Bespoke tailored items are non-refundable once approved.',
    signatureName: 'DABIN Fashion House Management',
    includeDigitalStamp: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  // Pre-load customers and products for easy quick-fill
  const customers = useMemo(() => storage.getCustomers(), []);
  const products = useMemo(() => storage.getProducts(), []);

  const refreshDocuments = () => {
    setDocuments(storage.getCommercialDocuments());
  };

  // Recalculate totals whenever items, discount, tax, shipping, or amountPaid change
  const calculateTotals = (
    items: CommercialDocumentItem[],
    discountType: 'percentage' | 'fixed',
    discountValue: number,
    taxRatePercent: number,
    shippingFee: number,
    amountPaid: number
  ) => {
    const subtotal = items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = Math.round(((subtotal * (discountValue || 0)) / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(subtotal, Math.max(0, discountValue || 0));
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount =
      taxRatePercent > 0
        ? Math.round(((afterDiscount * taxRatePercent) / 100) * 100) / 100
        : 0;

    const grandTotal = Math.round((afterDiscount + taxAmount + (Number(shippingFee) || 0)) * 100) / 100;
    const balanceDue = Math.max(0, Math.round((grandTotal - (Number(amountPaid) || 0)) * 100) / 100);

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total: grandTotal,
      balanceDue,
    };
  };

  // Update a single line item
  const updateItem = (
    index: number,
    field: keyof CommercialDocumentItem,
    value: string | number
  ) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index], [field]: value };

    // Update line total
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discountPercent) || 0;
    item.total = Math.round(qty * price * (1 - disc / 100) * 100) / 100;

    updatedItems[index] = item;

    const calc = calculateTotals(
      updatedItems,
      formData.discountType || 'fixed',
      formData.discountValue || 0,
      formData.taxRatePercent || 0,
      formData.shippingFee || 0,
      formData.amountPaid || 0
    );

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxAmount: calc.taxAmount,
      total: calc.total,
      balanceDue: calc.balanceDue,
    }));
  };

  const addItemRow = () => {
    const newItem: CommercialDocumentItem = {
      id: `item-${Date.now()}-${formData.items.length + 1}`,
      description: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      total: 0,
    };
    const updated = [...formData.items, newItem];
    setFormData((prev) => ({ ...prev, items: updated }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    const updated = formData.items.filter((_, i) => i !== index);
    const calc = calculateTotals(
      updated,
      formData.discountType || 'fixed',
      formData.discountValue || 0,
      formData.taxRatePercent || 0,
      formData.shippingFee || 0,
      formData.amountPaid || 0
    );
    setFormData((prev) => ({
      ...prev,
      items: updated,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxAmount: calc.taxAmount,
      total: calc.total,
      balanceDue: calc.balanceDue,
    }));
  };

  // Quick insert of product from catalog
  const insertProductToLine = (productId: string, itemIndex: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    // Convert price to current document currency
    let unitPrice = prod.basePrice || 1000;
    const exchangeRate = formData.exchangeRateUsed || 130;
    if (formData.currency === 'USD' && prod.baseCurrency !== 'USD') {
      unitPrice = Math.round((unitPrice / exchangeRate) * 100) / 100;
    } else if (formData.currency === 'KES' && prod.baseCurrency === 'USD') {
      unitPrice = Math.round(unitPrice * exchangeRate);
    }

    const updatedItems = [...formData.items];
    const productName = language === 'fr' ? prod.nameFr : prod.nameEn;
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      description: productName,
      sku: prod.sku,
      unitPrice: unitPrice,
      total: Math.round(unitPrice * (updatedItems[itemIndex].quantity || 1) * 100) / 100,
    };

    const calc = calculateTotals(
      updatedItems,
      formData.discountType || 'fixed',
      formData.discountValue || 0,
      formData.taxRatePercent || 0,
      formData.shippingFee || 0,
      formData.amountPaid || 0
    );

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxAmount: calc.taxAmount,
      total: calc.total,
      balanceDue: calc.balanceDue,
    }));
  };

  // Quick fill customer from CRM
  const handleSelectCustomer = (customerId: string) => {
    if (!customerId) return;
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    setFormData((prev) => ({
      ...prev,
      customerId: cust.id,
      clientName: cust.fullName,
      clientCompany: cust.city ? `${cust.city}, ${cust.country}` : '',
      clientPhone: cust.phone || cust.whatsappNumber || '',
      clientEmail: cust.email || '',
      clientAddress: cust.city ? `${cust.city}, ${cust.country}` : 'Nairobi, Kenya',
    }));
  };

  // Open Editor for brand new document
  const handleCreateNew = (type: CommercialDocumentType) => {
    const freshSettings = storage.getSettings();
    const nextNumber = storage.getNextDocumentNumber(type);
    const defaultStatus: DocumentStatus = type === 'receipt' ? 'paid' : 'draft';
    const rate = freshSettings.exchangeRateUsdToKes || 130;

    setFormData({
      ...initialFormState,
      type,
      status: defaultStatus,
      documentNumber: nextNumber,
      exchangeRateUsed: rate,
      currency: 'KES',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate:
        type === 'invoice'
          ? new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
          : type === 'quotation'
          ? new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
          : undefined,
      paymentDate: type === 'receipt' ? new Date().toISOString().split('T')[0] : '',
      issuerTaxPin: freshSettings.taxPinNumber || '',
      issuerMpesaTill: freshSettings.mpesaTillNumber || '',
      issuerMpesaPaybill: freshSettings.mpesaPaybillNumber
        ? (freshSettings.mpesaPaybillAccount
            ? `${freshSettings.mpesaPaybillNumber} (A/C: ${freshSettings.mpesaPaybillAccount})`
            : freshSettings.mpesaPaybillNumber)
        : '',
      issuerBankName: freshSettings.bankName || '',
      issuerBankAccount: freshSettings.bankAccountNumber || '',
      issuerBankSwift: freshSettings.bankSwiftCode || '',
    });
    setIsEditorOpen(true);
  };

  // Open Editor for existing document
  const handleEdit = (doc: CommercialDocument) => {
    setFormData({
      ...doc,
      exchangeRateUsed: doc.exchangeRateUsed || 130,
    });
    setIsEditorOpen(true);
  };

  // Save Document (with optional auto-send to client via WhatsApp / Email)
  const handleSaveDocument = (andPreview = false, sendDirectToClient = false) => {
    if (!formData.clientName?.trim()) {
      alert(language === 'fr' ? 'Veuillez saisir le nom du client.' : 'Please enter the client name.');
      return;
    }

    if (formData.items.length === 0 || !formData.items[0].description) {
      alert(language === 'fr' ? 'Veuillez ajouter au moins un article avec sa description.' : 'Please add at least one item with a description.');
      return;
    }

    const shouldSend = sendDirectToClient || autoSendToClient;

    // Check if contact info exists when sending
    if (shouldSend) {
      if (
        (autoSendChannel === 'whatsapp' || autoSendChannel === 'both') &&
        !formData.clientPhone?.trim()
      ) {
        alert(
          language === 'fr'
            ? 'Veuillez renseigner le numéro de téléphone / WhatsApp du client pour l’envoi automatique.'
            : 'Please enter the client phone / WhatsApp number for automated sending.'
        );
        return;
      }
      if (
        autoSendChannel === 'email' &&
        !formData.clientEmail?.trim()
      ) {
        alert(
          language === 'fr'
            ? 'Veuillez renseigner l’adresse e-mail du client pour l’envoi automatique.'
            : 'Please enter the client email address for automated sending.'
        );
        return;
      }
    }

    const calc = calculateTotals(
      formData.items,
      formData.discountType || 'fixed',
      formData.discountValue || 0,
      formData.taxRatePercent || 0,
      formData.shippingFee || 0,
      formData.amountPaid || 0
    );

    const docStatus: DocumentStatus =
      formData.type === 'receipt'
        ? 'paid'
        : shouldSend
        ? 'sent'
        : formData.status || 'draft';

    const saved = storage.saveCommercialDocument({
      ...formData,
      status: docStatus,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxAmount: calc.taxAmount,
      total: calc.total,
      balanceDue: calc.balanceDue,
    } as CommercialDocument);

    refreshDocuments();
    setIsEditorOpen(false);

    if (shouldSend) {
      const summary = generateDocumentSummary(saved);

      // 1. WhatsApp Delivery
      if (
        (autoSendChannel === 'whatsapp' || autoSendChannel === 'both') &&
        saved.clientPhone
      ) {
        const cleanPhone = saved.clientPhone.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(summary)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      // 2. Email Delivery
      if (
        (autoSendChannel === 'email' || autoSendChannel === 'both') &&
        saved.clientEmail
      ) {
        const subject = `DABIN Fashion House - ${saved.type.toUpperCase()} #${saved.documentNumber}`;
        const mailto = `mailto:${encodeURIComponent(saved.clientEmail)}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(summary)}`;
        window.location.href = mailto;
      }

      setToastMessage(
        language === 'fr'
          ? `✓ Document #${saved.documentNumber} enregistré et transmis automatiquement à ${saved.clientName} !`
          : `✓ Document #${saved.documentNumber} saved & dispatched automatically to ${saved.clientName}!`
      );
      setTimeout(() => setToastMessage(null), 4500);
    } else {
      setToastMessage(
        language === 'fr'
          ? `✓ Document #${saved.documentNumber} enregistré avec succès !`
          : `✓ Document #${saved.documentNumber} saved successfully!`
      );
      setTimeout(() => setToastMessage(null), 3500);
    }

    if (andPreview) {
      setActiveDocument(saved);
      setIsPreviewOpen(true);
    }
  };

  // Delete Document
  const handleDelete = (id: string, docNumber: string) => {
    if (
      window.confirm(
        language === 'fr'
          ? `Supprimer définitivement le document ${docNumber} ?`
          : `Permanently delete document ${docNumber}?`
      )
    ) {
      storage.deleteCommercialDocument(id);
      refreshDocuments();
      if (activeDocument?.id === id) {
        setIsPreviewOpen(false);
      }
    }
  };

  // Convert Quotation -> Invoice or Invoice -> Receipt
  const handleConvert = (doc: CommercialDocument, targetType: CommercialDocumentType) => {
    const converted = storage.convertCommercialDocument(doc.id, targetType);
    if (converted) {
      refreshDocuments();
      setActiveDocument(converted);
      setIsPreviewOpen(true);
    }
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Type filter
      if (selectedTypeFilter !== 'all' && doc.type !== selectedTypeFilter) {
        return false;
      }
      // Currency filter
      if (selectedCurrencyFilter !== 'all' && doc.currency !== selectedCurrencyFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'all' && doc.status !== selectedStatusFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumber = doc.documentNumber.toLowerCase().includes(query);
        const matchClient = doc.clientName.toLowerCase().includes(query);
        const matchCompany = doc.clientCompany?.toLowerCase().includes(query);
        const matchPhone = doc.clientPhone.toLowerCase().includes(query);
        const matchNotes = doc.notes?.toLowerCase().includes(query);
        const matchItem = doc.items.some((it) =>
          it.description.toLowerCase().includes(query) || it.sku?.toLowerCase().includes(query)
        );
        return matchNumber || matchClient || matchCompany || matchPhone || matchNotes || matchItem;
      }
      return true;
    });
  }, [documents, selectedTypeFilter, selectedCurrencyFilter, selectedStatusFilter, searchQuery]);

  // Document metrics
  const metrics = useMemo(() => {
    const quotes = documents.filter((d) => d.type === 'quotation');
    const invoices = documents.filter((d) => d.type === 'invoice');
    const receipts = documents.filter((d) => d.type === 'receipt');

    const totalUnpaidKes = invoices
      .filter((d) => d.currency === 'KES')
      .reduce((acc, d) => acc + (d.balanceDue || 0), 0);

    const totalUnpaidUsd = invoices
      .filter((d) => d.currency === 'USD')
      .reduce((acc, d) => acc + (d.balanceDue || 0), 0);

    const totalReceiptsKes = receipts
      .filter((d) => d.currency === 'KES')
      .reduce((acc, d) => acc + (d.total || 0), 0);

    const totalReceiptsUsd = receipts
      .filter((d) => d.currency === 'USD')
      .reduce((acc, d) => acc + (d.total || 0), 0);

    return {
      totalDocs: documents.length,
      quotesCount: quotes.length,
      invoicesCount: invoices.length,
      receiptsCount: receipts.length,
      totalUnpaidKes,
      totalUnpaidUsd,
      totalReceiptsKes,
      totalReceiptsUsd,
    };
  }, [documents]);

  // Generate itemized text summary for WhatsApp, email or messaging
  const generateDocumentSummary = (doc: CommercialDocument): string => {
    const currSym = doc.currency === 'USD' ? '$' : 'Ksh ';
    const docTitle =
      doc.type === 'quotation'
        ? 'PROFORMA QUOTATION'
        : doc.type === 'invoice'
        ? 'TAX INVOICE'
        : 'PAYMENT RECEIPT';

    const itemsSummary = doc.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.description} (x${it.quantity}) - ${currSym}${Number(it.total).toLocaleString()}`
      )
      .join('\n');

    const paymentLines: string[] = [];
    if (doc.issuerMpesaTill?.trim()) {
      paymentLines.push(`• M-Pesa Buy Goods Till: ${doc.issuerMpesaTill.trim()}`);
    }
    if (doc.issuerMpesaPaybill?.trim()) {
      paymentLines.push(`• M-Pesa Paybill: ${doc.issuerMpesaPaybill.trim()}`);
    }
    if (doc.issuerBankName?.trim()) {
      paymentLines.push(
        `• Bank: ${doc.issuerBankName.trim()}${doc.issuerBankAccount?.trim() ? ` • A/C: ${doc.issuerBankAccount.trim()}` : ''}`
      );
    }
    if (doc.currency === 'USD' && doc.issuerBankSwift?.trim()) {
      paymentLines.push(`• SWIFT: ${doc.issuerBankSwift.trim()} (USD Wire)`);
    }

    const paymentSection =
      paymentLines.length > 0
        ? `\n*Payment Details:*\n${paymentLines.join('\n')}\n`
        : '';

    return `*DABIN FASHION HOUSE - ${docTitle}*
Document Ref: ${doc.documentNumber}
Date: ${doc.issueDate}
Client: ${doc.clientName}${doc.clientCompany ? ` (${doc.clientCompany})` : ''}

*Itemized Breakdown:*
${itemsSummary}

-------------------------
Subtotal: ${currSym}${Number(doc.subtotal).toLocaleString()}
${doc.discountAmount > 0 ? `Discount: -${currSym}${Number(doc.discountAmount).toLocaleString()}\n` : ''}${
      doc.shippingFee > 0 ? `Shipping & Delivery: ${currSym}${Number(doc.shippingFee).toLocaleString()}\n` : ''
    }*TOTAL: ${currSym}${Number(doc.total).toLocaleString()} ${doc.currency}*
${doc.amountPaid > 0 ? `Amount Paid: ${currSym}${Number(doc.amountPaid).toLocaleString()}\n` : ''}${
      doc.balanceDue > 0 ? `*Balance Due: ${currSym}${Number(doc.balanceDue).toLocaleString()} ${doc.currency}*\n` : ''
    }${paymentSection}
Thank you for choosing DABIN Fashion! Nairobi, Kenya.`;
  };

  // Copy shareable summary for WhatsApp or Text
  const copyWhatsAppSummary = (doc: CommercialDocument) => {
    const message = generateDocumentSummary(doc);
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setToastMessage(language === 'fr' ? 'Résumé copié dans le presse-papier !' : 'Summary copied to clipboard!');
    setTimeout(() => {
      setIsCopied(false);
      setToastMessage(null);
    }, 2500);
  };

  // Direct download of document as PDF
  const handleDownloadPdf = async (doc: CommercialDocument) => {
    let elem = document.getElementById('printable-document');
    if (!elem) {
      setActiveDocument(doc);
      setIsPreviewOpen(true);
      await new Promise((r) => setTimeout(r, 200));
      elem = document.getElementById('printable-document');
    }
    if (!elem) return;

    try {
      setIsDownloadingPdf(true);
      const fileName = `DABIN-${doc.type.toUpperCase()}-${doc.documentNumber}.pdf`;
      await downloadPdfFromElement(elem, fileName, `DABIN Fashion - ${doc.documentNumber}`);
      setToastMessage(
        language === 'fr'
          ? `PDF ${doc.documentNumber} téléchargé avec succès !`
          : `PDF ${doc.documentNumber} downloaded successfully!`
      );
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('PDF Download failed, falling back to print:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Native share or download fallback
  const handleSharePdf = async (doc: CommercialDocument) => {
    let elem = document.getElementById('printable-document');
    if (!elem) {
      setActiveDocument(doc);
      setIsPreviewOpen(true);
      await new Promise((r) => setTimeout(r, 200));
      elem = document.getElementById('printable-document');
    }
    if (!elem) return;

    try {
      setIsSharingPdf(true);
      const fileName = `DABIN-${doc.type.toUpperCase()}-${doc.documentNumber}.pdf`;
      const title = `DABIN Fashion - ${doc.type.toUpperCase()} #${doc.documentNumber}`;
      const text = `Official ${doc.type.toUpperCase()} #${doc.documentNumber} for ${doc.clientName} (${doc.currency} ${Number(doc.total).toLocaleString()}).`;
      const res = await sharePdfFromElement(elem, fileName, title, text);
      if (res.success) {
        setToastMessage(
          res.method === 'native-file'
            ? (language === 'fr' ? 'Document PDF partagé !' : 'PDF Document shared!')
            : (language === 'fr' ? 'Document PDF téléchargé pour envoi !' : 'PDF Document downloaded for sharing!')
        );
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('PDF Share failed:', err);
    } finally {
      setIsSharingPdf(false);
      setActiveShareDocId(null);
    }
  };

  // Send via WhatsApp
  const handleOpenWhatsApp = (doc: CommercialDocument) => {
    const summary = generateDocumentSummary(doc);
    const cleanPhone = (doc.clientPhone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(summary)}`
      : `https://wa.me/?text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setActiveShareDocId(null);
  };

  // Send via Email
  const handleOpenEmail = (doc: CommercialDocument) => {
    const summary = generateDocumentSummary(doc);
    const subject = `DABIN Fashion House - ${doc.type.toUpperCase()} #${doc.documentNumber}`;
    const url = `mailto:${encodeURIComponent(doc.clientEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;
    window.location.href = url;
    setActiveShareDocId(null);
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            {language === 'fr' ? 'Payé' : 'Paid'}
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            {language === 'fr' ? 'Partiel' : 'Partial'}
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            {language === 'fr' ? 'Envoyé' : 'Sent'}
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
            <Check className="w-3 h-3" />
            {language === 'fr' ? 'Accepté' : 'Accepted'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            {language === 'fr' ? 'Annulé' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
            <Clock className="w-3 h-3" />
            {language === 'fr' ? 'Brouillon' : 'Draft'}
          </span>
        );
    }
  };

  const getTypeBadge = (type: CommercialDocumentType) => {
    switch (type) {
      case 'quotation':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            {language === 'fr' ? 'Devis' : 'Quotation'}
          </span>
        );
      case 'invoice':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            {language === 'fr' ? 'Facture' : 'Invoice'}
          </span>
        );
      case 'receipt':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            {language === 'fr' ? 'Reçu' : 'Receipt'}
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#7B173B]/10 text-[#7B173B] rounded-full">
                {language === 'fr' ? 'Gestion Commerciale' : 'Commercial Billing'}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {language === 'fr' ? 'Taux de référence : 1 USD = 130 KES' : 'Rate: 1 USD = 130 KES'}
              </span>
            </div>
            <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {language === 'fr'
                ? 'Générateur de Devis, Factures & Reçus'
                : 'Quotations, Invoices & Receipts Generator'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              {language === 'fr'
                ? 'Créez manuellement vos devis, factures proforma et reçus officiels avec prise en charge intégrée du Dollar US (USD) et du Shilling Kenyan (KES).'
                : 'Manually generate bespoke quotations, tax invoices, and official payment receipts with full dual-currency support in both USD ($) and KES (Ksh).'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCreateNew('quotation')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? '+ Nouveau Devis' : '+ New Quotation'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateNew('invoice')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? '+ Nouvelle Facture' : '+ New Invoice'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateNew('receipt')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#7B173B] hover:bg-[#62122F] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? '+ Nouveau Reçu' : '+ New Receipt'}</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
              <span>{language === 'fr' ? 'Total Documents' : 'Total Documents'}</span>
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-[#171719]">{metrics.totalDocs}</div>
            <div className="text-[11px] text-gray-400 flex items-center gap-2">
              <span>{metrics.quotesCount} {language === 'fr' ? 'devis' : 'quotes'}</span>
              <span>•</span>
              <span>{metrics.invoicesCount} {language === 'fr' ? 'factures' : 'invoices'}</span>
              <span>•</span>
              <span>{metrics.receiptsCount} {language === 'fr' ? 'reçus' : 'receipts'}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-amber-700 text-xs font-medium uppercase tracking-wider">
              <span>{language === 'fr' ? 'Créances KES (Factures)' : 'Unpaid Invoices (KES)'}</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-800">
              Ksh {metrics.totalUnpaidKes.toLocaleString()}
            </div>
            <div className="text-[11px] text-gray-500">
              {language === 'fr' ? 'Soldes clients à recouvrer en Shillings' : 'Pending balances due from customers in KES'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-blue-700 text-xs font-medium uppercase tracking-wider">
              <span>{language === 'fr' ? 'Créances USD (Export)' : 'Unpaid Invoices (USD)'}</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-800">
              ${metrics.totalUnpaidUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-gray-500">
              {language === 'fr' ? 'Commandes export (RDC, Burundi) en Dollars' : 'Cross-border wholesale receivables in USD'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-medium uppercase tracking-wider">
              <span>{language === 'fr' ? 'Reçus Encaissés' : 'Completed Receipts'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-emerald-800">
              Ksh {metrics.totalReceiptsKes.toLocaleString()}{' '}
              {metrics.totalReceiptsUsd > 0 && (
                <span className="text-sm font-semibold text-gray-600">
                  + ${metrics.totalReceiptsUsd.toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500">
              {language === 'fr' ? 'Paiements validés (M-Pesa, Cash, Virement)' : 'Verified receipts issued to shoppers'}
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'fr'
                    ? 'Rechercher par n° de doc, client, société, téléphone, article...'
                    : 'Search by Doc #, client name, company, phone, item...'
                }
                className="w-full pl-9 pr-4 py-2 bg-[#F8F8FA] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Currency Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                {language === 'fr' ? 'Devise :' : 'Currency:'}
              </span>
              <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedCurrencyFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedCurrencyFilter === 'all'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {language === 'fr' ? 'Toutes' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCurrencyFilter('KES')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedCurrencyFilter === 'KES'
                      ? 'bg-white text-[#7B173B] shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  KES (Ksh)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCurrencyFilter('USD')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedCurrencyFilter === 'USD'
                      ? 'bg-white text-[#7B173B] shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

          {/* Sub Filters: Type Tabs & Status Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
            {/* Document Type Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedTypeFilter === 'all'
                    ? 'bg-[#171719] text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {language === 'fr' ? 'Tous les types' : 'All Types'} ({documents.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('quotation')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedTypeFilter === 'quotation'
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                {language === 'fr' ? 'Devis' : 'Quotations'} ({metrics.quotesCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('invoice')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedTypeFilter === 'invoice'
                    ? 'bg-blue-700 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {language === 'fr' ? 'Factures' : 'Invoices'} ({metrics.invoicesCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('receipt')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedTypeFilter === 'receipt'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {language === 'fr' ? 'Reçus' : 'Receipts'} ({metrics.receiptsCount})
              </button>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">
                {language === 'fr' ? 'Statut :' : 'Status:'}
              </span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="bg-[#F8F8FA] border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none"
              >
                <option value="all">{language === 'fr' ? 'Tous les statuts' : 'All Statuses'}</option>
                <option value="draft">{language === 'fr' ? 'Brouillon' : 'Draft'}</option>
                <option value="sent">{language === 'fr' ? 'Envoyé' : 'Sent'}</option>
                <option value="accepted">{language === 'fr' ? 'Accepté' : 'Accepted'}</option>
                <option value="partial">{language === 'fr' ? 'Paiement partiel' : 'Partial Payment'}</option>
                <option value="paid">{language === 'fr' ? 'Payé intégralement' : 'Fully Paid'}</option>
                <option value="cancelled">{language === 'fr' ? 'Annulé' : 'Cancelled'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Table / Card List */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-gray-200 shadow-xs space-y-3">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-gray-800 text-sm">
              {language === 'fr' ? 'Aucun document commercial trouvé' : 'No commercial documents found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchQuery || selectedTypeFilter !== 'all' || selectedCurrencyFilter !== 'all'
                ? language === 'fr'
                  ? 'Essayez de modifier vos critères de recherche ou de réinitialiser vos filtres.'
                  : 'Try clearing your search query or reset your filters.'
                : language === 'fr'
                ? 'Commencez par créer votre premier devis, facture ou reçu à l’aide des boutons ci-dessus.'
                : 'Get started by creating your first quotation, invoice, or receipt using the buttons above.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F8FA] border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">{language === 'fr' ? 'Document' : 'Document'}</th>
                    <th className="py-3.5 px-4">{language === 'fr' ? 'Client & Contact' : 'Client & Contact'}</th>
                    <th className="py-3.5 px-4">{language === 'fr' ? 'Date & Échéance' : 'Dates'}</th>
                    <th className="py-3.5 px-4">{language === 'fr' ? 'Articles' : 'Items'}</th>
                    <th className="py-3.5 px-4">{language === 'fr' ? 'Montant & Devise' : 'Total & Currency'}</th>
                    <th className="py-3.5 px-4">{language === 'fr' ? 'Statut' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-right">{language === 'fr' ? 'Actions' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc) => {
                    const isUsd = doc.currency === 'USD';
                    const approxConverted = isUsd
                      ? `≈ Ksh ${(doc.total * (doc.exchangeRateUsed || 130)).toLocaleString()} KES`
                      : `≈ $${(doc.total / (doc.exchangeRateUsed || 130)).toFixed(2)} USD`;

                    return (
                      <tr key={doc.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* Doc Number and Type */}
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            {getTypeBadge(doc.type)}
                            <span>{doc.documentNumber}</span>
                          </div>
                        </td>

                        {/* Client Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{doc.clientName}</div>
                          {doc.clientCompany && (
                            <div className="text-[11px] text-gray-500 font-medium">
                              {doc.clientCompany}
                            </div>
                          )}
                          <div className="text-[10px] text-gray-400">{doc.clientPhone}</div>
                        </td>

                        {/* Dates */}
                        <td className="py-3.5 px-4">
                          <div className="text-gray-800 font-medium">{doc.issueDate}</div>
                          {doc.dueDate && (
                            <div className="text-[10px] text-gray-500">
                              {language === 'fr' ? 'Échéance :' : 'Due:'} {doc.dueDate}
                            </div>
                          )}
                          {doc.paymentDate && (
                            <div className="text-[10px] text-emerald-600 font-medium">
                              {language === 'fr' ? 'Payé le :' : 'Paid on:'} {doc.paymentDate}
                            </div>
                          )}
                        </td>

                        {/* Items count */}
                        <td className="py-3.5 px-4 text-gray-600">
                          <span className="font-medium text-gray-900">
                            {doc.items.length} {language === 'fr' ? 'ligne(s)' : 'item(s)'}
                          </span>
                          <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                            {doc.items[0]?.description}
                          </div>
                        </td>

                        {/* Total Amount & Dual Currency */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-sm text-[#7B173B]">
                            {isUsd ? '$' : 'Ksh '}
                            {Number(doc.total).toLocaleString(undefined, {
                              minimumFractionDigits: isUsd ? 2 : 0,
                            })}{' '}
                            <span className="text-[10px] font-semibold text-gray-500 uppercase">
                              {doc.currency}
                            </span>
                          </div>
                          {doc.showDualCurrency && (
                            <div className="text-[10px] text-gray-500 font-medium">
                              {approxConverted}
                            </div>
                          )}
                          {doc.type === 'invoice' && doc.balanceDue > 0 && (
                            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                              {language === 'fr' ? 'Dû :' : 'Due:'} {isUsd ? '$' : 'Ksh '}
                              {Number(doc.balanceDue).toLocaleString()}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">{getStatusBadge(doc.status)}</td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View / Print Preview */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDocument(doc);
                                setIsPreviewOpen(true);
                              }}
                              className="p-1.5 bg-gray-100 hover:bg-[#7B173B] hover:text-white text-gray-700 rounded-lg transition-colors cursor-pointer"
                              title={language === 'fr' ? 'Aperçu & Imprimer' : 'View & Print Document'}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Download PDF Direct */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDocument(doc);
                                setIsPreviewOpen(true);
                                setTimeout(() => handleDownloadPdf(doc), 300);
                              }}
                              className="p-1.5 bg-gray-100 hover:bg-[#7B173B] hover:text-white text-gray-700 rounded-lg transition-colors cursor-pointer"
                              title={language === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Share to All Platforms & PDF */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDocument(doc);
                                setShareTargetDoc(doc);
                                setIsShareModalOpen(true);
                              }}
                              className="p-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 rounded-lg transition-colors cursor-pointer"
                              title={
                                language === 'fr'
                                  ? 'Partager (WhatsApp, Instagram, TikTok, Facebook, PDF)'
                                  : 'Share (WhatsApp, Instagram, TikTok, Facebook, PDF)'
                              }
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Document */}
                            <button
                              type="button"
                              onClick={() => handleEdit(doc)}
                              className="p-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 rounded-lg transition-colors cursor-pointer"
                              title={language === 'fr' ? 'Modifier' : 'Edit Document'}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Conversion */}
                            {doc.type === 'quotation' && (
                              <button
                                type="button"
                                onClick={() => handleConvert(doc, 'invoice')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[10px] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                                title={language === 'fr' ? 'Convertir en Facture' : 'Convert to Invoice'}
                              >
                                {language === 'fr' ? '→ Facture' : '→ Invoice'}
                              </button>
                            )}
                            {doc.type === 'invoice' && (
                              <button
                                type="button"
                                onClick={() => handleConvert(doc, 'receipt')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                                title={language === 'fr' ? 'Convertir en Reçu' : 'Convert to Receipt'}
                              >
                                {language === 'fr' ? '→ Reçu' : '→ Receipt'}
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id, doc.documentNumber)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title={language === 'fr' ? 'Supprimer' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MANUAL DOCUMENT GENERATOR & EDITOR MODAL */}
      {/* ======================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-[#F8F8FA]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#7B173B]/10 rounded-xl text-[#7B173B]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-brand text-lg font-bold text-[#171719]">
                    {formData.id
                      ? language === 'fr'
                        ? `Modifier ${formData.type?.toUpperCase()} #${formData.documentNumber}`
                        : `Edit ${formData.type?.toUpperCase()} #${formData.documentNumber}`
                      : language === 'fr'
                      ? `Créer un nouveau ${formData.type === 'quotation' ? 'Devis' : formData.type === 'invoice' ? 'Facture' : 'Reçu'}`
                      : `Create New ${formData.type?.toUpperCase()}`}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {language === 'fr'
                      ? 'Remplissez manuellement les détails du document en KES ou en USD.'
                      : 'Fill in document details manually with KES or USD currency.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Document Type & Currency Selection Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#F8F8FA] rounded-2xl border border-gray-200">
                {/* Type Selection */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1.5 uppercase text-[10px] tracking-wider">
                    {language === 'fr' ? 'Type de Document' : 'Document Type'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          type: 'quotation',
                          status: prev.status === 'paid' ? 'draft' : prev.status,
                        }))
                      }
                      className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer transition-all ${
                        formData.type === 'quotation'
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {language === 'fr' ? 'Devis' : 'Quotation'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          type: 'invoice',
                          status: prev.status || 'draft',
                        }))
                      }
                      className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer transition-all ${
                        formData.type === 'invoice'
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {language === 'fr' ? 'Facture' : 'Invoice'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          type: 'receipt',
                          status: 'paid',
                          paymentDate: prev.paymentDate || new Date().toISOString().split('T')[0],
                        }))
                      }
                      className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer transition-all ${
                        formData.type === 'receipt'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {language === 'fr' ? 'Reçu' : 'Receipt'}
                    </button>
                  </div>
                </div>

                {/* Currency Selection (USD or KES) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">
                      {language === 'fr' ? 'Devise du Document' : 'Document Currency'}
                    </label>
                    <span className="text-[10px] text-gray-400">
                      1 USD = {formData.exchangeRateUsed || 130} KES
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, currency: 'KES' }))}
                      className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer transition-all ${
                        formData.currency === 'KES'
                          ? 'bg-[#7B173B] text-white border-[#7B173B] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      KES — Shilling (Ksh)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, currency: 'USD' }))}
                      className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer transition-all ${
                        formData.currency === 'USD'
                          ? 'bg-[#7B173B] text-white border-[#7B173B] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      USD — US Dollar ($)
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Meta (Number, Status, Dates) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {language === 'fr' ? 'N° Document' : 'Document #'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.documentNumber || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, documentNumber: e.target.value }))}
                    className="w-full p-2 bg-[#F8F8FA] border border-gray-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {language === 'fr' ? 'Statut' : 'Status'}
                  </label>
                  <select
                    value={formData.status || 'draft'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                    className="w-full p-2 bg-[#F8F8FA] border border-gray-200 rounded-xl font-medium"
                  >
                    <option value="draft">{language === 'fr' ? 'Brouillon' : 'Draft'}</option>
                    <option value="sent">{language === 'fr' ? 'Envoyé' : 'Sent'}</option>
                    <option value="accepted">{language === 'fr' ? 'Accepté' : 'Accepted'}</option>
                    <option value="partial">{language === 'fr' ? 'Partiel' : 'Partial'}</option>
                    <option value="paid">{language === 'fr' ? 'Payé' : 'Paid'}</option>
                    <option value="cancelled">{language === 'fr' ? 'Annulé' : 'Cancelled'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {language === 'fr' ? 'Date d’Émission' : 'Issue Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issueDate || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
                    className="w-full p-2 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {formData.type === 'receipt'
                      ? language === 'fr'
                        ? 'Date d’Encaissement'
                        : 'Payment Date'
                      : language === 'fr'
                      ? 'Date d’Échéance'
                      : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.type === 'receipt' ? formData.paymentDate || '' : formData.dueDate || ''}
                    onChange={(e) =>
                      setFormData((prev) =>
                        formData.type === 'receipt'
                          ? { ...prev, paymentDate: e.target.value }
                          : { ...prev, dueDate: e.target.value }
                      )
                    }
                    className="w-full p-2 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Client Information Section */}
              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <div className="font-bold text-gray-800 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-[#7B173B]" />
                    <span>{language === 'fr' ? 'Informations Client (Facturé à)' : 'Client Details (Billed To)'}</span>
                  </div>

                  {/* Optional Quick Fill from CRM */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">
                      {language === 'fr' ? 'Ou pré-remplir depuis le CRM :' : 'Or quick-fill from CRM:'}
                    </span>
                    <select
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      defaultValue=""
                      className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="">{language === 'fr' ? '-- Choisir Client --' : '-- Pick Client --'}</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.phone || c.city || 'CRM'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      {language === 'fr' ? 'Nom du Client *' : 'Client Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alain Kanyamihigo"
                      value={formData.clientName || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      {language === 'fr' ? 'Société / Boutique (optionnel)' : 'Company / Store (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Boutique Kivu Elegance"
                      value={formData.clientCompany || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientCompany: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      {language === 'fr' ? 'Téléphone / WhatsApp' : 'Phone / WhatsApp'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +243 998 123 456"
                      value={formData.clientPhone || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      {language === 'fr' ? 'Adresse E-mail' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      placeholder="client@gmail.com"
                      value={formData.clientEmail || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientEmail: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      {language === 'fr' ? 'Adresse / Ville / Pays' : 'Address / City / Country'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Goma, DR Congo / Westlands, Nairobi"
                      value={formData.clientAddress || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientAddress: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      {language === 'fr' ? 'N° PIN Fiscal / KRA PIN (optionnel)' : 'Tax PIN / KRA PIN (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. P051234567Z"
                      value={formData.clientTaxPin || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientTaxPin: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table (Manual Filling with optional Product Picker) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#7B173B]" />
                    <span>
                      {language === 'fr' ? 'Articles & Services Facturés' : 'Line Items & Services'} ({formData.items.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#7B173B]/10 hover:bg-[#7B173B]/20 text-[#7B173B] font-bold rounded-xl cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'fr' ? 'Ajouter une Ligne' : 'Add Line Item'}</span>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F8FA] border-b border-gray-200 text-gray-600 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3">{language === 'fr' ? 'Description de l’article / Service' : 'Description / Service'}</th>
                        <th className="py-2.5 px-3 w-28">{language === 'fr' ? 'Réf / SKU' : 'SKU / Ref'}</th>
                        <th className="py-2.5 px-3 w-20 text-center">{language === 'fr' ? 'Qté' : 'Qty'}</th>
                        <th className="py-2.5 px-3 w-32">
                          {language === 'fr'
                            ? `Prix Unitaire (${formData.currency})`
                            : `Unit Price (${formData.currency})`}
                        </th>
                        <th className="py-2.5 px-3 w-20 text-center">{language === 'fr' ? 'Remise %' : 'Disc %'}</th>
                        <th className="py-2.5 px-3 w-28 text-right">
                          {language === 'fr' ? `Total (${formData.currency})` : `Total (${formData.currency})`}
                        </th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 text-gray-400 font-mono text-[10px]">{idx + 1}</td>

                          {/* Description + optional product picker */}
                          <td className="py-2.5 px-3 space-y-1">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Tailored Wool Blazer or Alteration Services"
                              value={item.description}
                              onChange={(e) => updateItem(idx, 'description', e.target.value)}
                              className="w-full p-1.5 bg-[#F8F8FA] border border-gray-200 rounded-lg text-xs"
                            />
                            {/* Quick Product Pick from Inventory */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-400">
                                {language === 'fr' ? 'Catalogue :' : 'Catalog:'}
                              </span>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) insertProductToLine(e.target.value, idx);
                                }}
                                defaultValue=""
                                className="text-[10px] bg-transparent text-gray-500 hover:text-gray-900 border-none underline cursor-pointer"
                              >
                                <option value="">{language === 'fr' ? 'Sélectionner un produit...' : 'Pick from store inventory...'}</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {language === 'fr' ? p.nameFr : p.nameEn} ({p.baseCurrency} {p.basePrice})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              placeholder="DAB-001"
                              value={item.sku || ''}
                              onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                              className="w-full p-1.5 bg-[#F8F8FA] border border-gray-200 rounded-lg font-mono text-xs"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-16 p-1.5 bg-[#F8F8FA] border border-gray-200 rounded-lg text-center font-bold"
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={0}
                              step={formData.currency === 'USD' ? '0.01' : '1'}
                              value={item.unitPrice}
                              onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full p-1.5 bg-[#F8F8FA] border border-gray-200 rounded-lg font-semibold"
                            />
                          </td>

                          {/* Discount % */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.discountPercent || 0}
                              onChange={(e) => updateItem(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                              className="w-14 p-1.5 bg-[#F8F8FA] border border-gray-200 rounded-lg text-center"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                            {formData.currency === 'USD' ? '$' : 'Ksh '}
                            {Number(item.total).toLocaleString(undefined, {
                              minimumFractionDigits: formData.currency === 'USD' ? 2 : 0,
                            })}
                          </td>

                          {/* Delete Item */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              disabled={formData.items.length <= 1}
                              className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-20 cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Calculations Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#F8F8FA] rounded-2xl border border-gray-200">
                {/* Payment, Tax, and Shipping Settings */}
                <div className="space-y-3">
                  <div className="font-bold text-gray-800 uppercase text-[10px] tracking-wider">
                    {language === 'fr' ? 'Remises, Taxes & Livraison' : 'Discounts, Taxes & Delivery'}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1 text-gray-600">
                        {language === 'fr' ? 'Remise Globale' : 'Global Discount'}
                      </label>
                      <div className="flex items-center gap-1">
                        <select
                          value={formData.discountType || 'fixed'}
                          onChange={(e) => {
                            const newType = e.target.value as any;
                            const calc = calculateTotals(
                              formData.items,
                              newType,
                              formData.discountValue || 0,
                              formData.taxRatePercent || 0,
                              formData.shippingFee || 0,
                              formData.amountPaid || 0
                            );
                            setFormData((prev) => ({
                              ...prev,
                              discountType: newType,
                              subtotal: calc.subtotal,
                              discountAmount: calc.discountAmount,
                              taxAmount: calc.taxAmount,
                              total: calc.total,
                              balanceDue: calc.balanceDue,
                            }));
                          }}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                        >
                          <option value="fixed">{formData.currency === 'USD' ? '$' : 'Ksh'}</option>
                          <option value="percentage">%</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={formData.discountValue || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const calc = calculateTotals(
                              formData.items,
                              formData.discountType || 'fixed',
                              val,
                              formData.taxRatePercent || 0,
                              formData.shippingFee || 0,
                              formData.amountPaid || 0
                            );
                            setFormData((prev) => ({
                              ...prev,
                              discountValue: val,
                              subtotal: calc.subtotal,
                              discountAmount: calc.discountAmount,
                              taxAmount: calc.taxAmount,
                              total: calc.total,
                              balanceDue: calc.balanceDue,
                            }));
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded-lg font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-gray-600">
                        {language === 'fr' ? 'TVA / Taxe (%)' : 'Tax / VAT (%)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.taxRatePercent || 0}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value) || 0;
                          const calc = calculateTotals(
                            formData.items,
                            formData.discountType || 'fixed',
                            formData.discountValue || 0,
                            rate,
                            formData.shippingFee || 0,
                            formData.amountPaid || 0
                          );
                          setFormData((prev) => ({
                            ...prev,
                            taxRatePercent: rate,
                            subtotal: calc.subtotal,
                            discountAmount: calc.discountAmount,
                            taxAmount: calc.taxAmount,
                            total: calc.total,
                            balanceDue: calc.balanceDue,
                          }));
                        }}
                        className="w-full p-1.5 bg-white border border-gray-200 rounded-lg font-medium"
                        placeholder="0 or 16"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1 text-gray-600">
                        {language === 'fr'
                          ? `Frais d'Expédition (${formData.currency})`
                          : `Shipping & Delivery (${formData.currency})`}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.shippingFee || 0}
                        onChange={(e) => {
                          const ship = parseFloat(e.target.value) || 0;
                          const calc = calculateTotals(
                            formData.items,
                            formData.discountType || 'fixed',
                            formData.discountValue || 0,
                            formData.taxRatePercent || 0,
                            ship,
                            formData.amountPaid || 0
                          );
                          setFormData((prev) => ({
                            ...prev,
                            shippingFee: ship,
                            subtotal: calc.subtotal,
                            discountAmount: calc.discountAmount,
                            taxAmount: calc.taxAmount,
                            total: calc.total,
                            balanceDue: calc.balanceDue,
                          }));
                        }}
                        className="w-full p-1.5 bg-white border border-gray-200 rounded-lg font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-gray-600">
                        {language === 'fr'
                          ? `Montant Déjà Encaissé (${formData.currency})`
                          : `Amount Paid (${formData.currency})`}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.amountPaid || 0}
                        onChange={(e) => {
                          const paid = parseFloat(e.target.value) || 0;
                          const calc = calculateTotals(
                            formData.items,
                            formData.discountType || 'fixed',
                            formData.discountValue || 0,
                            formData.taxRatePercent || 0,
                            formData.shippingFee || 0,
                            paid
                          );
                          setFormData((prev) => ({
                            ...prev,
                            amountPaid: paid,
                            balanceDue: calc.balanceDue,
                            status:
                              paid >= calc.total && calc.total > 0
                                ? 'paid'
                                : paid > 0
                                ? 'partial'
                                : prev.status === 'paid'
                                ? 'draft'
                                : prev.status,
                          }));
                        }}
                        className="w-full p-1.5 bg-white border border-gray-200 rounded-lg font-medium text-emerald-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                    <div>
                      <label className="font-semibold block mb-1 text-gray-600">
                        {language === 'fr' ? 'Mode de Paiement' : 'Payment Method'}
                      </label>
                      <select
                        value={formData.paymentMethod || 'mpesa'}
                        onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      >
                        <option value="mpesa">M-Pesa (Till / Paybill)</option>
                        <option value="bank_transfer">{language === 'fr' ? 'Virement Bancaire' : 'Bank Transfer'}</option>
                        <option value="cash">{language === 'fr' ? 'Espèces' : 'Cash'}</option>
                        <option value="card">{language === 'fr' ? 'Carte Bancaire' : 'Card'}</option>
                        <option value="other">{language === 'fr' ? 'Autre arrangement' : 'Other'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-gray-600">
                        {language === 'fr' ? 'Réf Transaction / M-Pesa' : 'Payment / M-Pesa Ref'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. QLK892019"
                        value={formData.paymentReference || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, paymentReference: e.target.value }))}
                        className="w-full p-1.5 bg-white border border-gray-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Final Calculations & Dual Currency Summary */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>{language === 'fr' ? 'Sous-total :' : 'Subtotal:'}</span>
                      <span className="font-semibold font-mono">
                        {formData.currency === 'USD' ? '$' : 'Ksh '}
                        {formData.subtotal?.toLocaleString(undefined, {
                          minimumFractionDigits: formData.currency === 'USD' ? 2 : 0,
                        })}
                      </span>
                    </div>

                    {formData.discountAmount! > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>{language === 'fr' ? 'Remise déduite :' : 'Discount:'}</span>
                        <span className="font-semibold font-mono">
                          -{formData.currency === 'USD' ? '$' : 'Ksh '}
                          {formData.discountAmount?.toLocaleString(undefined, {
                            minimumFractionDigits: formData.currency === 'USD' ? 2 : 0,
                          })}
                        </span>
                      </div>
                    )}

                    {formData.taxAmount! > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>
                          {language === 'fr' ? 'TVA' : 'Tax'} ({formData.taxRatePercent}%) :
                        </span>
                        <span className="font-semibold font-mono">
                          +{formData.currency === 'USD' ? '$' : 'Ksh '}
                          {formData.taxAmount?.toLocaleString(undefined, {
                            minimumFractionDigits: formData.currency === 'USD' ? 2 : 0,
                          })}
                        </span>
                      </div>
                    )}

                    {formData.shippingFee! > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>{language === 'fr' ? 'Livraison :' : 'Shipping:'}</span>
                        <span className="font-semibold font-mono">
                          +{formData.currency === 'USD' ? '$' : 'Ksh '}
                          {formData.shippingFee?.toLocaleString(undefined, {
                            minimumFractionDigits: formData.currency === 'USD' ? 2 : 0,
                          })}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                      <span className="font-bold text-sm text-[#171719]">
                        {language === 'fr' ? 'Total Général :' : 'Grand Total:'}
                      </span>
                      <span className="font-bold text-xl text-[#7B173B] font-mono">
                        {formData.currency === 'USD' ? '$' : 'Ksh '}
                        {formData.total?.toLocaleString(undefined, {
                          minimumFractionDigits: formData.currency === 'USD' ? 2 : 0,
                        })}
                      </span>
                    </div>

                    {/* Dual currency display */}
                    <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1 font-semibold">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Équivalence double devise :' : 'Dual-currency ref:'}</span>
                      </span>
                      <span className="font-bold font-mono">
                        {formData.currency === 'USD'
                          ? `≈ Ksh ${(
                              (formData.total || 0) * (formData.exchangeRateUsed || 130)
                            ).toLocaleString()} KES`
                          : `≈ $${(
                              (formData.total || 0) / (formData.exchangeRateUsed || 130)
                            ).toFixed(2)} USD`}
                      </span>
                    </div>

                    {formData.amountPaid! > 0 && (
                      <div className="flex justify-between text-emerald-700 pt-1">
                        <span>{language === 'fr' ? 'Montant payé :' : 'Amount Paid:'}</span>
                        <span className="font-semibold font-mono">
                          {formData.currency === 'USD' ? '$' : 'Ksh '}
                          {formData.amountPaid?.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-dashed border-gray-200">
                      <span>{language === 'fr' ? 'Solde Restant à Payer :' : 'Balance Due:'}</span>
                      <span className="font-mono text-base">
                        {formData.currency === 'USD' ? '$' : 'Ksh '}
                        {formData.balanceDue?.toLocaleString(undefined, {
                          minimumFractionDigits: formData.currency === 'USD' ? 2 : 0,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 text-[11px]">
                      <input
                        type="checkbox"
                        checked={formData.showDualCurrency}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, showDualCurrency: e.target.checked }))
                        }
                        className="rounded text-[#7B173B]"
                      />
                      <span>
                        {language === 'fr'
                          ? 'Afficher l’équivalence USD/KES sur la version imprimée'
                          : 'Show dual-currency conversion notice on printable document'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment & Banking Channels on this Document */}
              <div className="bg-[#F8F8FA] p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#7B173B]" />
                    <span className="font-bold text-gray-800 text-xs">
                      {language === 'fr'
                        ? 'Coordonnées de Règlement sur ce Document'
                        : 'Payment Channels on this Document'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {Boolean(
                      formData.issuerMpesaTill ||
                      formData.issuerMpesaPaybill ||
                      formData.issuerBankName
                    ) ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        {language === 'fr' ? 'Auto-rempli depuis Paramètres CMS' : 'Auto-filled from CMS & Settings'}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                        {language === 'fr' ? 'Non configuré (masqué sur ce document)' : 'Not filled in CMS (hidden on document)'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const s = storage.getSettings();
                        setFormData((prev) => ({
                          ...prev,
                          issuerMpesaTill: s.mpesaTillNumber || '',
                          issuerMpesaPaybill: s.mpesaPaybillNumber
                            ? (s.mpesaPaybillAccount ? `${s.mpesaPaybillNumber} (A/C: ${s.mpesaPaybillAccount})` : s.mpesaPaybillNumber)
                            : '',
                          issuerBankName: s.bankName || '',
                          issuerBankAccount: s.bankAccountNumber || '',
                          issuerBankSwift: s.bankSwiftCode || '',
                          issuerTaxPin: s.taxPinNumber || '',
                        }));
                      }}
                      className="text-[10px] text-[#7B173B] hover:underline font-semibold cursor-pointer"
                    >
                      {language === 'fr' ? 'Recharger depuis Paramètres' : 'Reload from Settings'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500">
                  {language === 'fr'
                    ? 'Ces coordonnées sont automatiquement alimentées depuis la page « Paramètres & CMS ». Si les champs sont vides, ils n’apparaîtront pas sur les versions imprimées ou partagées.'
                    : 'These details are automatically filled from CMS & Settings. If left blank, they will not appear on printed or shared documents.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                      M-Pesa Buy Goods Till
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={formData.issuerMpesaTill || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issuerMpesaTill: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                      M-Pesa Paybill
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 247247 (A/C: DABIN)"
                      value={formData.issuerMpesaPaybill || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issuerMpesaPaybill: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                      {language === 'fr' ? 'Nom de la Banque' : 'Bank Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bank Name Kenya"
                      value={formData.issuerBankName || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issuerBankName: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                      {language === 'fr' ? 'Numéro de Compte' : 'Bank Account Number'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0123456789 (KES / USD)"
                      value={formData.issuerBankAccount || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issuerBankAccount: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                      SWIFT / BIC (USD Wire)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BANKKENA"
                      value={formData.issuerBankSwift || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issuerBankSwift: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg font-mono uppercase text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                      Issuer Tax / KRA PIN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. P051234567Z"
                      value={formData.issuerTaxPin || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issuerTaxPin: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Notes and Terms & Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {language === 'fr' ? 'Note au Client' : 'Note to Client'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {language === 'fr' ? 'Conditions Commerciales' : 'Terms & Conditions'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.termsAndConditions || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, termsAndConditions: e.target.value }))
                    }
                    className="w-full p-2 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Digital Stamp & Signatory Checkbox */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 text-xs">
                  <input
                    type="checkbox"
                    checked={formData.includeDigitalStamp}
                    onChange={(e) =>
                    setFormData((prev) => ({ ...prev, includeDigitalStamp: e.target.checked }))
                    }
                    className="rounded text-[#7B173B]"
                  />
                  <span>
                    {language === 'fr'
                      ? 'Apposer le tampon et sceau officiel DABIN Fashion sur le document'
                      : 'Affix DABIN Fashion official stamp & seal on document'}
                  </span>
                </label>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span className="text-[11px]">{language === 'fr' ? 'Signataire :' : 'Signatory:'}</span>
                  <input
                    type="text"
                    value={formData.signatureName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, signatureName: e.target.value }))
                    }
                    className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs"
                  />
                </div>
              </div>

              {/* AUTOMATED CLIENT DELIVERY UPON COMPLETION (WHATSAPP / EMAIL) */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSendToClient}
                      onChange={(e) => setAutoSendToClient(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'fr'
                        ? 'Transmettre automatiquement au client dès validation'
                        : 'Send automatically to client once filling is complete'}
                    </span>
                  </label>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {language === 'fr' ? 'Auto-Envoi Activé' : 'Instant Dispatch'}
                  </span>
                </div>

                {autoSendToClient && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    {/* WhatsApp */}
                    <label
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        autoSendChannel === 'whatsapp'
                          ? 'bg-white border-emerald-500 shadow-xs'
                          : 'bg-white/60 border-gray-200 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="autoSendChannel"
                        checked={autoSendChannel === 'whatsapp'}
                        onChange={() => setAutoSendChannel('whatsapp')}
                        className="text-emerald-600"
                      />
                      <div className="min-w-0">
                        <span className="font-bold block text-gray-800">WhatsApp</span>
                        <span className="text-[10px] text-gray-500 block truncate">
                          {formData.clientPhone || (language === 'fr' ? 'Tél non renseigné' : 'No phone entered')}
                        </span>
                      </div>
                    </label>

                    {/* Email */}
                    <label
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        autoSendChannel === 'email'
                          ? 'bg-white border-blue-500 shadow-xs'
                          : 'bg-white/60 border-gray-200 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="autoSendChannel"
                        checked={autoSendChannel === 'email'}
                        onChange={() => setAutoSendChannel('email')}
                        className="text-blue-600"
                      />
                      <div className="min-w-0">
                        <span className="font-bold block text-gray-800">E-mail</span>
                        <span className="text-[10px] text-gray-500 block truncate">
                          {formData.clientEmail || (language === 'fr' ? 'Email non renseigné' : 'No email entered')}
                        </span>
                      </div>
                    </label>

                    {/* Both */}
                    <label
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        autoSendChannel === 'both'
                          ? 'bg-white border-purple-500 shadow-xs'
                          : 'bg-white/60 border-gray-200 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="autoSendChannel"
                        checked={autoSendChannel === 'both'}
                        onChange={() => setAutoSendChannel('both')}
                        className="text-purple-600"
                      />
                      <div className="min-w-0">
                        <span className="font-bold block text-gray-800">
                          {language === 'fr' ? 'WhatsApp & Email' : 'Both Channels'}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {language === 'fr' ? 'Double transmission' : 'Simultaneous send'}
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-gray-200 bg-[#F8F8FA] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-medium cursor-pointer"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* Save only */}
                <button
                  type="button"
                  onClick={() => handleSaveDocument(false, false)}
                  className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl cursor-pointer"
                >
                  {language === 'fr' ? 'Enregistrer le Document' : 'Save Document'}
                </button>

                {/* Save & Send to Client */}
                <button
                  type="button"
                  onClick={() => handleSaveDocument(false, true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
                  title="Save and automatically send document to client"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? 'Enregistrer & Envoyer au Client' : 'Save & Send to Client'}
                  </span>
                </button>

                {/* Save & Print */}
                <button
                  type="button"
                  onClick={() => handleSaveDocument(true, false)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#7B173B] hover:bg-[#62122F] text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Enregistrer & Imprimer' : 'Save & Print'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HIGH-FASHION PRINT & PDF PREVIEW MODAL */}
      {/* ======================================================== */}
      {isPreviewOpen && activeDocument && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
            {/* Top Toolbar (Hidden on print) */}
            {/* Top Toolbar (Hidden on print) */}
            <div className="p-4 bg-gray-900 text-white flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm bg-white/10 px-2.5 py-1 rounded-lg">
                  {activeDocument.documentNumber}
                </span>
                <span className="text-xs text-gray-300">
                  {activeDocument.type.toUpperCase()} • {activeDocument.currency}
                </span>
                {toastMessage && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium animate-pulse">
                    {toastMessage}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Download PDF */}
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={() => handleDownloadPdf(activeDocument)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#7B173B] hover:bg-[#62122F] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                  title={language === 'fr' ? 'Télécharger en fichier PDF' : 'Download as PDF file'}
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isDownloadingPdf
                      ? language === 'fr'
                        ? 'Génération...'
                        : 'Generating PDF...'
                      : language === 'fr'
                      ? 'Télécharger PDF'
                      : 'Download PDF'}
                  </span>
                </button>

                {/* 2. Share to Social Platforms & Apps (WhatsApp, Instagram, TikTok, Facebook, Email, etc.) */}
                <button
                  type="button"
                  onClick={() => {
                    setShareTargetDoc(activeDocument);
                    setIsShareModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
                  title={language === 'fr' ? 'Partager (WhatsApp, Instagram, TikTok, Facebook, etc.)' : 'Share (WhatsApp, Instagram, TikTok, Facebook, etc.)'}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Partager & Réseaux' : 'Share & Socials'}</span>
                </button>

                {/* 3. Send via WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(activeDocument)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  title={language === 'fr' ? 'Envoyer au client via WhatsApp' : 'Send to client via WhatsApp'}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* 4. Send via Email */}
                {activeDocument.clientEmail && (
                  <button
                    type="button"
                    onClick={() => handleOpenEmail(activeDocument)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    title={language === 'fr' ? 'Envoyer par E-mail' : 'Send via Email'}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>
                )}

                {/* 5. Copy Text */}
                <button
                  type="button"
                  onClick={() => copyWhatsAppSummary(activeDocument)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium cursor-pointer"
                  title={language === 'fr' ? 'Copier le texte récapitulatif' : 'Copy summary text'}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? (language === 'fr' ? 'Copié' : 'Copied') : (language === 'fr' ? 'Copier' : 'Copy')}</span>
                </button>

                {/* 6. Print Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-medium cursor-pointer"
                  title={language === 'fr' ? 'Imprimer le document' : 'Print document'}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Imprimer' : 'Print'}</span>
                </button>

                {/* 7. Edit */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handleEdit(activeDocument);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Modifier' : 'Edit'}</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable A4 Commercial Sheet Body */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white">
              <div
                id="printable-document"
                className="max-w-3xl mx-auto space-y-8 text-gray-900 font-sans"
              >
                {/* Brand Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b-2 border-gray-900">
                  <div className="space-y-1">
                    <DabinLogo size="md" sloganLanguage={language} />
                    <p className="text-[11px] text-gray-500 pt-1">
                      {OFFICIAL_BUSINESS_INFO.location} • Tel: {OFFICIAL_BUSINESS_INFO.phone}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Email: {OFFICIAL_BUSINESS_INFO.email}
                    </p>
                  </div>

                  <div className="sm:text-right space-y-1">
                    <span className="px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-widest bg-[#7B173B] text-white inline-block">
                      {activeDocument.type === 'quotation'
                        ? language === 'fr'
                          ? 'DEVIS PROFORMA'
                          : 'PROFORMA QUOTATION'
                        : activeDocument.type === 'invoice'
                        ? language === 'fr'
                          ? 'FACTURE OFFICIELLE'
                          : 'TAX INVOICE'
                        : language === 'fr'
                        ? 'REÇU DE PAIEMENT'
                        : 'PAYMENT RECEIPT'}
                    </span>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-gray-950 pt-1">
                      #{activeDocument.documentNumber}
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'fr' ? 'Date d’émission :' : 'Date of Issue:'}{' '}
                      <b className="text-gray-900">{activeDocument.issueDate}</b>
                    </div>
                    {activeDocument.dueDate && (
                      <div className="text-xs text-gray-500">
                        {language === 'fr' ? 'Date d’échéance :' : 'Due Date:'}{' '}
                        <b className="text-gray-900">{activeDocument.dueDate}</b>
                      </div>
                    )}
                    {activeDocument.paymentDate && (
                      <div className="text-xs text-emerald-700 font-semibold">
                        {language === 'fr' ? 'Encaissé le :' : 'Payment Received:'}{' '}
                        {activeDocument.paymentDate}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bill To & Issuer Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-gray-400">
                      {language === 'fr' ? 'DESTINATAIRE / CLIENT' : 'BILLED TO / CLIENT'}
                    </div>
                    <div className="text-base font-bold text-gray-900">{activeDocument.clientName}</div>
                    {activeDocument.clientCompany && (
                      <div className="font-semibold text-gray-700">{activeDocument.clientCompany}</div>
                    )}
                    {activeDocument.clientAddress && (
                      <div className="text-gray-600 flex items-start gap-1 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span>{activeDocument.clientAddress}</span>
                      </div>
                    )}
                    {activeDocument.clientPhone && (
                      <div className="text-gray-600 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{activeDocument.clientPhone}</span>
                      </div>
                    )}
                    {activeDocument.clientEmail && (
                      <div className="text-gray-600 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{activeDocument.clientEmail}</span>
                      </div>
                    )}
                    {activeDocument.clientTaxPin && (
                      <div className="text-[11px] text-gray-500 font-mono pt-1">
                        PIN / Tax ID: {activeDocument.clientTaxPin}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs sm:text-right">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-gray-400">
                      {Boolean(
                        activeDocument.issuerMpesaTill?.trim() ||
                        activeDocument.issuerMpesaPaybill?.trim() ||
                        activeDocument.issuerBankName?.trim()
                      )
                        ? language === 'fr'
                          ? 'ÉMETTEUR & RÈGLEMENT'
                          : 'ISSUER & PAYMENT'
                        : language === 'fr'
                        ? 'ÉMETTEUR'
                        : 'ISSUER'}
                    </div>
                    <div className="text-base font-bold text-gray-900">{activeDocument.issuerName}</div>
                    <div className="text-gray-600">{activeDocument.issuerLocation}</div>
                    {activeDocument.issuerTaxPin && (
                      <div className="text-[11px] text-gray-500 font-mono">
                        PIN / Tax ID: {activeDocument.issuerTaxPin}
                      </div>
                    )}
                    {(activeDocument.issuerMpesaTill?.trim() ||
                      activeDocument.issuerMpesaPaybill?.trim() ||
                      activeDocument.issuerBankName?.trim() ||
                      activeDocument.issuerBankSwift?.trim()) ? (
                      <div className="pt-2 text-[11px] space-y-0.5 text-gray-700">
                        {activeDocument.issuerMpesaTill?.trim() && (
                          <div>
                            M-Pesa Buy Goods Till: <b className="text-gray-900">{activeDocument.issuerMpesaTill}</b>
                          </div>
                        )}
                        {activeDocument.issuerMpesaPaybill?.trim() && (
                          <div>
                            M-Pesa Paybill: <b className="text-gray-900">{activeDocument.issuerMpesaPaybill}</b>
                          </div>
                        )}
                        {activeDocument.issuerBankName?.trim() && (
                          <div>
                            Bank: <b>{activeDocument.issuerBankName}</b>
                            {activeDocument.issuerBankAccount?.trim() && ` • A/C: ${activeDocument.issuerBankAccount}`}
                          </div>
                        )}
                        {activeDocument.currency === 'USD' && activeDocument.issuerBankSwift?.trim() && (
                          <div>
                            SWIFT: <b className="font-mono">{activeDocument.issuerBankSwift}</b> (USD Wire)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 text-[10px] text-amber-700/80 italic print:hidden">
                        {language === 'fr'
                          ? '(Coordonnées bancaires non renseignées dans Paramètres CMS)'
                          : '(Payment channels not configured yet in CMS & Settings)'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 border-b border-gray-200 font-bold text-[10px] uppercase tracking-wider text-gray-700">
                      <tr>
                        <th className="py-3 px-4 w-10">#</th>
                        <th className="py-3 px-4">{language === 'fr' ? 'Description des Articles & Services' : 'Item Description & Service'}</th>
                        <th className="py-3 px-4 w-16 text-center">{language === 'fr' ? 'Qté' : 'Qty'}</th>
                        <th className="py-3 px-4 w-28 text-right">
                          {language === 'fr' ? `Prix Unit.` : `Unit Price`}
                        </th>
                        <th className="py-3 px-4 w-28 text-right">
                          {language === 'fr' ? `Montant (${activeDocument.currency})` : `Amount (${activeDocument.currency})`}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeDocument.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900">{item.description}</div>
                            {item.sku && (
                              <div className="text-[10px] font-mono text-gray-500">SKU: {item.sku}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-800">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-medium text-gray-700">
                            {activeDocument.currency === 'USD' ? '$' : 'Ksh '}
                            {Number(item.unitPrice).toLocaleString(undefined, {
                              minimumFractionDigits: activeDocument.currency === 'USD' ? 2 : 0,
                            })}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            {activeDocument.currency === 'USD' ? '$' : 'Ksh '}
                            {Number(item.total).toLocaleString(undefined, {
                              minimumFractionDigits: activeDocument.currency === 'USD' ? 2 : 0,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary & Dual Currency Callout */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2">
                  {/* Left: Notes & Banking Instructions */}
                  <div className="w-full sm:w-1/2 space-y-3 text-xs text-gray-600">
                    {activeDocument.notes && (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="font-bold text-[10px] uppercase text-gray-500 mb-1">
                          {language === 'fr' ? 'Note / Instructions :' : 'Note to Client:'}
                        </div>
                        <p className="leading-relaxed">{activeDocument.notes}</p>
                      </div>
                    )}

                    {activeDocument.termsAndConditions && (
                      <div className="text-[10px] text-gray-400 leading-relaxed">
                        <b>{language === 'fr' ? 'Conditions :' : 'Terms:'}</b>{' '}
                        {activeDocument.termsAndConditions}
                      </div>
                    )}
                  </div>

                  {/* Right: Totals Card */}
                  <div className="w-full sm:w-5/12 bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>{language === 'fr' ? 'Sous-total :' : 'Subtotal:'}</span>
                      <span className="font-semibold font-mono">
                        {activeDocument.currency === 'USD' ? '$' : 'Ksh '}
                        {Number(activeDocument.subtotal).toLocaleString(undefined, {
                          minimumFractionDigits: activeDocument.currency === 'USD' ? 2 : 0,
                        })}
                      </span>
                    </div>

                    {activeDocument.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>{language === 'fr' ? 'Remise :' : 'Discount:'}</span>
                        <span className="font-semibold font-mono">
                          -{activeDocument.currency === 'USD' ? '$' : 'Ksh '}
                          {Number(activeDocument.discountAmount).toLocaleString(undefined, {
                            minimumFractionDigits: activeDocument.currency === 'USD' ? 2 : 0,
                          })}
                        </span>
                      </div>
                    )}

                    {activeDocument.taxAmount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>
                          {language === 'fr' ? 'TVA' : 'Tax'} ({activeDocument.taxRatePercent}%) :
                        </span>
                        <span className="font-semibold font-mono">
                          +{activeDocument.currency === 'USD' ? '$' : 'Ksh '}
                          {Number(activeDocument.taxAmount).toLocaleString(undefined, {
                            minimumFractionDigits: activeDocument.currency === 'USD' ? 2 : 0,
                          })}
                        </span>
                      </div>
                    )}

                    {activeDocument.shippingFee > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>{language === 'fr' ? 'Expédition / Livraison :' : 'Shipping & Cargo:'}</span>
                        <span className="font-semibold font-mono">
                          +{activeDocument.currency === 'USD' ? '$' : 'Ksh '}
                          {Number(activeDocument.shippingFee).toLocaleString(undefined, {
                            minimumFractionDigits: activeDocument.currency === 'USD' ? 2 : 0,
                          })}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t-2 border-gray-900 flex justify-between items-baseline">
                      <span className="font-extrabold text-sm text-gray-900 uppercase">
                        {language === 'fr' ? 'TOTAL À PAYER :' : 'TOTAL PAYABLE:'}
                      </span>
                      <span className="font-extrabold text-xl text-[#7B173B] font-mono">
                        {activeDocument.currency === 'USD' ? '$' : 'Ksh '}
                        {Number(activeDocument.total).toLocaleString(undefined, {
                          minimumFractionDigits: activeDocument.currency === 'USD' ? 2 : 0,
                        })}
                      </span>
                    </div>

                    {/* Dual Currency Banner */}
                    {activeDocument.showDualCurrency && (
                      <div className="mt-2 p-2 bg-[#7B173B]/5 rounded-xl border border-[#7B173B]/20 text-[11px] text-[#7B173B] flex items-center justify-between font-semibold">
                        <span>
                          {activeDocument.currency === 'USD'
                            ? 'Dual Currency (KES Approx):'
                            : 'Dual Currency (USD Approx):'}
                        </span>
                        <span className="font-mono font-bold">
                          {activeDocument.currency === 'USD'
                            ? `≈ Ksh ${(
                                activeDocument.total * (activeDocument.exchangeRateUsed || 130)
                              ).toLocaleString()} KES`
                            : `≈ $${(
                                activeDocument.total / (activeDocument.exchangeRateUsed || 130)
                              ).toFixed(2)} USD`}
                        </span>
                      </div>
                    )}

                    {activeDocument.amountPaid > 0 && (
                      <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-gray-200">
                        <span>{language === 'fr' ? 'Montant déjà payé :' : 'Amount Paid:'}</span>
                        <span className="font-mono">
                          {activeDocument.currency === 'USD' ? '$' : 'Ksh '}
                          {Number(activeDocument.amountPaid).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {activeDocument.balanceDue > 0 && (
                      <div className="flex justify-between text-amber-800 font-extrabold pt-1">
                        <span>{language === 'fr' ? 'SOLDE DÛ :' : 'BALANCE DUE:'}</span>
                        <span className="font-mono text-base">
                          {activeDocument.currency === 'USD' ? '$' : 'Ksh '}
                          {Number(activeDocument.balanceDue).toLocaleString(undefined, {
                            minimumFractionDigits: activeDocument.currency === 'USD' ? 2 : 0,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stamp & Authorized Signatory Footer */}
                <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {activeDocument.includeDigitalStamp && (
                      <div className="w-16 h-16 rounded-full border-2 border-[#7B173B] flex flex-col items-center justify-center text-center p-1 text-[#7B173B] font-serif-brand rotate-[-8deg] shadow-2xs">
                        <span className="text-[8px] font-bold uppercase tracking-wider">DABIN</span>
                        <span className="text-[7px] font-bold">OFFICIAL</span>
                        <span className="text-[6px] uppercase tracking-tighter">NAIROBI</span>
                      </div>
                    )}
                    <div className="text-[11px] text-gray-500">
                      <div className="font-semibold text-gray-800">{OFFICIAL_BUSINESS_INFO.name}</div>
                      <div>{OFFICIAL_BUSINESS_INFO.englishSlogan} • {OFFICIAL_BUSINESS_INFO.primarySloganFr}</div>
                    </div>
                  </div>

                  <div className="text-center sm:text-right text-xs">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                      {language === 'fr' ? 'Signature & Approbation' : 'Authorized Signature'}
                    </div>
                    <div className="font-serif-brand text-sm italic font-bold text-gray-800 border-b border-gray-400 pb-1 inline-block min-w-[160px]">
                      {activeDocument.signatureName || 'DABIN Fashion House'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Share & PDF Export Modal */}
      {isShareModalOpen && (shareTargetDoc || activeDocument) && (
        <ShareDocumentModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareTargetDoc(null);
          }}
          targetElementId="printable-document"
          documentTitle={`DABIN Fashion - ${(shareTargetDoc || activeDocument)!.type.toUpperCase()} #${
            (shareTargetDoc || activeDocument)!.documentNumber
          }`}
          documentNumber={(shareTargetDoc || activeDocument)!.documentNumber}
          fileName={`DABIN-${(shareTargetDoc || activeDocument)!.type.toUpperCase()}-${
            (shareTargetDoc || activeDocument)!.documentNumber
          }.pdf`}
          summaryText={generateDocumentSummary(shareTargetDoc || activeDocument!)}
          recipientPhone={(shareTargetDoc || activeDocument)!.clientPhone}
          recipientEmail={(shareTargetDoc || activeDocument)!.clientEmail}
          language={language}
          onSent={(channel) => {
            setToastMessage(
              language === 'fr'
                ? `✓ Document transmis via ${channel} !`
                : `✓ Document shared via ${channel}!`
            );
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}
    </AdminLayout>
  );
};
