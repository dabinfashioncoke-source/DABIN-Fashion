import React from 'react';
import { Eye, MessageCircle, Play } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { language, formatPrice, t, settings } = useApp();

  const name = language === 'fr' ? product.nameFr : product.nameEn;
  const isAvailable = product.status === 'available' || product.status === 'low_stock';
  const availableQty = Math.max(0, product.quantityOnHand - product.reservedQuantity);

  const handleWhatsAppInquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = storage.generateProductInquiryMessage(name, product.sku, language);
    const link = storage.getWhatsAppLink(msg);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Status text styling
  const getStatusDisplay = () => {
    if (product.status === 'out_of_stock' || availableQty === 0) {
      return {
        label: t.status.out_of_stock,
        color: 'text-amber-800 bg-amber-50 border-amber-200',
        available: false,
      };
    }
    if (product.status === 'low_stock') {
      return {
        label: t.status.low_stock,
        color: 'text-orange-800 bg-orange-50 border-orange-200',
        available: true,
      };
    }
    return {
      label: t.status.available,
      color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      available: true,
    };
  };

  const statusInfo = getStatusDisplay();
  const conditionLabel = t.condition[product.condition] || product.condition;

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative bg-white border border-[#E8E8EE] rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Product Image Frame */}
      <div className="relative aspect-4/5 w-full bg-[#F4F4F6] overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80'}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
        />

        {/* Video available indicator badge */}
        {product.videos && product.videos.length > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[10px] font-semibold shadow-xs">
              <Play className="w-2.5 h-2.5 fill-[#D4AF37] text-[#D4AF37]" />
              <span>{language === 'fr' ? 'Vidéo' : 'Video'}</span>
            </span>
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-xs ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
          {settings.publicStockVisible && isAvailable && availableQty > 0 && (
            <span className="text-[10px] font-medium bg-black/75 text-white px-2 py-0.5 rounded-full">
              {availableQty} {availableQty === 1 ? t.common.piece : t.common.pieces}
            </span>
          )}
        </div>

        {/* Quick View Button Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white text-[#171719] text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            {t.common.viewDetails}
          </span>
        </div>
      </div>

      {/* Product Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Metadata line: condition & brand */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>{product.brand || 'DABIN Curated'}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{conditionLabel}</span>
          </div>

          {/* Product Title */}
          <h3 className="font-serif-brand text-base font-bold text-[#171719] line-clamp-1 group-hover:text-[#7B173B] transition-colors">
            {name}
          </h3>

          {/* SKU code */}
          <div className="text-[11px] text-gray-400 mt-0.5">
            {t.common.sku}: {product.sku}
          </div>
        </div>

        {/* Pricing and Action row */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-bold text-[#7B173B] tracking-tight">
              {formatPrice(product.basePrice, product.baseCurrency)}
            </div>
            <div className="text-[10px] text-gray-500">
              {language === 'fr' ? 'Prix unique pour tous' : 'Standard price for all'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleWhatsAppInquiry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F4F6] hover:bg-[#25D366] text-[#171719] hover:text-white text-xs font-semibold rounded-lg transition-colors border border-gray-200"
            title={t.common.askOnWhatsApp}
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366] group-hover/btn:text-white" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
