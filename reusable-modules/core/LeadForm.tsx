import * as React from 'react';
import { forwardRef } from 'react';
import type { ForwardRefRenderFunction } from 'react';
import { ArrowRight, CheckCircle, Download, ListChecks, Loader2, Lock, MessageCircle, Shield, Zap } from "lucide-react";

interface LeadFormProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  isPurchaseLoading: boolean;
  isFreeGuideLoading: boolean;
  handlePurchaseFormSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleFreeGuideFormSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const LeadForm: ForwardRefRenderFunction<HTMLDivElement, LeadFormProps> = (
  {
    name,
    setName,
    email,
    setEmail,
    isPurchaseLoading,
    isFreeGuideLoading,
    handlePurchaseFormSubmit,
    handleFreeGuideFormSubmit,
  },
  ref
) => {
  return (
    <section id="lead-capture" ref={ref} className="py-16 lg:py-20 bg-blue-600 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block bg-orange-100 text-orange-800 text-sm font-semibold px-4 py-1 rounded-full mb-4 animate-bounce">
          ¡Oferta Especial por Tiempo Limitado!
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          Transforma la Salud de tu Perro <span className="text-yellow-300">Hoy Mismo</span>
        </h2>
        <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-10">
          Únete a miles de dueños que ya están viendo resultados increíbles en sus mascotas.
        </p>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto">
          <div className="md:flex">
            {/* Columna de Beneficios - Más compacta */}
            <div className="md:w-[42%] p-8 flex flex-col justify-center bg-gray-50 text-left text-gray-700">
              <div className="flex items-center mb-3">
                <div className="relative">
                  <span className="text-5xl font-bold text-gray-900">$15</span>
                  <span className="absolute -top-3 -right-10 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full transform rotate-12">
                    70% OFF
                  </span>
                </div>
                <span className="ml-3 text-gray-500 line-through text-lg">$50</span>
              </div>
              <p className="text-green-600 font-semibold mb-5">
                ¡Precio especial por lanzamiento!
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Acceso inmediato al Ebook</span>
                </li>
                <li className="flex items-center">
                  <ListChecks className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Lista 20 alimentos prohibidos</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Guía de Transición incluida</span>
                </li>
                <li className="flex items-center">
                  <MessageCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Soporte por WhatsApp</span>
                </li>
              </ul>
            </div>

            {/* Columna del Formulario - Más amplia */}
            <div className="md:w-[58%] bg-white p-8 md:p-10 flex flex-col justify-center">
              <h3 className="font-bold text-2xl text-gray-800 mb-6 text-center">¡Mejora la salud de tu mascota hoy!</h3>
              <form onSubmit={(e) => e.preventDefault()} className="w-full">
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-5 py-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                      <span className="pl-0"></span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      placeholder="Tu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-5 py-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                      <span className="pl-0"></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handlePurchaseFormSubmit}
                    disabled={isPurchaseLoading}
                    className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-orange-600 transition duration-300 transform hover:scale-102 flex items-center justify-center text-lg"
                  >
                    {isPurchaseLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        QUIERO EL LIBRO AHORA <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleFreeGuideFormSubmit}
                    disabled={isFreeGuideLoading}
                    className="w-full bg-gray-100 text-gray-700 font-bold py-4 px-6 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center"
                  >
                    {isFreeGuideLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" /> OBTENER GUÍA GRATIS
                      </>
                    )}
                  </button>
                  <div className="pt-4 flex items-center justify-center space-x-4 text-sm">
                    <span className="flex items-center text-gray-500"><Lock className="h-4 w-4 mr-1" /> Pago seguro</span>
                    <span className="flex items-center text-gray-500"><Zap className="h-4 w-4 mr-1" /> Descarga inmediata</span>
                    <span className="flex items-center text-gray-500"><Shield className="h-4 w-4 mr-1" /> Garantía 30 días</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default forwardRef(LeadForm);
