/**
 * Componente Showcase del Sistema Universal
 * Demuestra cómo funciona el sistema para diferentes industrias
 */

import React, { useState, useEffect } from 'react';
import { industryConfigs, generateDemoConfig } from '../config/industry-templates';
import { DemoConfig } from '../types/demo-config';

interface DemoExample {
  id: string;
  industry: string;
  businessName: string;
  productName: string;
  config: DemoConfig;
  isActive: boolean;
}

export const UniversalDemoShowcase: React.FC = () => {
  const [demoExamples, setDemoExamples] = useState<DemoExample[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<DemoExample | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generar ejemplos de demos al cargar el componente
  useEffect(() => {
    generateDemoExamples();
  }, []);

  const generateDemoExamples = () => {
    const examples: DemoExample[] = [
      {
        id: 'fitness-demo',
        industry: 'fitness',
        businessName: 'PowerMax Gym',
        productName: 'Proteína WheyMax Pro',
        config: null as any,
        isActive: false
      },
      {
        id: 'home-demo',
        industry: 'home',
        businessName: 'Design Elite',
        productName: 'Muebles Modernos Premium',
        config: null as any,
        isActive: false
      },
      {
        id: 'business-demo',
        industry: 'business',
        businessName: 'TechSolutions Pro',
        productName: 'CRM Empresarial Avanzado',
        config: null as any,
        isActive: false
      },
      {
        id: 'food-demo',
        industry: 'food',
        businessName: 'Gourmet Express',
        productName: 'Menú Degustación Premium',
        config: null as any,
        isActive: false
      },
      {
        id: 'education-demo',
        industry: 'education',
        businessName: 'Learn Academy Pro',
        productName: 'Máster en Marketing Digital',
        config: null as any,
        isActive: false
      }
    ];

    // Generar configuraciones para cada ejemplo
    const examplesWithConfigs = examples.map(example => {
      const config = generateDemoConfig(
        example.industry,
        example.businessName,
        example.productName,
        {
          price: Math.floor(Math.random() * 500) + 50, // Precio aleatorio entre 50-550
          customization: {
            colors: {
              primary: industryConfigs.find(i => i.id === example.industry)?.defaultColors.primary
            }
          }
        }
      );
      
      return {
        ...example,
        config: config as DemoConfig
      };
    });

    setDemoExamples(examplesWithConfigs);
    setSelectedDemo(examplesWithConfigs[0]); // Seleccionar el primero por defecto
  };

  const handleDemoSelect = (demo: DemoExample) => {
    setSelectedDemo(demo);
    // Simular activación de demo
    setDemoExamples(prev => 
      prev.map(d => ({ ...d, isActive: d.id === demo.id }))
    );
  };

  const generateNewDemo = async () => {
    setIsGenerating(true);
    
    // Simular generación de nueva demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const industries = ['pets', 'fitness', 'home', 'business', 'food', 'education'];
    const randomIndustry = industries[Math.floor(Math.random() * industries.length)];
    const businessNames = ['Innovate Pro', 'Elite Solutions', 'Premium Co', 'Advanced Systems', 'Expert Group'];
    const productNames = ['Producto Premium', 'Solución Avanzada', 'Sistema Pro', 'Servicio Elite', 'Programa Máster'];
    
    const randomBusiness = businessNames[Math.floor(Math.random() * businessNames.length)];
    const randomProduct = productNames[Math.floor(Math.random() * productNames.length)];
    
    const newConfig = generateDemoConfig(randomIndustry, randomBusiness, randomProduct, {
      price: Math.floor(Math.random() * 1000) + 100
    });
    
    const newDemo: DemoExample = {
      id: `demo-${Date.now()}`,
      industry: randomIndustry,
      businessName: randomBusiness,
      productName: randomProduct,
      config: newConfig as DemoConfig,
      isActive: true
    };
    
    setDemoExamples(prev => [newDemo, ...prev]);
    setSelectedDemo(newDemo);
    setIsGenerating(false);
  };

  return (
    <div className="universal-demo-showcase min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚀 Sistema Universal de Demos
              </h1>
              <p className="text-gray-600 mt-2">
                Una plataforma, infinitas posibilidades. Crea landing pages para cualquier industria.
              </p>
            </div>
            <button
              onClick={generateNewDemo}
              disabled={isGenerating}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Generando...
                </>
              ) : (
                '✨ Generar Demo Aleatoria'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Demos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Demos Disponibles
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Selecciona una demo para ver la preview
                </p>
              </div>
              <div className="p-4 space-y-3">
                {demoExamples.map((demo) => {
                  const industry = industryConfigs.find(i => i.id === demo.industry);
                  return (
                    <button
                      key={demo.id}
                      onClick={() => handleDemoSelect(demo)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedDemo?.id === demo.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{industry?.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {demo.businessName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {demo.productName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {industry?.name} • ${demo.config?.product.price}
                          </div>
                        </div>
                        {demo.isActive && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preview de Demo Seleccionada */}
          <div className="lg:col-span-2">
            {selectedDemo && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Preview: {selectedDemo.businessName}
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        {industryConfigs.find(i => i.id === selectedDemo.industry)?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: selectedDemo.config.brand.colors.primary }}>
                        ${selectedDemo.config.product.price}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedDemo.config.product.currency}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulación de Landing Page */}
                <div className="p-6">
                  {/* Hero Section */}
                  <div 
                    className="rounded-lg p-8 mb-6 text-white"
                    style={{ 
                      backgroundColor: selectedDemo.config.brand.colors.primary,
                      backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)'
                    }}
                  >
                    <h1 className="text-3xl font-bold mb-4">
                      {selectedDemo.config.content.hero.headline}
                    </h1>
                    <p className="text-xl mb-6 opacity-90">
                      {selectedDemo.config.content.hero.subheadline}
                    </p>
                    <p className="mb-6 opacity-80">
                      {selectedDemo.config.content.hero.description}
                    </p>
                    <button 
                      className="bg-white text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      {selectedDemo.config.content.hero.ctaPrimary}
                    </button>
                  </div>

                  {/* Problemas */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Problemas que resuelve:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedDemo.config.content.problems.map((problem, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl mb-2">{problem.icon}</div>
                          <h4 className="font-medium mb-2">{problem.title}</h4>
                          <p className="text-sm text-gray-600">{problem.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Beneficios */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Beneficios principales:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDemo.config.content.benefits.slice(0, 4).map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="text-xl">{benefit.icon}</div>
                          <div>
                            <h4 className="font-medium">{benefit.title}</h4>
                            <p className="text-sm text-gray-600">{benefit.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Características del producto */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Características:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDemo.config.product.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Paleta de colores */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Paleta de colores:</h3>
                    <div className="flex space-x-4">
                      {Object.entries(selectedDemo.config.brand.colors).map(([name, color]) => (
                        <div key={name} className="text-center">
                          <div 
                            className="w-12 h-12 rounded-lg border shadow-sm"
                            style={{ backgroundColor: color }}
                          ></div>
                          <div className="text-xs mt-1 capitalize">{name}</div>
                          <div className="text-xs text-gray-500">{color}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Métricas simuladas */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Métricas simuladas:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.floor(Math.random() * 1000) + 500}
                        </div>
                        <div className="text-sm text-gray-600">Visitantes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.floor(Math.random() * 50) + 20}
                        </div>
                        <div className="text-sm text-gray-600">Conversiones</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(Math.random() * 10 + 5).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Conversión</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.floor(Math.random() * 300) + 120}s
                        </div>
                        <div className="text-sm text-gray-600">Tiempo prom.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer con información */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">
              ✨ Sistema Universal de Demos - Características
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl mb-2">🎨</div>
                <h4 className="font-medium mb-2">Personalización Total</h4>
                <p className="text-sm text-gray-600">
                  Colores, textos, imágenes y estructura completamente personalizables
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">📊</div>
                <h4 className="font-medium mb-2">Analytics Completos</h4>
                <p className="text-sm text-gray-600">
                  Tracking de visitantes, conversiones y métricas en tiempo real
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-medium mb-2">Generación Rápida</h4>
                <p className="text-sm text-gray-600">
                  Crea demos profesionales en segundos, no en horas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalDemoShowcase; 