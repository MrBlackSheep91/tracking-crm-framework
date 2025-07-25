import * as React from 'react';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ThankYouPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center bg-white p-10 rounded-xl shadow-lg">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          ¡Gracias!
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Hemos recibido tu información. Revisa tu bandeja de entrada (y la carpeta de spam) para ver los siguientes pasos.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Volver a la página principal
        </Link>
      </div>
    </div>
  );
};

export default ThankYouPage;
