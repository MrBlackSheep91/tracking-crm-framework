import * as React from 'react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: '¿Las recetas son seguras para todas las razas y edades?',
      answer: 'Sí, nuestras recetas están formuladas por veterinarios para ser seguras y nutritivas para perros de todas las razas y edades. Siempre recomendamos consultar con tu veterinario antes de hacer cambios importantes en la dieta de tu mascota.',
    },
    {
      question: '¿Cuánto tiempo se tarda en preparar las comidas?',
      answer: 'La mayoría de las recetas se pueden preparar en menos de 20 minutos. El libro incluye consejos para optimizar tu tiempo y preparar comidas para varios días a la vez.',
    },
    {
      question: '¿Necesito ingredientes difíciles de encontrar?',
      answer: 'No, todas nuestras recetas utilizan ingredientes frescos y fáciles de encontrar en cualquier supermercado local. Priorizamos la simplicidad y la accesibilidad.',
    },
    {
      question: '¿Qué pasa si a mi perro no le gustan las recetas?',
      answer: '¡Estamos tan seguros de que a tu perro le encantarán que ofrecemos una garantía de devolución del 100% del dinero durante los primeros 30 días! Si no estás satisfecho, te devolvemos tu dinero sin hacer preguntas.',
    },
    {
      question: '¿El libro incluye opciones para perros con alergias?',
      answer: 'Sí, el libro contiene información sobre cómo adaptar las recetas para perros con alergias comunes, como al pollo o a los granos. También ofrecemos soporte por email para ayudarte a personalizar las comidas.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">Preguntas Frecuentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button 
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center p-6 text-left font-semibold text-lg"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-6 h-6 transition-transform ${openFaq === index ? 'transform rotate-180' : ''}`} />
              </button>
              {openFaq === index && (
                <div className="p-6 pt-0 text-gray-600">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
