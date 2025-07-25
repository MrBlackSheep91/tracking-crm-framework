import React, { useState, useEffect, useCallback } from 'react';
import { useConsent, ConsentPreferences } from '../hooks/useConsent';
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react';

interface ConsentBannerProps {
  onConsentUpdate?: (consent: ConsentPreferences) => void;
  privacyPolicyUrl?: string;
}

interface CookiePreference {
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({
  onConsentUpdate,
  privacyPolicyUrl = '/politica-privacidad'
}) => {
  const { consent, showBanner, saveConsent, acceptAll, rejectAll } = useConsent();
  
  const [showSettings, setShowSettings] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const [tempConsent, setTempConsent] = useState<CookiePreference>({
    analytics: consent.analytics,
    marketing: consent.marketing,
    personalization: consent.personalization,
  });

  // Handle banner visibility with smooth transitions
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (showBanner) {
      timer = setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showBanner]);

  // Notify parent component about consent changes
  useEffect(() => {
    if (onConsentUpdate) {
      onConsentUpdate(consent);
    }
  }, [consent, onConsentUpdate]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    const timeout = setTimeout(() => {
      saveConsent({
        analytics: false,
        marketing: false,
        personalization: false
      });
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [saveConsent]);

  const handleSavePreferences = useCallback(() => {
    saveConsent(tempConsent);
    setShowSettings(false);
    setIsClosing(true);
  }, [saveConsent, tempConsent]);

  const handleAcceptAll = useCallback(() => {
    acceptAll();
    setIsClosing(true);
  }, [acceptAll]);

  const handleRejectAll = useCallback(() => {
    rejectAll();
    setIsClosing(true);
  }, [rejectAll]);

  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const toggleSetting = useCallback((key: keyof CookiePreference) => {
    setTempConsent(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  if (!showBanner) return null;

  // Animation classes
  const bannerClasses = `fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl transform transition-transform duration-300 ease-in-out z-50 ${
    isVisible ? 'translate-y-0' : 'translate-y-full'
  } ${isClosing ? 'translate-y-full' : ''}`;

  return (
    <div className={bannerClasses}>
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-green-100">
              <Cookie className="h-5 w-5 text-green-600" aria-hidden="true" />
            </span>
            <p className="ml-3 text-sm font-medium text-gray-900">
              <span className="md:hidden">Usamos cookies para mejorar tu experiencia</span>
              <span className="hidden md:inline">Usamos cookies para ofrecerte la mejor experiencia en nuestro sitio</span>
            </p>
          </div>

          <div className="mt-2 flex-shrink-0 flex items-center space-x-3 sm:mt-0">
            <button
              onClick={handleAcceptAll}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              Aceptar todo
            </button>
            <button
              onClick={toggleSettings}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors flex items-center"
            >
              {showSettings ? (
                <>
                  <span>Menos opciones</span>
                  <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Más opciones</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Cerrar</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700">
                  Selecciona las cookies que deseas aceptar. Puedes cambiar estas preferencias en cualquier momento en la parte inferior de la página.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Para más información, consulta nuestra{' '}
                  <a 
                    href={privacyPolicyUrl} 
                    className="text-green-600 hover:text-green-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Política de Privacidad
                  </a>.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { 
                    key: 'analytics', 
                    label: 'Análisis', 
                    description: 'Nos ayudan a entender cómo interactúas con nuestro sitio y mejorar nuestros servicios.'
                  },
                  { 
                    key: 'marketing', 
                    label: 'Marketing', 
                    description: 'Para mostrarte publicidad personalizada basada en tus intereses.'
                  },
                  { 
                    key: 'personalization', 
                    label: 'Personalización', 
                    description: 'Para recordar tus preferencias y ofrecerte una experiencia más relevante.'
                  },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={key}
                        name={key}
                        type="checkbox"
                        checked={tempConsent[key as keyof typeof tempConsent]}
                        onChange={() => setTempConsent(prev => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof prev]
                        }))}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={key} className="font-medium text-gray-700">
                        {label}
                      </label>
                      <p className="text-gray-500">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentBanner;
