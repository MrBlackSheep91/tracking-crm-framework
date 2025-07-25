import * as React from 'react';
import ReactPixel from 'react-facebook-pixel';
import { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import GoogleAnalytics from './components/GoogleAnalytics';
import ConsentBanner from './components/ConsentBanner';

// Sistema Universal
import UniversalDemoPage from './pages/UniversalDemoPage';
import TrackingDebugger from './components/TrackingDebugger';

// Extender el tipo Window para incluir fbq (Meta Pixel)
declare global {
  interface Window {
    fbq?: Function;
  }
}

// Components
import Hero from './components/Hero';
import SocialProof from './components/SocialProof';
import Problems from './components/Problems';
import Solution from './components/SolutionComponent';
import Testimonials from './components/TestimonialsComponent';
import Research from './components/Research';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import LeadForm from './components/LeadForm';
import ThankYouPage from './components/ThankYouPage';

// Services
import { saveLeadToEmailMarketing, type LeadMetadata } from './services/leadService';
import { getUtmParams } from './utils/urlUtils';
import { startSession } from './services/sessionTracker';

// Main App Content Component (NAT-PETS Original)
const MainApp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
  const [isFreeGuideLoading, setIsFreeGuideLoading] = useState(false);
  
  const leadFormRef = useRef<HTMLDivElement>(null);
  const pageStartTime = useRef(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    if (window.sessionStorage.getItem('appMounted')) return;
    window.sessionStorage.setItem('appMounted', 'true');
    
    const initFacebookPixel = async () => {
      try {
        // Comprobamos si fbq ya existe (inicializado por el código en index.html)
        if (typeof window.fbq !== 'undefined') {
          console.log('Meta Pixel ya inicializado en HTML. Usando instancia existente.');
          const ReactPixel = (await import('react-facebook-pixel')).default;
          // Configurar ReactPixel para usar la instancia existente de fbq
          ReactPixel.init('3094329594078626', undefined, { 
            autoConfig: false,  // No autoconfigurar para evitar duplicados
            debug: false 
          });
        } else {
          // Inicialización habitual si no existe
          const ReactPixel = (await import('react-facebook-pixel')).default;
          ReactPixel.init('3094329594078626', undefined, { autoConfig: true, debug: false });
          ReactPixel.pageView();
          console.log('Meta Pixel inicializado desde React.');
        }
      } catch (e) {
        console.error('Error al inicializar Facebook Pixel', e);
      }
    };
    initFacebookPixel();
  }, []);

  const handlePurchaseFormSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor, completa tu nombre y email.');
      return;
    }
    setIsPurchaseLoading(true);

    // Configurar metadata para el seguimiento del lead
    const leadMetadata: LeadMetadata = {
      leadType: 'book_purchase',
      interestedInBook: true,
      productName: 'NAT-PETS CRM Premium Service'
    };

    // Primero guardamos el lead en el sistema de email marketing
    saveLeadToEmailMarketing({
      name,
      email,
      leadMetadata,
      userLocation: {},
      pageStartTime,
      getUtmParams
    }).then(() => {
      // Registrar el evento de inicio de compra en Facebook Pixel
      ReactPixel.track('InitiateCheckout', {
        content_name: 'E-book de recetas naturales para perros',
        content_category: 'product',
        content_ids: ['nat-pets-crm-premium'],
        value: 15.00,
        currency: 'USD',
      });

      // Obtener los parámetros UTM para tracking
      const utmParams = getUtmParams();
      
      // Construir la referencia personalizada para rastreo
      const customReference = `KimElon_${utmParams.utm_source || 'direct'}_${utmParams.utm_medium || 'none'}_${utmParams.utm_campaign || 'none'}_${utmParams.utm_content || 'none'}_${utmParams.utm_term || 'none'}_${localStorage.getItem('natpets_lead_id') || 'direct'}_${Date.now()}`;
      
      // URL de base para el enlace de pago de Stripe
      const stripeBaseUrl = 'https://buy.stripe.com/6oU3cuatBgo18XAeO70Fi00';
      
      // Construir parámetros URL
      const urlParams = new URLSearchParams();
      urlParams.append('prefilled_email', email);
      urlParams.append('client_reference_id', customReference);
      
      // Parámetros UTM para rastreo
      if (utmParams.utm_source) urlParams.append('utm_source', utmParams.utm_source);
      if (utmParams.utm_medium) urlParams.append('utm_medium', utmParams.utm_medium);
      if (utmParams.utm_campaign) urlParams.append('utm_campaign', utmParams.utm_campaign);
      if (utmParams.utm_content) urlParams.append('utm_content', utmParams.utm_content);
      if (utmParams.utm_term) urlParams.append('utm_term', utmParams.utm_term);
      
      // Construir la URL final
      const stripeUrl = `${stripeBaseUrl}?${urlParams.toString()}`;
      
      console.log('Redirigiendo a Stripe:', stripeUrl);
      window.location.href = stripeUrl;
    }).catch(error => {
      console.error('Error al guardar lead:', error);
      alert('Hubo un problema al procesar tu solicitud. Por favor intenta de nuevo.');
    }).finally(() => {
      setIsPurchaseLoading(false);
    });
  };

  const handleFreeGuideFormSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor, completa tu nombre y email.');
      return;
    }
    setIsFreeGuideLoading(true);
    
    const leadMetadata: LeadMetadata = {
      leadType: 'free_guide',
      interestedInBook: true,
      productName: 'Guía Gratuita de Transición Alimentaria'
    };

    saveLeadToEmailMarketing({
      name,
      email,
      leadMetadata,
      userLocation: {},
      pageStartTime,
      getUtmParams
    }).then(() => {
      navigate('/thank-you');
    }).catch((error: Error) => {
      console.error("Error tracking lead for free guide:", error);
    }).finally(() => {
      setIsFreeGuideLoading(false);
    });
  };

  return (
    <div className="bg-white text-gray-800 font-sans">
      <main>
        <Hero onCTAClick={() => leadFormRef.current?.scrollIntoView({ behavior: 'smooth' })} />
        <SocialProof />
        <Problems />
        <Solution />
        <Testimonials />
        <Research />
        <LeadForm 
          ref={leadFormRef}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          isPurchaseLoading={isPurchaseLoading}
          isFreeGuideLoading={isFreeGuideLoading}
          handlePurchaseFormSubmit={handlePurchaseFormSubmit}
          handleFreeGuideFormSubmit={handleFreeGuideFormSubmit}
        />
        <FAQ />
        <Footer />
      </main>
    </div>
  );
};

// Componente de selección de modo
const ModeSelector = () => {
  const [selectedMode, setSelectedMode] = useState<'original' | 'universal' | null>('original'); // Por defecto NAT-PETS

  // Verificar si hay un parámetro en la URL para seleccionar modo automáticamente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    // Log de información para el desarrollador
    console.log('🚀 NAT-PETS Platform - Modos disponibles:');
    console.log('  • https://nat-pets.com/ → NAT-PETS (por defecto)');
    console.log('  • https://nat-pets.com/?mode=universal → Sistema Universal');
    console.log('  • https://nat-pets.com/?mode=selector → Selector de modo');
    console.log('  • https://nat-pets.com/?debug=true → Activar panel de debug');
    
    if (mode === 'universal') {
      setSelectedMode('universal');
    } else if (mode === 'selector') {
      setSelectedMode(null); // Mostrar selector solo si se pide explícitamente
    } else {
      setSelectedMode('original'); // Por defecto siempre NAT-PETS
    }
  }, []);

  if (selectedMode === 'original') {
    return <MainApp />;
  }

  if (selectedMode === 'universal') {
    return <UniversalDemoPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🚀 NAT-PETS Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Elige cómo quieres experimentar la plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Modo Original */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer"
               onClick={() => setSelectedMode('original')}>
            <div className="text-center">
              <div className="text-6xl mb-6">🐕</div>
              <h2 className="text-2xl font-bold mb-4">Modo Original</h2>
              <p className="text-gray-600 mb-6">
                Experimenta NAT-PETS como fue diseñado originalmente: 
                una landing page específica para alimentación natural canina.
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <div>✅ Landing page completa de NAT-PETS</div>
                <div>✅ Sistema de tracking implementado</div>
                <div>✅ Integración con Meta Pixel y n8n</div>
                <div>✅ Formularios de captura de leads</div>
                <div>✅ Flujo de compra con Stripe</div>
              </div>
              <button className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors">
                Ver Demo Original
              </button>
            </div>
          </div>

          {/* Modo Universal */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer"
               onClick={() => setSelectedMode('universal')}>
            <div className="text-center">
              <div className="text-6xl mb-6">🌟</div>
              <h2 className="text-2xl font-bold mb-4">Sistema Universal</h2>
              <p className="text-gray-600 mb-6">
                Descubre el futuro: un sistema que puede generar landing pages 
                para cualquier industria y producto automáticamente.
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <div>🚀 Generador de demos para 6+ industrias</div>
                <div>🎨 Personalización completa de marca</div>
                <div>📊 Sistema de templates inteligente</div>
                <div>⚡ Creación instantánea de landing pages</div>
                <div>💡 Preview en tiempo real</div>
              </div>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Explorar Sistema Universal
              </button>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            💡 <strong>Tip:</strong> Puedes acceder directamente usando los parámetros de URL:
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm flex-wrap gap-2">
            <code className="bg-gray-100 px-3 py-1 rounded">/ (NAT-PETS por defecto)</code>
            <code className="bg-gray-100 px-3 py-1 rounded">?mode=universal</code>
            <code className="bg-gray-100 px-3 py-1 rounded">?debug=true</code>
          </div>
        </div>

        {/* Estadísticas del proyecto */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-center mb-6">📊 Estadísticas del Proyecto</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">97.1%</div>
              <div className="text-sm text-gray-600">Tests Pasando</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">6</div>
              <div className="text-sm text-gray-600">Industrias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-600">TypeScript</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">Ready</div>
              <div className="text-sm text-gray-600">Para Producción</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <>
      <GoogleAnalytics />
      <ConsentBanner />
      <TrackingDebugger />
      <Routes>
        <Route path="/" element={<ModeSelector />} />
        <Route path="/original" element={<MainApp />} />
        <Route path="/universal" element={<UniversalDemoPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
      </Routes>
    </>
  );
}

export default App;