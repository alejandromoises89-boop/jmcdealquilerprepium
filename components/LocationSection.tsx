
import React from 'react';
// Added ShieldCheck to the imports
import { MapPin, Instagram, MessageCircle, Phone, Navigation, ShieldCheck } from 'lucide-react';

const LocationSection: React.FC = () => {
  return (
    <div className="space-y-12 animate-fadeIn">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-bordeaux-950">Nuestra Sede Central</h2>
        <p className="text-gray-500 max-w-2xl mx-auto flex items-center justify-center gap-2">
          <MapPin size={20} className="text-bordeaux-800" />
          Ciudad del Este, Paraguay - Área Estratégica
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative h-[500px] bg-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d57604.246417743!2d-54.67759567832031!3d-25.530374699999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94f68595fe36b1d1%3A0xce33cb9eeec10b1e!2sCiudad%20del%20Este!5e0!3m2!1ses!2spy!4v1709564821000!5m2!1ses!2spy"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
          ></iframe>
          <div className="absolute bottom-6 left-6 right-6 flex gap-4">
            <button className="flex-1 bg-white/90 backdrop-blur shadow-xl py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white transition-all text-bordeaux-800">
              <Navigation size={20} />
              Cómo Llegar
            </button>
            <button className="flex-1 bg-bordeaux-800 shadow-xl py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:bg-bordeaux-900 transition-all">
              <MapPin size={20} />
              Ver en Maps
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Contacto Directo</h3>
              <p className="text-sm text-gray-500">Estamos disponibles 24/7 para asistencias corporativas y reservas de alta gama.</p>
            </div>

            <div className="space-y-4">
              <a href="https://wa.me/595991681191" className="flex items-center gap-4 p-4 rounded-2xl bg-green-50 text-green-700 hover:bg-green-100 transition-all">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">WhatsApp</p>
                  <p className="font-bold">+595 991 681 191</p>
                </div>
              </a>

              <a href="tel:+595991681191" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">Teléfono Oficina</p>
                  <p className="font-bold">Línea Directa JM</p>
                </div>
              </a>

              <a href="https://instagram.com/jm_asociados_consultoria" className="flex items-center gap-4 p-4 rounded-2xl bg-bordeaux-50 text-bordeaux-800 hover:bg-bordeaux-100 transition-all">
                <div className="w-12 h-12 bg-gradient-to-tr from-gold to-bordeaux-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-bordeaux-200">
                  <Instagram size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">Instagram</p>
                  <p className="font-bold">@jm_asociados</p>
                </div>
              </a>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <div className="bg-gold/10 p-6 rounded-3xl space-y-2 border border-gold/20">
                <h4 className="font-bold text-gold flex items-center gap-2">
                  <ShieldCheck size={18} /> Seguridad JM
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed italic">"Comprometidos con la integridad y seguridad de cada cliente que confía en nuestra flota premium."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSection;
