import * as React from 'react';
import { CheckCircle, Shield, ListChecks, MessageCircle } from 'lucide-react';

interface CTAProps {
  onPurchase: () => void;
}

const CTA: React.FC<CTAProps> = ({ onPurchase }) => {
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block bg-orange-100 text-orange-800 text-sm font-semibold px-4 py-1 rounded-full mb-4 animate-bounce">
            ¡Oferta Especial por Tiempo Limitado!
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Transforma la Salud de tu Perro <span className="text-blue-600">Hoy Mismo</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Únete a miles de dueños que ya están viendo resultados increíbles en sus mascotas.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-2">
                  <span className="text-4xl font-bold text-gray-900">$15</span>
                  <span className="ml-2 text-gray-500 line-through">$50</span>
                  <span className="ml-2 bg-red-100 text-red-800 text-sm font-semibold px-2 py-0.5 rounded-full">
                    70% OFF
                  </span>
                </div>
                <p className="text-green-600 font-semibold mb-4">
                  ¡Precio especial por lanzamiento!
                </p>
                <ul className="space-y-3 text-gray-700 mb-6 md:mb-0 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    Acceso inmediato al Ebook
                  </li>
                  <li className="flex items-center">
                    <ListChecks className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    Lista 20 alimentos prohibidos
                  </li>
                  <li className="flex items-center">
                    <Shield className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    Guía de Transición incluida
                  </li>
                   <li className="flex items-center">
                    <MessageCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    Soporte por WhatsApp
                  </li>
                </ul>
              </div>
              
              <div className="w-full md:w-auto flex-shrink-0">
                <button 
                  onClick={onPurchase}
                  className="w-full bg-orange-500 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:bg-orange-600 transition duration-300 transform hover:scale-105 text-xl md:text-2xl flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">👉</span>
                  <span>QUIERO EL LIBRO AHORA</span>
                </button>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Pago seguro • Descarga inmediata • Garantía de 30 días
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;