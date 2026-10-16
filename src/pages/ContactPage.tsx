import React, { useState } from 'react';
import {
  Mail,
  MessageCircle,
  MapPin,
  Send,
  CheckCircle,
  Phone,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OFFICIAL_BUSINESS_INFO } from '../constants/initialData';
import { storage } from '../services/storage';

export const ContactPage: React.FC = () => {
  const { language, t, settings } = useApp();

  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [prefLang, setPrefLang] = useState<'fr' | 'en'>(language);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !contactInfo.trim() || !message.trim()) {
      setErrorMsg(
        language === 'fr'
          ? 'Veuillez remplir votre nom, vos coordonnées et votre message.'
          : 'Please complete your name, contact information, and message.'
      );
      return;
    }

    // Save as internal CRM inquiry activity in storage
    storage.logAudit(
      'CONTACT_FORM_SUBMISSION',
      `Message from ${fullName} (${contactInfo}): ${subject || 'Inquiry'}`
    );

    setIsSubmitted(true);
    setErrorMsg('');
  };

  const handleWhatsAppDirect = () => {
    const link = storage.getWhatsAppLink(t.whatsapp.generalGreeting);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#7B173B] bg-[#7B173B]/10 px-3 py-1 rounded-full">
          {t.nav.contact}
        </span>
        <h1 className="font-serif-brand text-3xl sm:text-5xl font-bold text-[#171719]">
          {t.contact.title}
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
          {t.contact.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Direct Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
            <h2 className="font-serif-brand text-xl font-bold text-[#171719] pb-3 border-b border-gray-100">
              {language === 'fr' ? 'Canaux de communication directs' : 'Direct Channels'}
            </h2>

            <div className="space-y-4 text-xs">
              {/* WhatsApp */}
              <div className="flex items-start gap-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-900 block">
                    {t.contact.directCallOrChat}
                  </span>
                  <a
                    href={storage.getWhatsAppLink(t.whatsapp.generalGreeting)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-semibold hover:underline block text-sm"
                  >
                    {settings.whatsappNumber || OFFICIAL_BUSINESS_INFO.whatsappFormatted}
                  </a>
                  <p className="text-gray-500 text-[11px]">
                    {language === 'fr'
                      ? 'Réponse rapide pour vérification des stocks et expéditions.'
                      : 'Fast response for sizing, availability and cargo arrangements.'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <Mail className="w-5 h-5 text-[#7B173B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-900 block">
                    {t.contact.officialEmail}
                  </span>
                  <a
                    href={`mailto:${settings.contactEmail || OFFICIAL_BUSINESS_INFO.email}`}
                    className="text-gray-800 font-semibold hover:underline block text-sm"
                  >
                    {settings.contactEmail || OFFICIAL_BUSINESS_INFO.email}
                  </a>
                  <p className="text-gray-500 text-[11px]">
                    {language === 'fr'
                      ? 'Pour commandes institutionnelles et correspondances administratives.'
                      : 'For formal inquiries, consignment proposals, and billing.'}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <MapPin className="w-5 h-5 text-gray-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-900 block">
                    {t.contact.hqLocation}
                  </span>
                  <span className="text-gray-800 font-medium block text-sm">
                    {settings.businessLocation || OFFICIAL_BUSINESS_INFO.location}
                  </span>
                  <p className="text-gray-500 text-[11px]">
                    {language === 'fr'
                      ? 'Showroom et centre d’expédition vers le Kenya, la RDC et le Burundi.'
                      : 'Showroom and dispatch hub serving Kenya, DR Congo, and Burundi.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWhatsAppDirect}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{language === 'fr' ? 'Ouvrir WhatsApp directement' : 'Open WhatsApp Directly'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 shadow-xs">
          {isSubmitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto" />
              <h2 className="font-serif-brand text-2xl font-bold text-gray-900">
                {language === 'fr' ? 'Message envoyé avec succès !' : 'Message Sent Successfully!'}
              </h2>
              <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                {t.contact.successMsg}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setFullName('');
                  setContactInfo('');
                  setSubject('');
                  setMessage('');
                }}
                className="px-5 py-2.5 bg-[#171719] text-white text-xs font-semibold rounded-xl"
              >
                {language === 'fr' ? 'Envoyer un autre message' : 'Send Another Message'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <h2 className="font-serif-brand text-2xl font-bold text-[#171719] mb-4">
                {t.contact.formTitle}
              </h2>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {t.contact.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex. Alain Habimana"
                    className="w-full p-3 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {t.contact.emailOrPhone} *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Ex. +243... or email@domain.com"
                    className="w-full p-3 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {t.contact.subject}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={
                      language === 'fr'
                        ? 'Ex. Renseignements expédition Bukavu'
                        : 'Ex. Shipping to Bukavu inquiry'
                    }
                    className="w-full p-3 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {t.contact.prefLanguage}
                  </label>
                  <select
                    value={prefLang}
                    onChange={(e) => setPrefLang(e.target.value as any)}
                    className="w-full p-3 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {t.contact.message} *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    language === 'fr'
                      ? 'Indiquez les articles qui vous intéressent ou vos questions logistiques...'
                      : 'Tell us about the pieces you are interested in or shipping questions...'
                  }
                  className="w-full p-3 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#7B173B] hover:bg-[#62122F] text-white font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{t.contact.submitBtn}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
