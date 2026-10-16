import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  ShieldCheck,
  Truck,
  CheckCircle,
  AlertCircle,
  Tag,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
} from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSelectProduct,
}) => {
  const { language, formatPrice, t, settings, publishedProducts } = useApp();
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!product) return null;

  const name = language === 'fr' ? product.nameFr : product.nameEn;
  const description = language === 'fr' ? product.descriptionFr : product.descriptionEn;
  const isAvailable = product.status === 'available' || product.status === 'low_stock';
  const availableQty = Math.max(0, product.quantityOnHand - product.reservedQuantity);

  const images = product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80'];
  const videos = product.videos || [];

  interface MediaItem {
    type: 'photo' | 'video';
    url: string;
  }

  const mediaItems: MediaItem[] = [
    ...images.map((url) => ({ type: 'photo' as const, url })),
    ...videos.map((url) => ({ type: 'video' as const, url })),
  ];

  const currentMedia = mediaItems[selectedMediaIndex] || mediaItems[0];

  const handleWhatsAppInquiry = () => {
    const msg = storage.generateProductInquiryMessage(name, product.sku, language);
    const link = storage.getWhatsAppLink(msg);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Related products from same category
  const relatedProducts = publishedProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-200 relative flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAFC]">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-gray-500 font-semibold">
              SKU: {product.sku}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-600 font-medium">{product.brand || 'DABIN Curated'}</span>
            {videos.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7B173B] bg-[#7B173B]/10 px-2 py-0.5 rounded-full ml-1">
                <Film className="w-3 h-3" />
                <span>{videos.length} {videos.length === 1 ? 'Vidéo' : 'Vidéos'}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Photos & Video Gallery */}
            <div className="space-y-4">
              {/* Primary Media Display */}
              <div className="relative aspect-4/5 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 group flex items-center justify-center">
                {currentMedia.type === 'video' ? (
                  <video
                    key={currentMedia.url}
                    src={currentMedia.url}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <>
                    <img
                      src={currentMedia.url}
                      alt={name}
                      className="w-full h-full object-cover object-center"
                    />

                    <button
                      type="button"
                      onClick={() => setZoomOpen(true)}
                      className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors backdrop-blur-xs"
                      title="Enlarge photo"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                {mediaItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMediaIndex((prev) =>
                          prev === 0 ? mediaItems.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md transition-all z-10 cursor-pointer"
                      title="Previous"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMediaIndex((prev) =>
                          prev === mediaItems.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md transition-all z-10 cursor-pointer"
                      title="Next"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails row for photos and videos */}
              {mediaItems.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {mediaItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedMediaIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        selectedMediaIndex === idx
                          ? 'border-[#7B173B] scale-102 ring-2 ring-[#7B173B]/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      {item.type === 'video' ? (
                        <div className="w-full h-full bg-[#171719] flex flex-col items-center justify-center text-white">
                          <Play className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                          <span className="text-[9px] font-bold mt-0.5">Vidéo</span>
                        </div>
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                      {item.type === 'video' && (
                        <span className="absolute top-1 right-1 px-1 bg-black/70 rounded text-[8px] text-white font-bold">
                          ▶
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Verified Pricing & Sourcing Stamp */}
              <div className="p-3.5 bg-[#F9F9FB] rounded-xl border border-gray-200 text-xs text-gray-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#171719]">
                  <ShieldCheck className="w-4 h-4 text-[#7B173B]" />
                  <span>{t.home.pricingBannerTitle}</span>
                </div>
                <p className="text-gray-500 leading-relaxed">
                  {t.productDetail.pricingNotice}
                </p>
              </div>
            </div>

            {/* Right: Product Details & Inquiries */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Title */}
                <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
                  {name}
                </h1>

                {/* Price Display */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-[#7B173B] tracking-tight">
                    {formatPrice(product.basePrice, product.baseCurrency)}
                  </span>
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    ({language === 'fr' ? 'Prix standard' : 'Standard Price'})
                  </span>
                </div>

                {/* Stock Status Badge */}
                <div className="flex items-center gap-2 text-sm">
                  {isAvailable && availableQty > 0 ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-semibold">{t.status.available}</span>
                      {settings.publicStockVisible && (
                        <span>
                          · {availableQty} {availableQty === 1 ? t.common.piece : t.common.pieces}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-semibold">{t.status.out_of_stock}</span>
                    </div>
                  )}
                </div>

                {/* Product Attributes Matrix */}
                <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-0.5">{t.productDetail.conditionLabel}</span>
                    <span className="font-medium text-gray-800">
                      {t.condition[product.condition] || product.condition}
                    </span>
                  </div>
                  {product.size && (
                    <div>
                      <span className="text-gray-400 block mb-0.5">{t.productDetail.size}</span>
                      <span className="font-medium text-gray-800">{product.size}</span>
                    </div>
                  )}
                  {product.color && (
                    <div>
                      <span className="text-gray-400 block mb-0.5">{t.productDetail.color}</span>
                      <span className="font-medium text-gray-800">{product.color}</span>
                    </div>
                  )}
                  {product.material && (
                    <div>
                      <span className="text-gray-400 block mb-0.5">{t.productDetail.material}</span>
                      <span className="font-medium text-gray-800">{product.material}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2">
                    {language === 'fr' ? 'Description détaillée' : 'Detailed Description'}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {description || (language === 'fr' ? 'Aucune description disponible.' : 'No description available.')}
                  </p>
                </div>

                {/* Regional Dispatch Notice */}
                <div className="flex items-start gap-2.5 p-3 bg-amber-50/60 rounded-lg border border-amber-200/60 text-xs text-amber-900">
                  <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">
                      {language === 'fr'
                        ? 'Expédition depuis Nairobi vers la RDC & le Burundi'
                        : 'Dispatches from Nairobi to DR Congo & Burundi'}
                    </span>
                    <span className="text-amber-800/90">
                      {language === 'fr'
                        ? 'Villes desservies : Bukavu, Goma, Bunia, Butembo, Beni, Durba, Lubumbashi, Kolwezi, Bujumbura. Tarifs confirmés sur WhatsApp.'
                        : 'Destination hubs: Bukavu, Goma, Bunia, Butembo, Beni, Durba, Lubumbashi, Kolwezi, Bujumbura. Rates confirmed on WhatsApp.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom WhatsApp Inquiry CTA */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleWhatsAppInquiry}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-[#7B173B] hover:bg-[#62122F] text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-98"
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                  <span>{t.common.askOnWhatsApp}</span>
                </button>

                <p className="text-[11px] text-center text-gray-500">
                  {language === 'fr'
                    ? 'Ouvre WhatsApp avec le message prérempli pour notre équipe de Nairobi.'
                    : 'Opens WhatsApp with prefilled message for our Nairobi showroom team.'}
                </p>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <h3 className="font-serif-brand text-lg font-bold text-[#171719] mb-4">
                {t.productDetail.relatedHeading}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectProduct?.(rel)}
                    className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-[#7B173B] cursor-pointer transition-colors"
                  >
                    <img
                      src={rel.images[0]}
                      alt=""
                      className="w-14 h-14 object-cover rounded-md bg-gray-100 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-gray-900 truncate">
                        {language === 'fr' ? rel.nameFr : rel.nameEn}
                      </div>
                      <div className="text-xs font-bold text-[#7B173B] mt-0.5">
                        {formatPrice(rel.basePrice, rel.baseCurrency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Zoom Modal */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomOpen(false)}
        >
          <img
            src={currentMedia.type === 'photo' ? currentMedia.url : (images[0] || '')}
            alt={name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};
