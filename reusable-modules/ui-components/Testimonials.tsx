// ARCHIVO OBSOLETO - SE USA TestimonialsComponent.tsx EN SU LUGAR
import * as React from 'react';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      name: 'Laura y Max',
      text: '¡El cambio en Max es increíble! Su pelaje brilla y tiene más energía que nunca. ¡Las recetas son súper fáciles de seguir!',
      avatar: '/avatar-1.png',
    },
    {
      name: 'Carlos y Rocky',
      text: 'Rocky sufría de alergias constantes. Desde que empezamos con la comida casera, no ha tenido ni un solo problema. ¡Totalmente recomendado!',
      avatar: '/avatar-2.png',
    },
    {
      name: 'Ana y Luna',
      text: 'Pensé que sería complicado, pero el libro lo hace todo muy sencillo. Luna ama la comida y yo estoy feliz de saber que le doy lo mejor.',
      avatar: '/avatar-3.png',
    },
  ];

  return (
    <section id="testimonials" className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
            Dueños Felices, Perros <span className="text-yellow-500">Aún Más Felices</span>
          </h2>
          <p className="mt-4 text-xl text-gray-600">Historias reales de quienes ya transformaron la vida de sus mascotas.</p>
        </div>
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-lg flex flex-col">
              <div className="flex items-center mb-4">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <p className="font-bold text-gray-800">{testimonial.name}</p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
