import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storage } from '../services/storage';
import { DabinLogo } from '../components/common/DabinLogo';

export const AdminLoginPage: React.FC = () => {
  const { language, t, navigateTo, setCurrentUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const authResult = storage.validateStaffLogin(email, password);

    if (authResult.success && authResult.user) {
      setCurrentUser(authResult.user);
      navigateTo('/admin');
    } else {
      setError(
        language === 'fr'
          ? 'Identifiants incorrects. Accès restreint au personnel DABIN autorisé.'
          : 'Invalid credentials. Access restricted to authorized DABIN Staff.'
      );
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F4F4F7]">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-xl">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <DabinLogo size="md" sloganLanguage={language} className="mx-auto" />
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#7B173B] uppercase tracking-wider bg-[#7B173B]/10 px-3 py-1 rounded-full">
              {language === 'fr' ? 'Accès Sécurisé' : 'Secure Staff Access'}
            </span>
            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719] pt-1">
              {language === 'fr' ? 'Personnel DABIN' : 'DABIN Staff'}
            </h2>
            <p className="text-xs text-gray-500">
              {language === 'fr'
                ? 'Portail réservé au personnel pour la gestion des stocks, du point de vente et du CRM.'
                : 'Authorized personnel portal for inventory, Point of Sale, and CRM operations.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              {t.admin.email}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'fr' ? 'votre-email@dabinfashion.com' : 'staff@dabinfashion.com'}
                autoComplete="email"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7B173B] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              {t.admin.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#7B173B] hover:bg-[#62122F] text-white font-semibold rounded-xl shadow-xs transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>{language === 'fr' ? 'Accéder à l’espace Personnel DABIN' : 'Sign In as DABIN Staff'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="text-xs text-gray-500 hover:text-gray-800 underline"
          >
            {language === 'fr' ? '← Retour au site public' : '← Return to Public Storefront'}
          </button>
        </div>
      </div>
    </div>
  );
};
