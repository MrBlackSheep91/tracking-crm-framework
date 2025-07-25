/**
 * Página Principal del Sistema Universal de Demos
 * Integra el selector, showcase y configuración
 */

import React, { useState } from 'react';
import { DemoProvider } from '../contexts/DemoContext';
import { DemoConfig } from '../types/demo-config';
import DemoSelector from '../components/DemoSelector';
import UniversalDemoShowcase from '../components/UniversalDemoShowcase';

type ViewMode = 'home' | 'create' | 'showcase' | 'demo';

interface UniversalDemoPageProps {
  initialMode?: ViewMode;
}

export const UniversalDemoPage: React.FC<UniversalDemoPageProps> = ({ 
  initialMode = 'home' 
}) => {
  const [currentView, setCurrentView] = useState<ViewMode>(initialMode);
  const [currentDemo, setCurrentDemo] = useState<DemoConfig | null>(null);

  const handleDemoCreated = (config: DemoConfig) => {
    setCurrentDemo(config);
    setCurrentView('demo');
  };

  const renderNavigation = () => (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center space-x-2 text-xl font-bold text-gray-900"
            >
              <span>🚀</span>
              <span>Universal Demos</span>
            </button>
            
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => setCurrentView('create')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'create'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Crear Demo
              </button>
              <button
                onClick={() => setCurrentView('showcase')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'showcase'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Showcase
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentDemo && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <span>Demo activa:</span>
                <span className="font-medium">{currentDemo.brand.name}</span>
              </div>
            )}
            <button
              onClick={() => setCurrentView('create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Nueva Demo
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderHomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🚀 Sistema Universal de Demos
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            La plataforma todo-en-uno para crear landing pages profesionales 
            para cualquier industria en segundos. Sin código, sin complicaciones.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setCurrentView('create')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Crear Mi Primera Demo
            </button>
            <button
              onClick={() => setCurrentView('showcase')}
              className="bg-white text-gray-700 px-8 py-4 rounded-lg text-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Ver Ejemplos
            </button>
          </div>
        </div>

        {/* Características */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-4">Generación Instantánea</h3>
            <p className="text-gray-600">
              Crea landing pages profesionales en segundos. Solo ingresa tu información 
              y el sistema genera todo automáticamente.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-4">Personalización Total</h3>
            <p className="text-gray-600">
              Colores, textos, imágenes y estructura completamente personalizables. 
              Adapta cada demo a tu marca única.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-4">Analytics Avanzados</h3>
            <p className="text-gray-600">
              Tracking completo de visitantes, conversiones y métricas en tiempo real. 
              Optimiza tus demos basándote en datos.
            </p>
          </div>
        </div>

        {/* Industrias Soportadas */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Industrias Soportadas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {[
              { icon: '🐕', name: 'Mascotas', desc: 'Productos y servicios' },
              { icon: '💪', name: 'Fitness', desc: 'Suplementos y entrenamientos' },
              { icon: '🏠', name: 'Hogar', desc: 'Decoración y muebles' },
              { icon: '💼', name: 'Negocios', desc: 'Software y consultoría' },
              { icon: '🍔', name: 'Alimentación', desc: 'Restaurantes y gourmet' },
              { icon: '🎓', name: 'Educación', desc: 'Cursos y capacitación' }
            ].map((industry, index) => (
              <div key={index} className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-3xl mb-2">{industry.icon}</div>
                <h4 className="font-medium mb-1">{industry.name}</h4>
                <p className="text-xs text-gray-600">{industry.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Casos de Uso */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">Casos de Uso</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">🏢 Agencias de Marketing</h3>
              <p className="text-gray-600 text-sm">
                Crea demos rápidas para presentar a clientes potenciales. 
                Muestra tus capacidades con ejemplos reales y personalizados.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">💻 Freelancers</h3>
              <p className="text-gray-600 text-sm">
                Impresiona a tus clientes con prototipos funcionales. 
                Demuestra tu experiencia en diferentes industrias.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">🚀 Startups</h3>
              <p className="text-gray-600 text-sm">
                Valida ideas de negocio rápidamente. Crea landing pages 
                para testing A/B y validación de mercado.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-blue-600 text-white rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para crear tu primera demo?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Únete a cientos de profesionales que ya usan nuestro sistema
          </p>
          <button
            onClick={() => setCurrentView('create')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Empezar Ahora - Es Gratis
          </button>
        </div>
      </div>
    </div>
  );

  const renderDemoView = () => {
    if (!currentDemo) return null;

    return (
      <DemoProvider initialConfig={currentDemo}>
        <div className="min-h-screen bg-white">
          {/* Demo Header */}
          <div className="bg-gray-50 border-b p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('showcase')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Volver
                </button>
                <div>
                  <h1 className="font-semibold">{currentDemo.brand.name}</h1>
                  <p className="text-sm text-gray-600">{currentDemo.product.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Vista previa</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Demo Content */}
          <div className="max-w-4xl mx-auto p-8">
            {/* Simulación de landing page */}
            <div 
              className="rounded-lg p-12 text-white mb-8"
              style={{ 
                backgroundColor: currentDemo.brand.colors.primary,
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)'
              }}
            >
              <h1 className="text-4xl font-bold mb-6">
                {currentDemo.content.hero.headline}
              </h1>
              <p className="text-xl mb-8 opacity-90">
                {currentDemo.content.hero.subheadline}
              </p>
              <button 
                className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
              >
                {currentDemo.content.hero.ctaPrimary}
              </button>
            </div>

            {/* Resto del contenido de la demo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Características</h2>
                <ul className="space-y-2">
                  {currentDemo.product.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Beneficios</h2>
                <ul className="space-y-2">
                  {currentDemo.product.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DemoProvider>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}
      
      {currentView === 'home' && renderHomeView()}
      
      {currentView === 'create' && (
        <DemoSelector 
          onDemoCreated={handleDemoCreated}
          className="min-h-screen bg-gray-50"
        />
      )}
      
      {currentView === 'showcase' && <UniversalDemoShowcase />}
      
      {currentView === 'demo' && renderDemoView()}
    </div>
  );
};

export default UniversalDemoPage; 