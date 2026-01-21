
import React, { useState } from 'react';
import { Vehicle, Breakdown } from '../types';
// Fixed: Added missing 'X' icon to the imports from lucide-react
import { AlertTriangle, Send, Car, PenTool, Image as ImageIcon, Video, UserCheck, Shield, ExternalLink, MessageCircle, X } from 'lucide-react';

interface SupportFormProps {
  flota: Vehicle[];
  onSubmit: (breakdown: Breakdown) => void;
}

const SupportForm: React.FC<SupportFormProps> = ({ flota, onSubmit }) => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    descripcion: '',
    prioridad: 'Media' as 'Alta' | 'Media' | 'Baja'
  });
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fixed: Cast the result of Array.from to File[] to resolve 'unknown' type error when passing to readAsDataURL
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFiles(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = flota.find(v => v.id === formData.vehicleId);
    if (!vehicle) return;

    const newBreakdown: Breakdown = {
      id: Math.random().toString(36).substr(2, 9),
      vehicleId: vehicle.id,
      vehicleName: vehicle.nombre,
      descripcion: formData.descripcion,
      fecha: new Date().toISOString(),
      prioridad: formData.prioridad,
      resuelta: false,
      evidencia: mediaFiles
    };

    onSubmit(newBreakdown);
    setMediaFiles([]);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-12">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto text-red-600 shadow-inner">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-bordeaux-950">Asistencia JM & Seguro</h2>
        <p className="text-gray-500 font-medium max-w-2xl mx-auto">En caso de siniestro o falla, reporte aquí adjuntando evidencias visuales. Su seguridad está protegida por Mapfre S.A. CDE.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
              <Car size={14} /> Unidad Afectada
            </label>
            <select 
              required
              value={formData.vehicleId}
              onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
              className="w-full bg-gray-50 border-0 rounded-3xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800"
            >
              <option value="">Seleccione vehículo...</option>
              {flota.map(v => <option key={v.id} value={v.id}>{v.nombre} ({v.placa})</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
              <PenTool size={14} /> Detalles del Percance
            </label>
            <textarea 
              required
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Describa brevemente lo ocurrido..."
              className="w-full bg-gray-50 border-0 rounded-3xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800 min-h-[120px]"
            ></textarea>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
              <ImageIcon size={14} /> Evidencia (Fotos/Video)
            </label>
            <div className="flex flex-wrap gap-4">
               <label className="flex-1 min-w-[120px] h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 hover:border-gold/50 transition-all">
                  <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                  <ImageIcon size={20} className="text-gray-300" />
                  <span className="text-[8px] font-black uppercase text-gray-400 mt-2">Adjuntar</span>
               </label>
               {mediaFiles.map((f, i) => (
                 <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative group">
                    <img src={f} className="w-full h-full object-cover" alt="Evidencia" />
                    <button type="button" onClick={() => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                       <X size={16} />
                    </button>
                 </div>
               ))}
            </div>
          </div>

          <button type="submit" className="w-full bordeaux-gradient text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.5em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
            Enviar Reporte Interno
          </button>
        </form>

        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16"></div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-serif font-bold text-bordeaux-950">Canales Directos</h3>
                 <p className="text-[10px] font-black text-gold uppercase tracking-widest">Atención VIP Inmediata</p>
              </div>

              <div className="space-y-4">
                <a href="https://wa.me/595991681191" target="_blank" className="flex items-center gap-6 p-5 bg-bordeaux-50 rounded-[2rem] border border-bordeaux-100 hover:bg-bordeaux-100 transition-all">
                   <div className="w-14 h-14 bg-bordeaux-800 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <UserCheck size={28} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-bordeaux-800 mb-1">Dueño / Gerencia</p>
                      <p className="font-bold text-bordeaux-950">Contacto Directo JM</p>
                   </div>
                   <MessageCircle size={20} className="ml-auto text-bordeaux-800 opacity-30" />
                </a>

                <div className="p-7 bg-white border-2 border-gold/20 rounded-[2.5rem] space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center text-white shadow-lg shadow-gold/30">
                         <Shield size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-gold">Aseguradora Oficial</p>
                         <p className="font-black text-bordeaux-950 text-lg">MAPFRE S.A. CDE</p>
                      </div>
                   </div>
                   <p className="text-[11px] text-gray-500 leading-relaxed italic">"Póliza corporativa de cobertura total. Ante cualquier colisión, no mueva el vehículo sin autorización de Mapfre."</p>
                   <button onClick={() => window.open('tel:+59561502422')} className="w-full py-4 bg-gray-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-black transition-all">
                      Siniestros Mapfre <ExternalLink size={14} />
                   </button>
                </div>
              </div>
           </div>

           <div className="bg-gray-50/80 p-8 rounded-[2.5rem] text-center border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em] mb-3">En caso de emergencia médica</p>
              <h4 className="text-3xl font-black text-red-600 tracking-tighter">911 / Bomberos</h4>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SupportForm;
