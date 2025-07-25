import * as React from 'react';
import { Shield, Sparkles, ArrowRightIcon, CheckCircle, Heart } from 'lucide-react';

interface HeroProps {
  onCTAClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onCTAClick }) => {
  return (
    <header className="bg-gradient-to-b from-blue-100 to-green-100 py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full uppercase mb-4">EDICIÓN LIMITADA: SOLO 50 COPIAS DISPONIBLES HOY</div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="text-green-600">Recetas para un canino Saludable:</span> El Ebook que{' '}
              <span className="text-blue-600">agregará 3 años</span> a la vida de tu perro
            </h1>
            <p className="text-xl lg:text-2xl text-gray-700 mb-6 leading-relaxed">
              <span className="font-semibold">Recetas naturales</span> que transformarán la salud de tu mascota en 30 días, <span className="underline decoration-yellow-500 decoration-2">con ingredientes comunes</span> y solo 15 minutos al día
            </p>
            <div className="bg-white p-3 rounded-lg shadow border border-green-100 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium">Incluye GRATIS guía de transición segura + consulta veterinaria online</p>
            </div>
            <button 
              onClick={onCTAClick}
              className="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-orange-600 transition duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-6 h-6" />
              <span>COMPRAR AHORA POR $15</span>
              <ArrowRightIcon className="w-6 h-6" />
            </button>
            <p className="text-sm text-gray-600 mt-4 flex items-center justify-center lg:justify-start gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Descarga instantánea <CheckCircle className="w-4 h-4 text-green-600" /> Garantía de 30 días</p>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="hero.png" 
                alt="Dueño preparando comida natural para su perro saludable"
                className="w-full object-contain"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500" />
                <div>
                  <p className="font-semibold text-gray-900">+15,000</p>
                  <p className="text-sm text-gray-600">Perros más sanos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
