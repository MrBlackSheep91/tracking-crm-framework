import { Star } from 'lucide-react';

const SocialProof = () => {
  return (
    <section className="py-16 lg:py-20 bg-green-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen otros dueños como tú
          </h2>
          <div className="flex justify-center items-center gap-2 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
            <span className="text-lg font-semibold text-gray-700 ml-2">4.9/5 • +2,847 reseñas</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "María González",
              dogName: "Luna (Golden Retriever)",
              review: "En solo 3 semanas Luna cambió completamente. Su pelaje está brillante y tiene más energía que nunca. ¡Las recetas son súper fáciles!",
              image: "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=400"
            },
            {
              name: "Carlos Mendoza",
              dogName: "Max (Pastor Alemán)",
              review: "Max tenía problemas digestivos constantes. Después de seguir las recetas por un mes, está como nuevo. Vale cada centavo.",
              image: "https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&cs=tinysrgb&w=400"
            },
            {
              name: "Ana Fernández",
              dogName: "Luna (Bulldog Francés)",
              review: "Pensé que sería complicado, pero el libro lo hace todo muy sencillo. Luna ama la comida y yo estoy feliz de saber que le doy lo mejor.",
              image: "https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=400"
            }
          ].map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.dogName}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-green-600 font-semibold">{testimonial.dogName}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 italic">\"{testimonial.review}\"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
