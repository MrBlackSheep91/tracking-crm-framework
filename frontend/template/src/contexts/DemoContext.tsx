/**
 * Context Provider para configuración de demos
 * Permite que toda la aplicación acceda a la configuración actual
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DemoConfig, DemoContextValue, UseDemoConfigReturn } from '../types/demo-config';
import { generateDemoConfig, getIndustryTemplate } from '../config/industry-templates';

// Context de configuración de demo
const DemoContext = createContext<DemoContextValue | undefined>(undefined);

// Props del provider
interface DemoProviderProps {
  children: ReactNode;
  initialConfig?: DemoConfig;
  isPreview?: boolean;
}

// Hook para usar el contexto de demo
export const useDemoContext = (): DemoContextValue => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext debe ser usado dentro de un DemoProvider');
  }
  return context;
};

// Hook para cargar configuración de demo
export const useDemoConfig = (demoId?: string): UseDemoConfigReturn => {
  const [config, setConfig] = useState<DemoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async (id?: string) => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Intentar cargar desde localStorage primero
      const savedConfig = localStorage.getItem(`demo-config-${id}`);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } else {
        // Si no existe en localStorage, usar configuración por defecto
        const defaultConfig = generateDefaultConfig();
        setConfig(defaultConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<DemoConfig>) => {
    if (!config) return;

    try {
      const updatedConfig = {
        ...config,
        ...updates,
        metadata: {
          ...config.metadata,
          ...updates.metadata,
          updatedAt: new Date()
        }
      };

      setConfig(updatedConfig);
      
      // Guardar en localStorage
      localStorage.setItem(`demo-config-${config.id}`, JSON.stringify(updatedConfig));
      
      // Aquí podrías agregar llamada a API para persistir en servidor
      // await api.updateDemo(config.id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar configuración');
    }
  };

  const reloadConfig = async () => {
    await loadConfig(demoId);
  };

  useEffect(() => {
    loadConfig(demoId);
  }, [demoId]);

  return {
    config,
    loading,
    error,
    updateConfig,
    reloadConfig
  };
};

// Función para generar configuración por defecto
const generateDefaultConfig = (): DemoConfig => {
  const template = getIndustryTemplate('pets');
  if (!template) {
    throw new Error('Template de mascotas no encontrado');
  }

  return {
    id: `demo-${Date.now()}`,
    name: 'Demo NAT-PETS',
    slug: 'nat-pets-demo',
    industry: 'pets',
    brand: {
      name: 'NAT-PETS',
      logo: '/logos/nat-pets-logo.png',
      favicon: '/favicon.ico',
      colors: template.industry.defaultColors,
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    product: {
      name: 'Recetario de Alimentación Natural',
      description: 'Guía completa con más de 50 recetas naturales para la alimentación de tu perro',
      shortDescription: 'Recetario premium para alimentación natural canina',
      price: 89.99,
      originalPrice: 149.99,
      currency: 'USD',
      category: 'Alimentación',
      images: [
        '/products/recetario-cover.jpg',
        '/products/recetario-preview-1.jpg',
        '/products/recetario-preview-2.jpg'
      ],
      features: [
        'Más de 50 recetas naturales',
        'Ingredientes fáciles de conseguir',
        'Guía nutricional completa',
        'Recetas por edad y tamaño',
        'Tips de preparación profesional'
      ],
      benefits: [
        'Mejor salud digestiva',
        'Pelo más brillante',
        'Mayor energía y vitalidad',
        'Ahorro en gastos veterinarios',
        'Fortalecimiento del sistema inmune'
      ]
    },
    content: {
      hero: {
        headline: 'Transforma la salud de tu perro con alimentación 100% natural',
        subheadline: 'Descubre las recetas que veterinarios recomiendan para una vida más larga y saludable',
        description: 'Más de 50 recetas naturales probadas por expertos, diseñadas para mejorar la salud, energía y felicidad de tu mejor amigo.',
        ctaPrimary: 'Obtener Recetario',
        ctaSecondary: 'Ver Muestra Gratis',
        backgroundImage: '/hero/hero-bg.jpg',
        heroImage: '/hero/happy-dog.jpg'
      },
      problems: [
        {
          title: 'Alimentos procesados dañinos',
          description: 'Los alimentos comerciales contienen químicos, conservantes y subproductos que afectan la salud a largo plazo',
          icon: '⚠️',
          severity: 'high'
        },
        {
          title: 'Problemas digestivos constantes',
          description: 'Diarrea, vómitos y malestar estomacal por alimentos de baja calidad',
          icon: '🤢',
          severity: 'high'
        },
        {
          title: 'Gastos veterinarios elevados',
          description: 'Consultas frecuentes por problemas de salud relacionados con la alimentación',
          icon: '💰',
          severity: 'medium'
        }
      ],
      benefits: [
        {
          title: 'Digestión perfecta',
          description: 'Ingredientes naturales que respetan el sistema digestivo canino',
          icon: '✨',
          image: '/benefits/digestion.jpg'
        },
        {
          title: 'Pelo brillante y saludable',
          description: 'Nutrientes esenciales para un pelaje radiante y fuerte',
          icon: '🌟',
          image: '/benefits/shiny-coat.jpg'
        },
        {
          title: 'Más energía y vitalidad',
          description: 'Alimentación que potencia la energía natural de tu perro',
          icon: '⚡',
          image: '/benefits/energy.jpg'
        },
        {
          title: 'Sistema inmune fortalecido',
          description: 'Ingredientes que refuerzan las defensas naturales',
          icon: '🛡️',
          image: '/benefits/immune.jpg'
        }
      ],
      testimonials: [
        {
          name: 'María González',
          text: 'En solo 3 semanas, Max dejó de tener problemas digestivos. Su pelo está más brillante que nunca y tiene muchísima más energía.',
          avatar: '/testimonials/maria.jpg',
          rating: 5,
          position: 'Dueña de Max',
          verified: true
        },
        {
          name: 'Carlos Rodríguez',
          text: 'Mi veterinario no puede creer el cambio en Luna. Las recetas son fáciles de preparar y los resultados son increíbles.',
          avatar: '/testimonials/carlos.jpg',
          rating: 5,
          position: 'Dueño de Luna',
          verified: true
        },
        {
          name: 'Ana Martínez',
          text: 'Pensé que era muy difícil preparar comida natural, pero las recetas son súper sencillas. Rocky está más saludable que nunca.',
          avatar: '/testimonials/ana.jpg',
          rating: 5,
          position: 'Dueña de Rocky',
          verified: true
        }
      ],
      faqs: [
        {
          question: '¿Es difícil preparar las recetas?',
          answer: 'Para nada. Todas las recetas están diseñadas para ser simples y rápidas. La mayoría se prepara en menos de 15 minutos.',
          category: 'Preparación'
        },
        {
          question: '¿Los ingredientes son fáciles de conseguir?',
          answer: 'Sí, todos los ingredientes se encuentran en cualquier supermercado o carnicería. No necesitas productos especiales.',
          category: 'Ingredientes'
        },
        {
          question: '¿Sirve para perros de todas las edades?',
          answer: 'El recetario incluye secciones específicas para cachorros, adultos y perros senior, adaptadas a cada etapa de vida.',
          category: 'Edades'
        },
        {
          question: '¿Cuánto tiempo tarda en verse resultados?',
          answer: 'La mayoría de los dueños reportan mejoras en la digestión en 1-2 semanas, y cambios visibles en el pelaje en 3-4 semanas.',
          category: 'Resultados'
        }
      ],
      socialProof: {
        customerCount: 15000,
        rating: 4.9,
        reviewCount: 2847,
        trustedBy: ['Veterinarios', 'Criadores profesionales', 'Escuelas de adiestramiento']
      },
      urgency: {
        enabled: true,
        message: 'Oferta especial: 40% de descuento por tiempo limitado',
        countdown: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    },
    tracking: {
      businessId: 'nat-pets-demo',
      n8nWebhookUrl: 'http://localhost:5678/webhook/nat-pets-demo',
      metaPixelId: process.env.REACT_APP_META_PIXEL_ID,
      googleAnalyticsId: process.env.REACT_APP_GA_ID
    },
    forms: {
      leadCapture: {
        title: 'Obtén tu Recetario Ahora',
        subtitle: 'Únete a más de 15,000 dueños que ya transformaron la salud de sus perros',
        fields: [
          {
            name: 'firstName',
            label: 'Nombre',
            type: 'text',
            required: true,
            placeholder: 'Tu nombre'
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            placeholder: 'tu@email.com'
          },
          {
            name: 'dogName',
            label: 'Nombre de tu perro',
            type: 'text',
            required: false,
            placeholder: 'Nombre de tu perro'
          },
          {
            name: 'dogSize',
            label: 'Tamaño de tu perro',
            type: 'select',
            required: false,
            options: ['Pequeño (hasta 10kg)', 'Mediano (10-25kg)', 'Grande (25-40kg)', 'Gigante (más de 40kg)']
          }
        ],
        submitText: 'Obtener Recetario',
        successMessage: '¡Gracias! Te enviamos el recetario a tu email en los próximos minutos.',
        redirectUrl: '/gracias'
      }
    },
    seo: {
      title: 'NAT-PETS: Recetario de Alimentación Natural para Perros',
      description: 'Transforma la salud de tu perro con más de 50 recetas naturales. Mejora su digestión, pelo y energía con alimentación 100% natural.',
      keywords: ['alimentación natural perros', 'recetas caseras perros', 'comida natural canina', 'salud perros', 'nutrición canina'],
      ogImage: '/og/nat-pets-og.jpg',
      twitterCard: 'summary_large_image'
    },
    settings: {
      enableChat: true,
      enablePopups: true,
      enableExitIntent: true,
      enableScrollTracking: true,
      enableHeatmaps: false,
      language: 'es',
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'USD'
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      version: '1.0.0',
      tags: ['pets', 'natural-food', 'health', 'demo']
    }
  };
};

// Provider del contexto
export const DemoProvider: React.FC<DemoProviderProps> = ({ 
  children, 
  initialConfig,
  isPreview = false 
}) => {
  const [config, setConfig] = useState<DemoConfig>(() => {
    return initialConfig || generateDefaultConfig();
  });

  const updateConfig = (updates: Partial<DemoConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates,
      metadata: {
        ...prev.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    }));
  };

  const contextValue: DemoContextValue = {
    config,
    updateConfig,
    isPreview
  };

  return (
    <DemoContext.Provider value={contextValue}>
      {children}
    </DemoContext.Provider>
  );
};

// Hook para obtener configuración específica
export const useBrandColors = () => {
  const { config } = useDemoContext();
  return config.brand.colors;
};

export const useProductInfo = () => {
  const { config } = useDemoContext();
  return config.product;
};

export const useHeroContent = () => {
  const { config } = useDemoContext();
  return config.content.hero;
};

export const useBenefits = () => {
  const { config } = useDemoContext();
  return config.content.benefits;
};

export const useTestimonials = () => {
  const { config } = useDemoContext();
  return config.content.testimonials;
};

export const useTrackingConfig = () => {
  const { config } = useDemoContext();
  return config.tracking;
};

export const useFormConfig = () => {
  const { config } = useDemoContext();
  return config.forms;
};

export const useSEOConfig = () => {
  const { config } = useDemoContext();
  return config.seo;
};

// Función para crear nueva demo
export const createDemo = async (
  industry: string,
  businessName: string,
  productName: string,
  customization: any = {}
): Promise<DemoConfig> => {
  const config = generateDemoConfig(industry, businessName, productName, customization);
  
  // Guardar en localStorage
  localStorage.setItem(`demo-config-${config.id}`, JSON.stringify(config));
  
  // Aquí podrías agregar llamada a API
  // await api.createDemo(config);
  
  return config as DemoConfig;
}; 