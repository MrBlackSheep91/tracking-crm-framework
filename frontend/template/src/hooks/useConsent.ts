import { useState, useEffect } from 'react';

export type ConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
};

const CONSENT_STORAGE_KEY = 'user_consent_preferences';

export const useConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<ConsentPreferences>({
    necessary: true, // Siempre necesario
    analytics: false,
    marketing: false,
    personalization: false,
  });

  // Cargar preferencias guardadas al iniciar
  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (savedConsent) {
      setConsent(JSON.parse(savedConsent));
    } else {
      // Mostrar banner si no hay preferencias guardadas
      setShowBanner(true);
    }
    
    // Inicializar Google Consent Mode
    initializeConsentMode();
  }, []);

  // Update Consent Mode when preferences change
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      updateConsentMode(consent);
    }
  }, [consent]);

  const initializeConsentMode = () => {
    // Solo se ejecuta en el cliente
    if (typeof window === 'undefined') return;
    
    // Inicializar el modo consentimiento con valores predeterminados
    window.gtag('consent', 'default', {
      'ad_storage': 'denied',
      'analytics_storage': 'denied',
      'personalization_storage': 'denied',
      'functionality_storage': 'granted',
      'security_storage': 'granted',
      'wait_for_update': 500, // Esperar 500ms antes de aplicar actualizaciones
    });

    // Actualizar según las preferencias guardadas
    const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (savedConsent) {
      const parsedConsent = JSON.parse(savedConsent);
      updateConsentMode(parsedConsent);
    }
  };

  const updateConsentMode = (preferences: ConsentPreferences) => {
    // Only run in browser environment
    if (typeof window === 'undefined' || !window.gtag) return;

    try {
      // Update Google Consent Mode
      window.gtag('consent', 'update', {
        'ad_storage': preferences.marketing ? 'granted' : 'denied',
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'personalization_storage': preferences.personalization ? 'granted' : 'denied',
        'functionality_storage': 'granted',
        'security_storage': 'granted',
      });
    } catch (error) {
      console.error('Error updating consent mode:', error);
    }
  };

  const saveConsent = (preferences: Partial<ConsentPreferences>) => {
    const newConsent = { ...consent, ...preferences };
    setConsent(newConsent);
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newConsent));
    setShowBanner(false);
    
    // Actualizar Google Consent Mode
    updateConsentMode(newConsent);
    
    // Si se otorga el consentimiento para analytics, forzar un pageview
    if (preferences.analytics && window.gtag) {
      window.gtag('event', 'consent_update', {
        event_category: 'consent',
        event_label: 'analytics',
        value: preferences.analytics ? 'granted' : 'denied'
      });
    }
  };

  const acceptAll = () => {
    saveConsent({
      analytics: true,
      marketing: true,
      personalization: true,
    });
  };

  const rejectAll = () => {
    saveConsent({
      analytics: false,
      marketing: false,
      personalization: false,
    });
  };

  const showBannerAgain = () => {
    setShowBanner(true);
  };

  return {
    consent,
    showBanner,
    saveConsent,
    acceptAll,
    rejectAll,
    showBannerAgain,
  };
};
