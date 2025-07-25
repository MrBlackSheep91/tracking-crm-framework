/**
 * Configuración Universal para Demos
 * Sistema que permite crear landing pages para cualquier industria/producto
 */

// Colores de la marca
export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textSecondary: string;
}

// Información de la marca
export interface BrandInfo {
  name: string;
  logo: string;
  favicon: string;
  colors: BrandColors;
  fonts: {
    heading: string;
    body: string;
  };
}

// Información del producto/servicio
export interface ProductInfo {
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: string;
  images: string[];
  features: string[];
  benefits: string[];
}

// Contenido del Hero
export interface HeroContent {
  headline: string;
  subheadline: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary?: string;
  backgroundImage?: string;
  heroImage?: string;
}

// Beneficio individual
export interface Benefit {
  title: string;
  description: string;
  icon: string;
  image?: string;
}

// Testimonio
export interface Testimonial {
  name: string;
  text: string;
  avatar: string;
  rating: number;
  position?: string;
  company?: string;
  verified?: boolean;
}

// FAQ
export interface FAQ {
  question: string;
  answer: string;
  category?: string;
}

// Problema que resuelve el producto
export interface Problem {
  title: string;
  description: string;
  icon: string;
  severity: 'low' | 'medium' | 'high';
}

// Contenido de la landing page
export interface LandingContent {
  hero: HeroContent;
  problems: Problem[];
  benefits: Benefit[];
  testimonials: Testimonial[];
  faqs: FAQ[];
  socialProof: {
    customerCount?: number;
    rating?: number;
    reviewCount?: number;
    trustedBy?: string[];
  };
  urgency?: {
    enabled: boolean;
    message: string;
    countdown?: Date;
  };
}

// Configuración de tracking
export interface TrackingConfig {
  businessId: string;
  metaPixelId?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  n8nWebhookUrl: string;
  hotjarId?: string;
  intercomId?: string;
}

// Configuración de formularios
export interface FormConfig {
  leadCapture: {
    title: string;
    subtitle: string;
    fields: Array<{
      name: string;
      label: string;
      type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
      required: boolean;
      placeholder?: string;
      options?: string[]; // Para selects
    }>;
    submitText: string;
    successMessage: string;
    redirectUrl?: string;
  };
  newsletter?: {
    title: string;
    subtitle: string;
    placeholder: string;
    submitText: string;
  };
}

// Configuración SEO
export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  twitterCard: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  noindex?: boolean;
}

// Configuración de la industria
export interface IndustryConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultColors: BrandColors;
  commonFeatures: string[];
  sampleProducts: Partial<ProductInfo>[];
  templateContent: Partial<LandingContent>;
}

// Configuración completa de la demo
export interface DemoConfig {
  // Identificación
  id: string;
  name: string;
  slug: string;
  industry: string;
  
  // Información de marca y producto
  brand: BrandInfo;
  product: ProductInfo;
  
  // Contenido de la landing
  content: LandingContent;
  
  // Configuraciones técnicas
  tracking: TrackingConfig;
  forms: FormConfig;
  seo: SEOConfig;
  
  // Configuración de comportamiento
  settings: {
    enableChat: boolean;
    enablePopups: boolean;
    enableExitIntent: boolean;
    enableScrollTracking: boolean;
    enableHeatmaps: boolean;
    language: string;
    timezone: string;
    currency: string;
  };
  
  // Metadatos
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    status: 'draft' | 'active' | 'paused' | 'archived';
    version: string;
    tags: string[];
  };
}

// Templates predefinidos por industria
export interface IndustryTemplate {
  industry: IndustryConfig;
  demoConfig: Partial<DemoConfig>;
  variations: Array<{
    name: string;
    description: string;
    config: Partial<DemoConfig>;
  }>;
}

// Métricas de la demo
export interface DemoMetrics {
  demoId: string;
  visitors: number;
  leads: number;
  conversions: number;
  conversionRate: number;
  averageTimeOnPage: number;
  bounceRate: number;
  topSources: Array<{
    source: string;
    visitors: number;
    conversions: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  geographicData: Array<{
    country: string;
    visitors: number;
    conversions: number;
  }>;
  timeframe: {
    start: Date;
    end: Date;
  };
}

// Respuesta de la API para crear demo
export interface CreateDemoResponse {
  success: boolean;
  demo?: DemoConfig;
  url?: string;
  error?: string;
}

// Request para crear demo
export interface CreateDemoRequest {
  industry: string;
  businessName: string;
  productName: string;
  customization?: Partial<DemoConfig>;
  template?: string;
}

// Configuración del generador de demos
export interface DemoGeneratorConfig {
  industries: IndustryConfig[];
  templates: IndustryTemplate[];
  defaultSettings: Partial<DemoConfig>;
  apiEndpoints: {
    create: string;
    update: string;
    delete: string;
    metrics: string;
  };
}

// Utilidades de tipo
export type IndustryId = 'pets' | 'fitness' | 'home' | 'business' | 'food' | 'education' | 'health' | 'beauty' | 'automotive' | 'real-estate';

export type DemoStatus = DemoConfig['metadata']['status'];

export type TrackingEvent = {
  type: 'page_view' | 'button_click' | 'form_submit' | 'scroll' | 'time_on_page';
  data: Record<string, any>;
  timestamp: Date;
  demoId: string;
  visitorId: string;
  sessionId: string;
};

// Hooks y utilidades para React
export interface UseDemoConfigReturn {
  config: DemoConfig | null;
  loading: boolean;
  error: string | null;
  updateConfig: (updates: Partial<DemoConfig>) => Promise<void>;
  reloadConfig: () => Promise<void>;
}

export interface DemoContextValue {
  config: DemoConfig;
  updateConfig: (updates: Partial<DemoConfig>) => void;
  isPreview: boolean;
  metrics?: DemoMetrics;
} 