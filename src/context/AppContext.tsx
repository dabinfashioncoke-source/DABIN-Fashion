import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';
import { storage } from '../services/storage';
import { CurrencyCode, Language, User, WebsiteSettings } from '../types';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: CurrencyCode;
  setCurrency: (curr: CurrencyCode) => void;
  t: typeof translations.en;
  formatPrice: (amount: number, fromCurrency?: CurrencyCode) => string;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  settings: WebsiteSettings;
  refreshSettings: () => void;
  currentRoute: string;
  navigateTo: (route: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(() => storage.getSettings());
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('dabin_fashion_lang_v1');
    return (saved as Language) || settings.defaultLanguage || 'fr';
  });
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('dabin_fashion_currency_v1');
    return (saved as CurrencyCode) || settings.defaultCurrency || 'KES';
  });
  const [currentUser, setCurrentUserState] = useState<User | null>(() => storage.getCurrentUser());
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.hash.replace('#', '') || '/';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      setCurrentRoute(hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('dabin_fashion_lang_v1', lang);
  };

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
    localStorage.setItem('dabin_fashion_currency_v1', curr);
  };

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    storage.setCurrentUser(user);
  };

  const refreshSettings = () => {
    setSettings(storage.getSettings());
  };

  const formatPrice = (amount: number, fromCurrency: CurrencyCode = 'KES'): string => {
    const converted = storage.convertPrice(amount, fromCurrency, currency);
    return storage.formatPrice(converted, currency);
  };

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        t,
        formatPrice,
        currentUser,
        setCurrentUser,
        settings,
        refreshSettings,
        currentRoute,
        navigateTo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
