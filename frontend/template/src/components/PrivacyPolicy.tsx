import * as React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <Link to="/" className="text-blue-600 hover:underline mb-6 inline-block">
          &larr; Volver a la página principal
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
        
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">Última actualización: 26 de junio de 2025</p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. Información que Recopilamos</h2>
          <p className="text-gray-700 mb-4">
            En NatPets, recopilamos información que usted nos proporciona voluntariamente cuando:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>Se registra en nuestro sitio web o realiza una compra</li>
            <li>Se suscribe a nuestro boletín informativo</li>
            <li>Completa formularios o encuestas</li>
            <li>Se comunica con nosotros a través de correo electrónico o formularios de contacto</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. Uso de la Información</h2>
          <p className="text-gray-700 mb-4">
            Utilizamos la información que recopilamos para:
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <li>Procesar sus transacciones y enviar información relacionada</li>
            <li>Mejorar nuestro sitio web y la experiencia del usuario</li>
            <li>Enviar correos electrónicos periódicos sobre nuevos productos, ofertas especiales u otra información que consideremos relevante</li>
            <li>Responder a sus consultas y brindar soporte al cliente</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Protección de la Información</h2>
          <p className="text-gray-700 mb-6">
            Implementamos una variedad de medidas de seguridad para mantener la seguridad de su información personal. Utilizamos cifrado para proteger la información confidencial transmitida en línea. También protegemos su información fuera de línea.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Divulgación a Terceros</h2>
          <p className="text-gray-700 mb-6">
            No vendemos, comerciamos ni transferimos de otra manera su información personal a terceros sin su consentimiento, excepto cuando sea necesario para cumplir con la ley, hacer cumplir las políticas de nuestro sitio o proteger nuestros derechos, propiedad o seguridad.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">5. Cookies</h2>
          <p className="text-gray-700 mb-6">
            Nuestro sitio utiliza "cookies" para mejorar el acceso a nuestro sitio y para identificar a los visitantes recurrentes. El uso de cookies también nos permite rastrear y dirigir los intereses de nuestros usuarios para mejorar la experiencia en nuestro sitio.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">6. Consentimiento</h2>
          <p className="text-gray-700 mb-6">
            Al utilizar nuestro sitio, usted acepta nuestra política de privacidad.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">7. Cambios en la Política de Privacidad</h2>
          <p className="text-gray-700 mb-6">
            Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Le recomendamos revisar esta página periódicamente para cualquier cambio.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">8. Contacto</h2>
          <p className="text-gray-700">
            Si tiene alguna pregunta sobre esta política de privacidad, puede contactarnos a través de:
          </p>
          <p className="text-gray-700 mt-2">
            Email: info@natpets.com<br />
            Teléfono: +1 (555) 123-4567
          </p>
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
