
import { Sparkles, Zap, Shield, Heart, Award, CheckCircle } from 'lucide-react';

const Benefits = () => {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            Transforma la vida de tu perro con estas{' '}
            <span className="text-green-600">8 recetas simples</span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Sparkles className="w-12 h-12 text-yellow-500" />,
              title: "Pelaje más brillante y saludable",
              description: "Omega-3 naturales restauran el brillo y suavidad del pelaje en semanas"
            },
            {
              icon: <Zap className="w-12 h-12 text-green-500" />,
              title: "Mayor energía y vitalidad",
              description: "Proteínas de alta calidad aumentan los niveles de energía notablemente"
            },
            {
              icon: <Shield className="w-12 h-12 text-blue-500" />,
              title: "Reducción de problemas digestivos",
              description: "Ingredientes naturales mejoran la digestión y eliminan malestares"
            },
            {
              icon: <Heart className="w-12 h-12 text-red-500" />,
              title: "Fortalecimiento del sistema inmunológico",
              description: "Antioxidantes naturales refuerzan las defensas contra enfermedades"
            },
            {
              icon: <Award className="w-12 h-12 text-purple-500" />,
              title: "Longevidad y calidad de vida mejoradas",
              description: "Nutrición equilibrada extiende años de vida saludable y feliz"
            },
            {
              icon: <CheckCircle className="w-12 h-12 text-green-600" />,
              title: "Resultados visibles en 30 días",
              description: "Cambios notables en comportamiento, apariencia y bienestar general"
            }
          ].map((benefit, index) => (
            <div key={index} className="bg-gray-50 p-8 rounded-xl text-center hover:shadow-lg transition-shadow duration-300">
              <div className="mb-6 flex justify-center">{benefit.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
