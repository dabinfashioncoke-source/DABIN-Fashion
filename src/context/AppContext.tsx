import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { translations } from '../i18n/translations';
import { storage } from '../services/storage';
import {
  Category,
  CurrencyCode,
  DeliveryDestination,
  Language,
  Product,
  User,
  WebsiteSettings,
} from '../types';

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
  products: Product[];
  publishedProducts: Product[];
  categories: Category[];
  destinations: DeliveryDestination[];
  refreshSettings: () => void;
  refreshData: () => Promise<void>;
  currentRoute: string;
  navigateTo: (route: string) => void;
  isLiveConnected: boolean;
  lastSyncTime: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(() => storage.getSettings());
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [categories, setCategories] = useState<Category[]>(() => storage.getCategories());
  const [destinations, setDestinations] = useState<DeliveryDestination[]>(() => storage.getDestinations());
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toISOString());

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

  // Calculate published products reactively (only published available/low_stock/out_of_stock products)
  const publishedProducts = useMemo(() => {
    return products.filter(
      (p) => p.status !== 'draft' && p.status !== 'hidden' && p.status !== 'archived'
    );
  }, [products]);

  // Synchronize React state from local storage and memory
  const reloadFromLocalStore = useCallback(() => {
    const freshSettings = storage.getSettings();
    const freshProducts = storage.getProducts();
    const freshCategories = storage.getCategories();
    const freshDestinations = storage.getDestinations();

    setSettings(freshSettings);
    setProducts(freshProducts);
    setCategories(freshCategories);
    setDestinations(freshDestinations);
    setLastSyncTime(new Date().toISOString());
  }, []);

  // Fetch latest snapshot from the server and update all states
  const refreshData = useCallback(async () => {
    await storage.syncFromServer();
    reloadFromLocalStore();
  }, [reloadFromLocalStore]);

  const refreshSettings = useCallback(() => {
    setSettings(storage.getSettings());
  }, []);

  // 1. Initial Load & Route Hash Listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      setCurrentRoute(hash);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);

    // Immediate initial sync from server on page visit
    refreshData();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [refreshData]);

  // 2. Real-Time Synchronization via Server-Sent Events (SSE) & Local Event Listeners
  useEffect(() => {
    // Listen for custom in-browser sync events (e.g., when Admin modifies an entity)
    const handleStoreSynced = () => {
      reloadFromLocalStore();
    };

    window.addEventListener('dabin_store_synced', handleStoreSynced);
    window.addEventListener('storage', handleStoreSynced);

    // Set up Server-Sent Events connection for instant multi-device / visitor sync
    let eventSource: EventSource | null = null;
    let fallbackInterval: any = null;

    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setIsLiveConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'database_updated') {
              // Remote server database updated by Admin; sync down immediately!
              storage.syncFromServer().then(() => {
                reloadFromLocalStore();
              });
            }
          } catch {
            // No-op for heartbeat/pings
          }
        };

        eventSource.onerror = () => {
          setIsLiveConnected(false);
          // EventSource will auto-retry reconnect
        };
      } catch (err) {
        console.warn('[DABIN Live Sync] EventSource initialization note:', err);
      }
    }

    // 3. Fallback active polling every 4 seconds to guarantee updates in any network environment
    fallbackInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const localLastUpdated = storage.getLastUpdated();
          if (data.lastUpdated && data.lastUpdated !== localLastUpdated) {
            await storage.syncFromServer();
            reloadFromLocalStore();
          }
        }
      } catch {
        // Silent catch for offline or non-blocking network drops
      }
    }, 4000);

    return () => {
      window.removeEventListener('dabin_store_synced', handleStoreSynced);
      window.removeEventListener('storage', handleStoreSynced);
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [reloadFromLocalStore]);

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
        products,
        publishedProducts,
        categories,
        destinations,
        refreshSettings,
        refreshData,
        currentRoute,
        navigateTo,
        isLiveConnected,
        lastSyncTime,
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
