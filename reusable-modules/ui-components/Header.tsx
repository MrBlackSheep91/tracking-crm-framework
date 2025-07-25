import * as React from 'react';

interface HeaderProps {
  scrollToLeadCapture: () => void;
}

const Header: React.FC<HeaderProps> = ({ scrollToLeadCapture }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/logo.svg" alt="Logo" className="h-12 w-auto" />
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <a href="#beneficios" className="text-gray-600 hover:text-green-600 transition-colors">Beneficios</a>
          <a href="#testimonios" className="text-gray-600 hover:text-green-600 transition-colors">Testimonios</a>
          <a href="#faq" className="text-gray-600 hover:text-green-600 transition-colors">Preguntas</a>
        </div>
        <button 
          onClick={scrollToLeadCapture}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-transform transform hover:scale-105"
        >
          Obtener Libro
        </button>
      </div>
    </header>
  );
};

export default Header;
