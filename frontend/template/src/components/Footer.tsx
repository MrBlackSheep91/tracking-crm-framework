import * as React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-12 px-4">
      <div className="container mx-auto text-center">
        <p className="font-bold text-xl mb-4">Recetas para un canino Saludable. Nat-Pets.com</p>
        <p className="mb-6">Transformando la salud de tu mascota, una comida a la vez.</p>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
          <a 
            href="https://www.instagram.com/kimberlydogg" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-yellow-400 transition-colors"
          >
            Instagram
          </a>
          <Link to="/politica-de-privacidad" className="hover:text-yellow-400 transition-colors">
            Política de Privacidad
          </Link>
        </div>
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Nat-Pets.com Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
