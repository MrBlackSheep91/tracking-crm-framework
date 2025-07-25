import { TrendingUp, Zap, Shield, Clock } from 'lucide-react';

const Problems = () => {
  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            ¿Qué está pasando <span className="text-red-600">realmente</span> con la comida de tu perro?
          </h2>
          <div className="bg-red-100 border-l-4 border-red-500 p-6 max-w-4xl mx-auto">
            <p className="text-xl font-semibold text-red-800">
              El <span className="text-2xl font-bold">67%</span> de los problemas de salud canina están relacionados con la alimentación procesada
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {[
            {
              icon: <TrendingUp className="w-8 h-8 text-red-500" />,
              title: "Alergias en aumento",
              description: "Ingredientes artificiales causan reacciones alérgicas severas"
            },
            {
              icon: <Zap className="w-8 h-8 text-red-500" />,
              title: "Baja energía",
              description: "Conservantes químicos reducen la vitalidad natural de tu perro"
            },
            {
              icon: <Shield className="w-8 h-8 text-red-500" />,
              title: "Sistema inmune débil",
              description: "Falta de nutrientes esenciales compromete las defensas"
            },
            {
              icon: <Clock className="w-8 h-8 text-red-500" />,
              title: "Envejecimiento prematuro",
              description: "Toxinas acumuladas acortan la expectativa de vida"
            }
          ].map((problem, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="mb-4 flex justify-center">{problem.icon}</div>
              <h3 className="font-bold text-gray-900 mb-3">{problem.title}</h3>
              <p className="text-gray-600 text-sm">{problem.description}</p>
            </div>
          ))}
        </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center h-full flex flex-col">
            <h3 className="text-2xl font-bold text-red-600 mb-4">Antes: Comida Procesada</h3>
            <div className="flex-grow flex flex-col">
              <div className="aspect-square overflow-hidden rounded-xl mb-4">
                <img 
                  src="/antes-de-nat-pets.png" 
                  alt="Perro triste y poco saludable con comida procesada"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-gray-600 mt-auto">Pelaje opaco, baja energía, problemas digestivos</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center h-full flex flex-col">
            <h3 className="text-2xl font-bold text-green-600 mb-4">Después: Alimentación Natural</h3>
            <div className="flex-grow flex flex-col">
              <div className="aspect-square overflow-hidden rounded-xl mb-4">
                <img 
                  src="/despues-de-nat-pets.png" 
                  alt="Perro saludable y feliz con comida natural"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-gray-600 mt-auto">Pelaje brillante, energía abundante, salud óptima</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problems;
