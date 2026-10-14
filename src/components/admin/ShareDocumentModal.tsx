import React, { useState } from 'react';
import {
  Download,
  Share2,
  Printer,
  Copy,
  Check,
  X,
  Mail,
  Send,
  Loader2,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { downloadPdfFromElement, sharePdfFromElement } from '../../utils/pdfGenerator';

export interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetElementId: string;
  documentTitle: string;
  documentNumber: string;
  fileName: string;
  summaryText: string;
  recipientPhone?: string;
  recipientEmail?: string;
  language?: 'en' | 'fr';
  onSent?: (channel: string) => void;
}

export const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  targetElementId,
  documentTitle,
  documentNumber,
  fileName,
  summaryText,
  recipientPhone = '',
  recipientEmail = '',
  language = 'en',
  onSent,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingNative, setIsSharingNative] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // 1. Direct PDF Download
  const handleDownloadPdf = async () => {
    const elem = document.getElementById(targetElementId);
    if (!elem) {
      showFeedback(language === 'fr' ? 'Élément introuvable pour PDF' : 'Element not found for PDF');
      return;
    }

    try {
      setIsDownloading(true);
      await downloadPdfFromElement(elem, fileName, documentTitle);
      showFeedback(language === 'fr' ? '✓ PDF téléchargé avec succès !' : '✓ PDF downloaded successfully!');
      onSent?.('download');
    } catch (err) {
      console.error('Download PDF error:', err);
      showFeedback(language === 'fr' ? 'Échec du téléchargement PDF' : 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Native System Share (Web Share API)
  const handleNativeShare = async () => {
    const elem = document.getElementById(targetElementId);
    if (!elem) return;

    try {
      setIsSharingNative(true);
      const res = await sharePdfFromElement(
        elem,
        fileName,
        documentTitle,
        `${summaryText}\n\nDocument: ${fileName}`
      );
      if (res.success) {
        showFeedback(
          res.method === 'download-fallback'
            ? language === 'fr'
              ? '✓ PDF téléchargé (partage manuel)'
              : '✓ PDF downloaded for manual sharing'
            : language === 'fr'
            ? '✓ Partagé avec succès !'
            : '✓ Shared successfully!'
        );
        onSent?.('native-share');
      }
    } catch (err) {
      console.error('Native share error:', err);
    } finally {
      setIsSharingNative(false);
    }
  };

  // 3. WhatsApp Direct
  const handleWhatsApp = () => {
    const cleanedPhone = recipientPhone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(summaryText);
    const url = cleanedPhone
      ? `https://wa.me/${cleanedPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showFeedback(language === 'fr' ? '✓ WhatsApp ouvert !' : '✓ WhatsApp opened!');
    onSent?.('whatsapp');
  };

  // 4. Email Direct
  const handleEmail = () => {
    const encodedSubject = encodeURIComponent(documentTitle);
    const encodedBody = encodeURIComponent(summaryText);
    const mailto = recipientEmail
      ? `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`
      : `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
    window.location.href = mailto;
    showFeedback(language === 'fr' ? '✓ Application E-mail ouverte !' : '✓ Email client opened!');
    onSent?.('email');
  };

  // 5. Facebook Share
  const handleFacebook = () => {
    const quote = encodeURIComponent(`${documentTitle} — DABIN Fashion House Nairobi\n\n${summaryText}`);
    // Facebook sharer URL
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${quote}&u=${encodeURIComponent(
      window.location.origin
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
    showFeedback(language === 'fr' ? '✓ Facebook ouvert !' : '✓ Facebook opened!');
    onSent?.('facebook');
  };

  // 6. Instagram (Copies summary + auto-downloads PDF + prompts to open Instagram)
  const handleInstagram = async () => {
    // Copy summary to clipboard
    try {
      await navigator.clipboard.writeText(summaryText);
    } catch {
      // ignore
    }
    // Also trigger PDF download so they have the file ready to attach
    const elem = document.getElementById(targetElementId);
    if (elem) {
      try {
        await downloadPdfFromElement(elem, fileName, documentTitle);
      } catch {
        // ignore
      }
    }
    // Open Instagram Web/App
    window.open('https://www.instagram.com/direct/inbox/', '_blank', 'noopener,noreferrer');
    showFeedback(
      language === 'fr'
        ? '✓ PDF téléchargé & texte copié pour Instagram Direct !'
        : '✓ PDF downloaded & text copied for Instagram Direct!'
    );
    onSent?.('instagram');
  };

  // 7. TikTok (Copies summary + downloads PDF + opens TikTok)
  const handleTikTok = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
    } catch {
      // ignore
    }
    const elem = document.getElementById(targetElementId);
    if (elem) {
      try {
        await downloadPdfFromElement(elem, fileName, documentTitle);
      } catch {
        // ignore
      }
    }
    window.open('https://www.tiktok.com/messages', '_blank', 'noopener,noreferrer');
    showFeedback(
      language === 'fr'
        ? '✓ PDF téléchargé & texte copié pour TikTok Messages !'
        : '✓ PDF downloaded & text copied for TikTok Messages!'
    );
    onSent?.('tiktok');
  };

  // 8. Copy Summary
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setIsCopied(true);
      showFeedback(language === 'fr' ? '✓ Texte copié dans le presse-papier !' : '✓ Text copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
      onSent?.('copy');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 9. System Print
  const handlePrint = () => {
    window.print();
    onSent?.('print');
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-[#171719] text-white flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                {documentNumber}
              </span>
              <h3 className="font-serif-brand text-lg font-bold">
                {language === 'fr' ? 'Partager & Télécharger' : 'Share & Download'}
              </h3>
            </div>
            <p className="text-xs text-gray-300 truncate max-w-sm">{documentTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-pulse">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Primary Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {/* 1. Direct PDF Download */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-[#7B173B] to-[#590f2b] text-white font-semibold text-xs transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <Download className="w-6 h-6 text-white" />
              )}
              <span className="font-bold text-sm">
                {language === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
              </span>
              <span className="text-[10px] text-white/80 font-normal">
                {language === 'fr' ? 'Fichier .PDF haute qualité' : 'High-res .PDF on device'}
              </span>
            </button>

            {/* 2. Device Print (Window.print) */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#F4F4F7] hover:bg-gray-200 text-[#171719] font-semibold text-xs transition-all hover:scale-[1.02] cursor-pointer border border-gray-200"
            >
              <Printer className="w-6 h-6 text-[#7B173B]" />
              <span className="font-bold text-sm">
                {language === 'fr' ? 'Imprimer (Appareil)' : 'Print (Device)'}
              </span>
              <span className="text-[10px] text-gray-500 font-normal">
                {language === 'fr' ? 'Options imprimante du système' : 'System printer dialog'}
              </span>
            </button>
          </div>

          {/* Social Platforms & Direct Channels */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {language === 'fr' ? 'Partager sur les plateformes' : 'Share to Platforms & Apps'}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold transition-colors cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold">WhatsApp</div>
                  <div className="text-[10px] text-emerald-700 truncate">
                    {recipientPhone ? recipientPhone : language === 'fr' ? 'Numéro ou statut' : 'Direct or Status'}
                  </div>
                </div>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleInstagram}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-900 text-xs font-semibold transition-colors cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold">Instagram</div>
                  <div className="text-[10px] text-pink-700 truncate">
                    {language === 'fr' ? 'Direct / Story' : 'Direct / Story'}
                  </div>
                </div>
              </button>

              {/* TikTok */}
              <button
                type="button"
                onClick={handleTikTok}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 text-xs font-semibold transition-colors cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="font-black text-xs">TT</span>
                </div>
                <div className="min-w-0">
                  <div className="font-bold">TikTok</div>
                  <div className="text-[10px] text-gray-600 truncate">
                    {language === 'fr' ? 'Messages / Chat' : 'Messages / Chat'}
                  </div>
                </div>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-semibold transition-colors cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="font-black text-xs">f</span>
                </div>
                <div className="min-w-0">
                  <div className="font-bold">Facebook</div>
                  <div className="text-[10px] text-blue-700 truncate">
                    {language === 'fr' ? 'Partager / Publier' : 'Share / Post'}
                  </div>
                </div>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={handleEmail}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-semibold transition-colors cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold">E-mail</div>
                  <div className="text-[10px] text-indigo-700 truncate">
                    {recipientEmail || (language === 'fr' ? 'Envoyer au client' : 'Send to client')}
                  </div>
                </div>
              </button>

              {/* Native OS Share Sheet */}
              <button
                type="button"
                disabled={isSharingNative}
                onClick={handleNativeShare}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors cursor-pointer text-left disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isSharingNative ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold">{language === 'fr' ? 'Toutes les Apps' : 'More Apps'}</div>
                  <div className="text-[10px] text-amber-700 truncate">
                    {language === 'fr' ? 'Menu de l’appareil' : 'Device Share Sheet'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Copy Summary */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-gray-700 block">
                {language === 'fr' ? 'Texte récapitulatif formaté' : 'Formatted Summary Text'}
              </span>
              <span className="text-[10px] text-gray-500 block truncate">
                {summaryText.substring(0, 70)}...
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 transition-colors cursor-pointer shrink-0"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{language === 'fr' ? 'Copié' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Copier' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>DABIN Fashion House • Nairobi, Kenya</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors cursor-pointer"
          >
            {language === 'fr' ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
