/**
 * Componente para seleccionar industria y generar demos
 * Permite crear nuevas demos para diferentes industrias
 */

import React, { useState } from 'react';
import { industryConfigs, generateDemoConfig } from '../config/industry-templates';
import { DemoConfig, IndustryConfig } from '../types/demo-config';

interface DemoSelectorProps {
  onDemoCreated: (config: DemoConfig) => void;
  className?: string;
}

interface FormData {
  industry: string;
  businessName: string;
  productName: string;
  price: number;
  customization: {
    colors?: {
      primary?: string;
      secondary?: string;
    };
    logo?: string;
    headline?: string;
  };
}

export const DemoSelector: React.FC<DemoSelectorProps> = ({ 
  onDemoCreated, 
  className = '' 
}) => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    industry: '',
    businessName: '',
    productName: '',
    price: 99.99,
    customization: {}
  });
  const [isCreating, setIsCreating] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<DemoConfig | null>(null);

  const handleIndustrySelect = (industryId: string) => {
    setSelectedIndustry(industryId);
    setFormData(prev => ({ ...prev, industry: industryId }));
    
    // Generar preview automático
    if (formData.businessName && formData.productName) {
      generatePreview(industryId, formData.businessName, formData.productName);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Actualizar preview si hay datos suficientes
      if (updated.industry && updated.businessName && updated.productName) {
        generatePreview(updated.industry, updated.businessName, updated.productName);
      }
      
      return updated;
    });
  };

  const generatePreview = (industry: string, businessName: string, productName: string) => {
    try {
      const config = generateDemoConfig(industry, businessName, productName, {
        price: formData.price,
        ...formData.customization
      });
      setPreviewConfig(config as DemoConfig);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleCreateDemo = async () => {
    if (!formData.industry || !formData.businessName || !formData.productName) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setIsCreating(true);
    try {
      const config = generateDemoConfig(
        formData.industry,
        formData.businessName,
        formData.productName,
        {
          price: formData.price,
          ...formData.customization
        }
      );
      
      onDemoCreated(config as DemoConfig);
    } catch (error) {
      console.error('Error creating demo:', error);
      alert('Error al crear la demo. Intenta nuevamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedIndustryConfig = industryConfigs.find(c => c.id === selectedIndustry);

  return (
    <div className={`demo-selector ${className}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 Generador Universal de Demos
          </h1>
          <p className="text-lg text-gray-600">
            Crea una landing page profesional para cualquier industria en segundos
          </p>
        </div>

        {/* Selección de Industria */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Selecciona tu industria</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {industryConfigs.map((industry) => (
              <button
                key={industry.id}
                onClick={() => handleIndustrySelect(industry.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedIndustry === industry.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{industry.icon}</div>
                <div className="font-medium">{industry.name}</div>
                <div className="text-sm text-gray-500">{industry.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Formulario de Configuración */}
        {selectedIndustry && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Configura tu demo</h2>
            <div className="bg-white rounded-lg border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Ej: PowerGym, Decoraciones Elite"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="Ej: Proteína WheyMax, Curso de Marketing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Principal (opcional)
                  </label>
                  <input
                    type="color"
                    value={formData.customization.colors?.primary || selectedIndustryConfig?.defaultColors.primary || '#000000'}
                    onChange={(e) => handleInputChange('customization', {
                      ...formData.customization,
                      colors: { ...formData.customization.colors, primary: e.target.value }
                    })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titular Principal (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.customization.headline || ''}
                    onChange={(e) => handleInputChange('customization', {
                      ...formData.customization,
                      headline: e.target.value
                    })}
                    placeholder="Ej: Transforma tu negocio en 30 días"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewConfig && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Vista previa</h2>
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">{previewConfig.brand.name}</h3>
                  <p className="text-gray-600">{previewConfig.product.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: previewConfig.brand.colors.primary }}>
                    ${previewConfig.product.price}
                  </div>
                  <div className="text-sm text-gray-500">{previewConfig.product.currency}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Titular:</h4>
                <p className="text-gray-700">{previewConfig.content.hero.headline}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Subtítulo:</h4>
                <p className="text-gray-600">{previewConfig.content.hero.subheadline}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div 
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: previewConfig.brand.colors.primary }}
                ></div>
                <div 
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: previewConfig.brand.colors.secondary }}
                ></div>
                <div 
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: previewConfig.brand.colors.accent }}
                ></div>
                <span className="text-sm text-gray-500">Paleta de colores</span>
              </div>
            </div>
          </div>
        )}

        {/* Botón de Crear Demo */}
        {selectedIndustry && formData.businessName && formData.productName && (
          <div className="text-center">
            <button
              onClick={handleCreateDemo}
              disabled={isCreating}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-all ${
                isCreating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isCreating ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Creando Demo...
                </>
              ) : (
                '🚀 Crear Demo'
              )}
            </button>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-12 text-center text-gray-500">
          <p className="mb-2">
            💡 <strong>Tip:</strong> Todas las demos incluyen sistema de tracking completo, 
            formularios de captura de leads y métricas en tiempo real.
          </p>
          <p>
            🎨 Puedes personalizar colores, textos e imágenes después de crear la demo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoSelector; 