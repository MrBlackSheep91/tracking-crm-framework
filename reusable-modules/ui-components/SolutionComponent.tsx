import * as React from 'react';
import { CheckCircle } from 'lucide-react';

const SolutionComponent: React.FC = () => {
  const benefits = [
    'Nutrición balanceada y completa',
    'Ingredientes 100% naturales y frescos',
    'Recetas fáciles y rápidas de preparar',
    'Mejora la digestión y la salud intestinal',
    'Aumenta la energía y vitalidad de tu perro',
    'Fortalece el sistema inmunológico',
  ];

  return (
    <section id="solution" className="py-16 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
            La Solución Definitiva: <span className="text-green-600">NAT-PETS CRM</span>
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Nuestro libro te guía paso a paso para que prepares comida casera, deliciosa y nutritiva que transformará la salud de tu perro.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="aspect-w-1 aspect-h-1">
            <img src="/nat-pets-crm-dashboard.png" alt="NAT-PETS CRM Dashboard" className="rounded-xl shadow-2xl object-cover" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Beneficios que verás en semanas:</h3>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  <span className="text-lg text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionComponent;
