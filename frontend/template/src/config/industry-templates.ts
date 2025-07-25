/**
 * Templates predefinidos para diferentes industrias
 * Cada template incluye configuración completa para una demo funcional
 */

import { IndustryConfig, IndustryTemplate, BrandColors } from '../types/demo-config';

// Paletas de colores por industria
const colorPalettes: Record<string, BrandColors> = {
  pets: {
    primary: '#8B4513',
    secondary: '#DEB887',
    accent: '#FF6B35',
    background: '#FFF8DC',
    text: '#2C1810',
    textSecondary: '#5D4E37'
  },
  fitness: {
    primary: '#FF4500',
    secondary: '#FFD700',
    accent: '#32CD32',
    background: '#F5F5F5',
    text: '#1C1C1C',
    textSecondary: '#4A4A4A'
  },
  home: {
    primary: '#4682B4',
    secondary: '#87CEEB',
    accent: '#FFD700',
    background: '#F0F8FF',
    text: '#2F4F4F',
    textSecondary: '#708090'
  },
  business: {
    primary: '#2E86AB',
    secondary: '#A23B72',
    accent: '#F18F01',
    background: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666'
  },
  food: {
    primary: '#D2691E',
    secondary: '#F4A460',
    accent: '#FF6347',
    background: '#FFF8DC',
    text: '#8B4513',
    textSecondary: '#A0522D'
  },
  education: {
    primary: '#4169E1',
    secondary: '#87CEFA',
    accent: '#FFD700',
    background: '#F0F8FF',
    text: '#191970',
    textSecondary: '#4682B4'
  }
};

// Configuraciones de industria
export const industryConfigs: IndustryConfig[] = [
  {
    id: 'pets',
    name: 'Mascotas',
    icon: '🐕',
    description: 'Productos y servicios para mascotas',
    defaultColors: colorPalettes.pets,
    commonFeatures: [
      'Alimentación natural',
      'Cuidado veterinario',
      'Accesorios premium',
      'Entrenamiento',
      'Seguridad'
    ],
    sampleProducts: [
      {
        name: 'Alimento Natural Premium',
        category: 'Alimentación',
        price: 89.99,
        currency: 'USD'
      },
      {
        name: 'Kit de Entrenamiento',
        category: 'Accesorios',
        price: 149.99,
        currency: 'USD'
      }
    ],
    templateContent: {
      hero: {
        headline: 'Dale a tu mascota la alimentación que merece',
        subheadline: 'Productos naturales y premium para la salud de tu mejor amigo',
        description: 'Descubre nuestra línea de productos naturales diseñados específicamente para el bienestar de tu mascota.',
        ctaPrimary: 'Ver Productos',
        ctaSecondary: 'Más Información'
      },
      problems: [
        {
          title: 'Alimentos procesados',
          description: 'Los alimentos comerciales contienen químicos y conservantes dañinos',
          icon: '⚠️',
          severity: 'high'
        },
        {
          title: 'Problemas de salud',
          description: 'Alergias, obesidad y problemas digestivos por mala alimentación',
          icon: '🏥',
          severity: 'high'
        },
        {
          title: 'Falta de nutrientes',
          description: 'Los alimentos baratos no proporcionan la nutrición necesaria',
          icon: '📉',
          severity: 'medium'
        }
      ]
    }
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: '💪',
    description: 'Suplementos, equipos y programas de entrenamiento',
    defaultColors: colorPalettes.fitness,
    commonFeatures: [
      'Suplementos premium',
      'Programas personalizados',
      'Equipos profesionales',
      'Nutrición deportiva',
      'Resultados garantizados'
    ],
    sampleProducts: [
      {
        name: 'Proteína Whey Premium',
        category: 'Suplementos',
        price: 59.99,
        currency: 'USD'
      },
      {
        name: 'Programa de Entrenamiento 12 Semanas',
        category: 'Programas',
        price: 199.99,
        currency: 'USD'
      }
    ],
    templateContent: {
      hero: {
        headline: 'Transforma tu cuerpo en 90 días',
        subheadline: 'El sistema completo para lograr el físico que siempre quisiste',
        description: 'Combina suplementos premium con entrenamientos científicamente probados.',
        ctaPrimary: 'Empezar Ahora',
        ctaSecondary: 'Ver Resultados'
      },
      problems: [
        {
          title: 'Falta de resultados',
          description: 'Entrenar sin ver cambios reales en tu físico',
          icon: '😤',
          severity: 'high'
        },
        {
          title: 'Suplementos de baja calidad',
          description: 'Productos baratos que no aportan beneficios reales',
          icon: '💊',
          severity: 'medium'
        },
        {
          title: 'Rutinas ineficaces',
          description: 'Entrenamientos sin base científica que no optimizan el tiempo',
          icon: '⏰',
          severity: 'medium'
        }
      ]
    }
  },
  {
    id: 'home',
    name: 'Hogar',
    icon: '🏠',
    description: 'Decoración, muebles y mejoras para el hogar',
    defaultColors: colorPalettes.home,
    commonFeatures: [
      'Diseño moderno',
      'Calidad premium',
      'Instalación incluida',
      'Garantía extendida',
      'Personalización'
    ],
    sampleProducts: [
      {
        name: 'Set de Muebles Modernos',
        category: 'Muebles',
        price: 1299.99,
        currency: 'USD'
      },
      {
        name: 'Sistema de Iluminación Smart',
        category: 'Tecnología',
        price: 399.99,
        currency: 'USD'
      }
    ],
    templateContent: {
      hero: {
        headline: 'Convierte tu casa en el hogar de tus sueños',
        subheadline: 'Diseños exclusivos que reflejan tu personalidad',
        description: 'Descubre nuestra colección de muebles y accesorios premium para transformar cada espacio.',
        ctaPrimary: 'Ver Catálogo',
        ctaSecondary: 'Consulta Gratis'
      },
      problems: [
        {
          title: 'Espacios sin personalidad',
          description: 'Tu hogar no refleja tu estilo único y personal',
          icon: '🎨',
          severity: 'medium'
        },
        {
          title: 'Muebles de baja calidad',
          description: 'Productos baratos que se deterioran rápidamente',
          icon: '🪑',
          severity: 'high'
        },
        {
          title: 'Falta de funcionalidad',
          description: 'Espacios mal aprovechados y poco prácticos',
          icon: '📐',
          severity: 'medium'
        }
      ]
    }
  },
  {
    id: 'business',
    name: 'Negocios',
    icon: '💼',
    description: 'Software, consultoría y servicios empresariales',
    defaultColors: colorPalettes.business,
    commonFeatures: [
      'Automatización',
      'Escalabilidad',
      'ROI comprobado',
      'Soporte 24/7',
      'Integración fácil'
    ],
    sampleProducts: [
      {
        name: 'CRM Empresarial',
        category: 'Software',
        price: 299.99,
        currency: 'USD'
      },
      {
        name: 'Consultoría Digital',
        category: 'Servicios',
        price: 2999.99,
        currency: 'USD'
      }
    ],
    templateContent: {
      hero: {
        headline: 'Automatiza tu negocio y multiplica tus ventas',
        subheadline: 'La plataforma todo-en-uno para empresas que quieren crecer',
        description: 'Optimiza procesos, gestiona clientes y aumenta ingresos con nuestra solución integral.',
        ctaPrimary: 'Prueba Gratis',
        ctaSecondary: 'Ver Demo'
      },
      problems: [
        {
          title: 'Procesos manuales',
          description: 'Tiempo perdido en tareas repetitivas que podrían automatizarse',
          icon: '⚙️',
          severity: 'high'
        },
        {
          title: 'Pérdida de leads',
          description: 'Clientes potenciales que se escapan por falta de seguimiento',
          icon: '📉',
          severity: 'high'
        },
        {
          title: 'Datos dispersos',
          description: 'Información del negocio en múltiples sistemas sin integrar',
          icon: '🗂️',
          severity: 'medium'
        }
      ]
    }
  },
  {
    id: 'food',
    name: 'Alimentación',
    icon: '🍔',
    description: 'Restaurantes, delivery y productos gourmet',
    defaultColors: colorPalettes.food,
    commonFeatures: [
      'Ingredientes frescos',
      'Recetas tradicionales',
      'Delivery rápido',
      'Calidad garantizada',
      'Experiencia única'
    ],
    sampleProducts: [
      {
        name: 'Menú Gourmet Premium',
        category: 'Comida',
        price: 45.99,
        currency: 'USD'
      },
      {
        name: 'NAT-PETS CRM Training Course',
        category: 'Educación',
        price: 149.99,
        currency: 'USD'
      }
    ],
    templateContent: {
      hero: {
        headline: 'Sabores auténticos directo a tu mesa',
        subheadline: 'La experiencia gastronómica que estabas buscando',
        description: 'Descubre recetas tradicionales preparadas con ingredientes premium y técnicas artesanales.',
        ctaPrimary: 'Ordenar Ahora',
        ctaSecondary: 'Ver Menú'
      },
      problems: [
        {
          title: 'Comida sin sabor',
          description: 'Platos preparados en masa sin atención al detalle',
          icon: '😐',
          severity: 'medium'
        },
        {
          title: 'Ingredientes procesados',
          description: 'Uso de conservantes y químicos en lugar de ingredientes frescos',
          icon: '🧪',
          severity: 'high'
        },
        {
          title: 'Experiencia impersonal',
          description: 'Servicio estándar sin personalización ni atención especial',
          icon: '🤖',
          severity: 'medium'
        }
      ]
    }
  },
  {
    id: 'education',
    name: 'Educación',
    icon: '🎓',
    description: 'Cursos online, libros y programas de capacitación',
    defaultColors: colorPalettes.education,
    commonFeatures: [
      'Contenido actualizado',
      'Certificación oficial',
      'Soporte personalizado',
      'Acceso de por vida',
      'Comunidad activa'
    ],
    sampleProducts: [
      {
        name: 'Curso de Marketing Digital',
        category: 'Cursos',
        price: 297.99,
        currency: 'USD'
      },
      {
        name: 'Mentoría 1 a 1',
        category: 'Servicios',
        price: 997.99,
        currency: 'USD'
      }
    ],
    templateContent: {
      hero: {
        headline: 'Domina las habilidades del futuro',
        subheadline: 'Cursos prácticos que transforman tu carrera profesional',
        description: 'Aprende de expertos de la industria con contenido actualizado y casos reales.',
        ctaPrimary: 'Empezar Curso',
        ctaSecondary: 'Ver Temario'
      },
      problems: [
        {
          title: 'Conocimiento desactualizado',
          description: 'Cursos con información obsoleta que no sirve en el mercado actual',
          icon: '📚',
          severity: 'high'
        },
        {
          title: 'Falta de práctica',
          description: 'Teoría sin aplicación práctica en proyectos reales',
          icon: '🎯',
          severity: 'high'
        },
        {
          title: 'Sin seguimiento',
          description: 'Cursos sin soporte ni feedback personalizado del instructor',
          icon: '👥',
          severity: 'medium'
        }
      ]
    }
  }
];

// Templates completos por industria
export const industryTemplates: IndustryTemplate[] = industryConfigs.map(industry => ({
  industry,
  demoConfig: {
    brand: {
      colors: industry.defaultColors,
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    content: industry.templateContent,
    tracking: {
      businessId: `demo-${industry.id}-${Date.now()}`,
      n8nWebhookUrl: `http://localhost:5678/webhook/${industry.id}-demo`
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
      status: 'draft' as const,
      version: '1.0.0',
      tags: [industry.name.toLowerCase(), 'demo', 'template']
    }
  },
  variations: [
    {
      name: 'Clásico',
      description: 'Diseño tradicional y profesional',
      config: {
        brand: {
          colors: industry.defaultColors
        }
      }
    },
    {
      name: 'Moderno',
      description: 'Diseño minimalista y contemporáneo',
      config: {
        brand: {
          colors: {
            ...industry.defaultColors,
            primary: '#000000',
            secondary: '#FFFFFF',
            accent: industry.defaultColors.primary
          }
        }
      }
    },
    {
      name: 'Vibrante',
      description: 'Colores llamativos y energéticos',
      config: {
        brand: {
          colors: {
            ...industry.defaultColors,
            primary: '#FF6B35',
            secondary: '#F7931E',
            accent: '#FFD23F'
          }
        }
      }
    }
  ]
}));

// Función para obtener template por industria
export const getIndustryTemplate = (industryId: string): IndustryTemplate | undefined => {
  return industryTemplates.find(template => template.industry.id === industryId);
};

// Función para obtener configuración de industria
export const getIndustryConfig = (industryId: string): IndustryConfig | undefined => {
  return industryConfigs.find(config => config.id === industryId);
};

// Función para generar BusinessId único
export const generateBusinessId = (industryId: string, businessName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${industryId}-${slug}-${timestamp}-${random}`;
};

// Función para generar configuración completa de demo
export const generateDemoConfig = (
  industryId: string,
  businessName: string,
  productName: string,
  customization: any = {}
): Partial<any> => {
  const template = getIndustryTemplate(industryId);
  if (!template) {
    throw new Error(`Template not found for industry: ${industryId}`);
  }

  const businessId = generateBusinessId(industryId, businessName);
  const slug = `${industryId}-${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return {
    id: businessId,
    name: `${businessName} - Demo`,
    slug,
    industry: industryId,
    brand: {
      name: businessName,
      logo: customization.logo || '/logos/default-logo.png',
      favicon: customization.favicon || '/favicons/default-favicon.ico',
      ...template.demoConfig.brand
    },
    product: {
      name: productName,
      description: `${productName} - El mejor producto de ${template.industry.name.toLowerCase()}`,
      shortDescription: `${productName} premium`,
      price: customization.price || 99.99,
      currency: 'USD',
      category: template.industry.name,
      images: customization.images || ['/products/default-product.jpg'],
      features: template.industry.commonFeatures,
      benefits: template.industry.commonFeatures.map(feature => `Beneficio de ${feature}`),
      ...customization.product
    },
    content: {
      ...template.demoConfig.content,
      hero: {
        ...template.demoConfig.content?.hero,
        headline: customization.headline || template.demoConfig.content?.hero?.headline?.replace('tu mascota', businessName),
        ...customization.hero
      }
    },
    tracking: {
      businessId,
      n8nWebhookUrl: `http://localhost:5678/webhook/${industryId}-${slug}`,
      ...customization.tracking
    },
    ...template.demoConfig,
    ...customization
  };
}; 