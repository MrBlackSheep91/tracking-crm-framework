import { BookOpen, ClipboardCheck, Users } from 'lucide-react';

const Research = () => {
  return (
    <section className="py-16 lg:py-20 bg-green-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full uppercase">Base científica sólida</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-4 mb-6">
            Respaldado por <span className="text-green-600">+100 estudios científicos</span>
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Cada receta está formulada siguiendo principios nutricionales validados por investigaciones académicas recientes
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex flex-col items-center text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Artículos académicos</h3>
            <p className="text-gray-600">Basado en publicaciones de nutrición canina de instituciones reconocidas mundialmente</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex flex-col items-center text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <ClipboardCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Estudios clínicos</h3>
            <p className="text-gray-600">Incorpora resultados de investigaciones sobre biodisponibilidad de nutrientes y salud canina</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex flex-col items-center text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Veterinarios especialistas</h3>
            <p className="text-gray-600">Revisado por profesionales en nutrición y medicina veterinaria preventiva</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {['Universidad Nacional', 'Journal of Animal Science', 'Centros de Nutrición Canina', 'Clinical Veterinary Research', 'Estudios Comparativos'].map((source, index) => (
            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {source}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Research;
