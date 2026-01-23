
import React, { useState, useEffect } from 'react';
import { Vehicle, Reservation } from '../types';
import { 
  X, ChevronRight, Upload, 
  Copy, Check, User as UserIcon, 
  MessageCircle, PenTool, Clock, ChevronLeft, CheckCircle2, AlertTriangle, FileText,
  Sparkles, CreditCard, ShieldCheck, ArrowRight, Wallet, QrCode, Banknote
} from 'lucide-react';

interface BookingModalProps {
  vehicle: Vehicle;
  exchangeRate: number;
  reservations: Reservation[];
  onClose: () => void;
  onSubmit: (res: Reservation) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ vehicle, exchangeRate, reservations, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cliente: '',
    email: '',
    ci: '',
    celular: '',
    inicio: '2026-01-01',
    fin: '2026-01-02',
    horaIni: '08:00',
    horaFin: '08:00',
    paymentType: 'Full' as 'Full' | 'OneDay',
    signature: '',
    payMethod: 'Pix' as 'Pix' | 'Card' | 'Transfer'
  });
  
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [copied, setCopied] = useState(false);

  const stepsLabels = ["Plan", "Contrato", "Firma", "Pago", "Cierre"];

  const startDateTime = new Date(`${formData.inicio}T${formData.horaIni}`);
  const endDateTime = new Date(`${formData.fin}T${formData.horaFin}`);
  const diffInHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
  
  const days = Math.max(1, Math.ceil(diffInHours / 24));
  const fullTotalBRL = Math.max(0, days * vehicle.precio);

  useEffect(() => {
    // Verificación de disponibilidad lógica
    const overlap = reservations.find(r => {
      if (r.auto !== vehicle.nombre || r.status === 'Cancelled') return false;
      const parseD = (s: string) => {
        const parts = s.split(' ');
        const [d, m, y] = parts[0].split(/[/-]/);
        const [h, min] = parts[1] ? parts[1].split(':') : ["00", "00"];
        const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
        return new Date(year, parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min));
      };
      const rStart = parseD(r.inicio);
      const rEnd = parseD(r.fin);
      return startDateTime < rEnd && endDateTime > rStart;
    });
    setIsAvailable(!overlap);
  }, [formData.inicio, formData.fin, formData.horaIni, formData.horaFin, reservations, vehicle.nombre]);

  const handleFinalConfirm = () => {
    const newRes: Reservation = {
      id: `JM${Math.floor(Math.random() * 9999)}`,
      cliente: formData.cliente,
      ci: formData.ci,
      celular: formData.celular,
      auto: vehicle.nombre,
      inicio: `${formData.inicio} ${formData.horaIni}`,
      fin: `${formData.fin} ${formData.horaFin}`,
      total: fullTotalBRL,
      status: 'Requested',
      comprobante: receiptBase64 || undefined
    };
    onSubmit(newRes);
    const waText = `*JM ASOCIADOS - PROTOCOLO VIP*\n👤 *Socio:* ${formData.cliente}\n🚗 *Unidad:* ${vehicle.nombre}\n📅 *Inicio:* ${formData.inicio} ${formData.horaIni}\n📅 *Fin:* ${formData.fin} ${formData.horaFin}\n💰 *Total:* R$ ${fullTotalBRL}\n\n_Solicitud enviada para validación final._`;
    window.open(`https://wa.me/595991681191?text=${encodeURIComponent(waText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden">
      <div className="relative bg-white w-full max-w-5xl h-[94vh] md:h-auto md:max-h-[92vh] rounded-t-[3rem] md:rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp">
        
        {/* Header de Progreso */}
        <div className="bg-white px-6 py-6 md:px-12 md:py-8 border-b border-gray-100 flex flex-col gap-5">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <button onClick={step > 1 ? () => setStep(step - 1) : onClose} className="p-3 bg-gray-50 rounded-2xl text-bordeaux-800 hover:bg-bordeaux-50 transition-all">
                    <ChevronLeft size={20} />
                 </button>
                 <div>
                    <h2 className="text-[10px] md:text-xs font-black text-bordeaux-950 uppercase tracking-[0.4em]">{stepsLabels[step-1]}</h2>
                    <p className="text-[8px] font-bold text-gold uppercase tracking-widest mt-1">JM Associates Terminal</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                 <X size={18} />
              </button>
           </div>
           <div className="flex gap-2 max-w-md mx-auto w-full">
              {stepsLabels.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-700 ${step > i ? 'bg-bordeaux-800' : 'bg-gray-100'}`} />
              ))}
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-14 space-y-8 scrollbar-hide pb-40">
           
           {step === 1 && (
             <div className="space-y-8 animate-fadeIn">
                <div className="bordeaux-gradient p-8 rounded-[2.5rem] text-white text-center space-y-4 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                   <h4 className="text-xl md:text-4xl font-serif font-bold italic tracking-tight">Presupuesto <span className="text-gold">Platinum</span></h4>
                   <div className="flex justify-center items-center gap-8 md:gap-16">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Inversión Total</p>
                         <p className="text-2xl md:text-5xl font-black">R$ {fullTotalBRL}</p>
                      </div>
                      <div className="w-px h-12 bg-white/20"></div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Duración</p>
                         <p className="text-2xl md:text-5xl font-black">{days} {days === 1 ? 'Día' : 'Días'}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-lg space-y-6">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><Clock size={16} className="text-gold" /> Cronograma</h5>
                      <div className="space-y-4">
                         <div className="flex flex-col sm:flex-row gap-2">
                            <input type="date" value={formData.inicio} onChange={e => setFormData({...formData, inicio: e.target.value})} className="flex-1 bg-gray-50 border-0 rounded-2xl px-5 py-4 font-bold text-xs" />
                            <input type="time" value={formData.horaIni} onChange={e => setFormData({...formData, horaIni: e.target.value})} className="w-full sm:w-28 bg-gray-50 border-0 rounded-2xl px-5 py-4 font-bold text-xs" />
                         </div>
                         <div className="flex flex-col sm:flex-row gap-2">
                            <input type="date" value={formData.fin} onChange={e => setFormData({...formData, fin: e.target.value})} className="flex-1 bg-gray-50 border-0 rounded-2xl px-5 py-4 font-bold text-xs" />
                            <input type="time" value={formData.horaFin} onChange={e => setFormData({...formData, horaFin: e.target.value})} className="w-full sm:w-28 bg-gray-50 border-0 rounded-2xl px-5 py-4 font-bold text-xs" />
                         </div>
                      </div>
                      {!isAvailable && <p className="text-[10px] font-bold text-red-500 bg-red-50 p-4 rounded-2xl flex items-center gap-3 animate-pulse uppercase tracking-widest"><AlertTriangle size={14} /> Unidad ocupada en estas fechas</p>}
                   </div>

                   <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-lg space-y-6">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><UserIcon size={16} className="text-gold" /> Identidad Socio</h5>
                      <div className="space-y-4">
                         <input type="text" placeholder="Nombre Oficial" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 font-bold text-sm shadow-inner" />
                         <input type="text" placeholder="Cédula / RG" value={formData.ci} onChange={e => setFormData({...formData, ci: e.target.value})} className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 font-bold text-sm shadow-inner" />
                         <input type="tel" placeholder="WhatsApp" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 font-bold text-sm shadow-inner" />
                      </div>
                   </div>
                </div>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-2xl space-y-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5"><FileText size={150} className="text-bordeaux-800" /></div>
                   <h3 className="text-2xl md:text-3xl font-serif font-bold text-bordeaux-950 text-center italic">Arrendamiento Digital</h3>
                   <div className="max-h-[350px] overflow-y-auto text-xs md:text-sm leading-relaxed text-gray-600 space-y-5 pr-4 airbnb-scrollbar">
                      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                         <p><b>PRIMERA:</b> El arrendador entrega la unidad <b>{vehicle.nombre}</b> bajo condiciones de mantenimiento premium verificadas.</p>
                      </div>
                      <p><b>SEGUNDA:</b> El arrendatario se compromete a la devolución el día <b>{formData.fin}</b> a las <b>{formData.horaFin}</b>.</p>
                      <p><b>TERCERA:</b> Retrasos injustificados incurrirán en multas equivalentes al 50% de la diaria por cada 2 horas de excedente.</p>
                      <p><b>CUARTA:</b> El seguro integral requiere reporte inmediato y denuncia policial en caso de siniestro.</p>
                      <p><b>QUINTA:</b> Prohibido fumar o transportar sustancias ilícitas dentro de la unidad Platinum.</p>
                   </div>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-12 animate-fadeIn text-center max-w-lg mx-auto py-8">
                <div className="w-24 h-24 bg-bordeaux-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-bordeaux-800 shadow-inner">
                   <PenTool size={40} />
                </div>
                <div className="space-y-4">
                   <h3 className="text-3xl font-serif font-bold text-bordeaux-950 italic">Sello de Conformidad</h3>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">Valide el contrato con su firma oficial</p>
                </div>
                <input 
                  type="text" 
                  placeholder="Escriba su nombre completo aquí" 
                  value={formData.signature} 
                  onChange={e => setFormData({...formData, signature: e.target.value})} 
                  className="w-full border-b-4 border-bordeaux-800 py-6 text-2xl md:text-4xl font-serif text-center outline-none bg-transparent placeholder:text-gray-100 transition-all focus:border-gold" 
                />
                <p className="text-[8px] text-gold font-black uppercase tracking-widest leading-loose">
                   Esta rúbrica digital vincula su identidad al protocolo corporativo #JM-{Math.floor(Math.random() * 8999)}
                </p>
             </div>
           )}

           {step === 4 && (
             <div className="space-y-8 animate-fadeIn text-center max-w-xl mx-auto">
                <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl space-y-8 relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-full h-1.5 bordeaux-gradient"></div>
                   <div className="flex justify-center">
                     <div className="px-8 py-3 bg-bordeaux-950 text-gold rounded-full text-[10px] font-black uppercase tracking-[0.5em] shadow-xl flex items-center gap-3">
                        <Sparkles size={14} className="animate-pulse" /> TERMINAL JM
                     </div>
                   </div>

                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'Pix', label: 'PIX / QR', icon: QrCode },
                        { id: 'Card', label: 'Tarjeta', icon: CreditCard },
                        { id: 'Transfer', label: 'Transfer', icon: Banknote }
                      ].map(method => (
                        <button 
                          key={method.id}
                          onClick={() => setFormData({...formData, payMethod: method.id as any})}
                          className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${formData.payMethod === method.id ? 'bg-bordeaux-50 border-bordeaux-800 text-bordeaux-800' : 'bg-gray-50 border-gray-100 text-gray-300'}`}
                        >
                           <method.icon size={24} />
                           <span className="text-[8px] font-black uppercase tracking-widest">{method.label}</span>
                        </button>
                      ))}
                   </div>
                   
                   <div className="p-8 bg-bordeaux-50 rounded-[2.5rem] border-2 border-bordeaux-100 relative overflow-hidden flex flex-col items-center">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><Wallet size={100} /></div>
                      <p className="text-[10px] font-black text-bordeaux-800/40 mb-3 uppercase tracking-widest">Protocolo de Llave Corporativa:</p>
                      <code className="text-xl md:text-3xl font-black text-bordeaux-950 tracking-tight">24510861818</code>
                      <button onClick={() => { navigator.clipboard.writeText("24510861818"); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="mt-6 flex items-center gap-2 px-6 py-2 bg-gold text-white rounded-full text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">
                         {copied ? <Check size={14} /> : <Copy size={14} />}
                         {copied ? 'Copiado' : 'Copiar Identificador'}
                      </button>
                   </div>
                </div>
             </div>
           )}

           {step === 5 && (
             <div className="space-y-8 animate-fadeIn text-center max-w-xl mx-auto py-4">
                <div className="space-y-4">
                   <h3 className="text-3xl md:text-4xl font-serif font-bold text-bordeaux-950 italic">Activación de <span className="text-gold">Expediente</span></h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Suba el comprobante oficial de la transacción</p>
                </div>
                
                <label className={`block w-full min-h-[350px] border-[3px] border-dashed rounded-[4rem] transition-all duration-700 cursor-pointer p-8 relative group ${receiptBase64 ? 'border-green-500 bg-green-50/20' : 'border-bordeaux-100 bg-bordeaux-50/30'}`}>
                   <input type="file" className="hidden" onChange={e => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onloadend = () => setReceiptBase64(reader.result as string);
                       reader.readAsDataURL(file);
                     }
                   }} />
                   
                   {receiptBase64 ? (
                     <div className="h-full flex flex-col items-center justify-center gap-6">
                        <img src={receiptBase64} className="max-h-[220px] rounded-2xl shadow-xl border-4 border-white" alt="Recibo" />
                        <div className="bg-green-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl">
                           <ShieldCheck size={18} /> Evidencia Cargada
                        </div>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center gap-6 h-full py-16">
                        <div className="p-8 bg-white rounded-[3rem] shadow-xl group-hover:scale-110 transition-all duration-500">
                           <Upload size={40} className="text-gold" />
                        </div>
                        <p className="text-sm font-black uppercase text-bordeaux-950 tracking-[0.3em]">Adjuntar Imagen</p>
                     </div>
                   )}
                </label>
             </div>
           )}
        </div>

        {/* Floating Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-white/95 backdrop-blur-md border-t border-gray-100 flex flex-col md:flex-row gap-4 z-[170] shadow-2xl">
           <button 
            onClick={() => step < 5 ? setStep(step + 1) : handleFinalConfirm()} 
            disabled={(step === 1 && (!formData.cliente || !isAvailable)) || (step === 3 && !formData.signature) || (step === 5 && !receiptBase64)}
            className={`flex-1 py-6 rounded-[2.5rem] font-black text-[12px] md:text-[14px] uppercase tracking-[0.6em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 ${
              step === 5 ? 'bordeaux-gradient text-white' : 'bg-bordeaux-950 text-white hover:bg-black'
            } disabled:opacity-20`}
           >
             {step === 5 ? 'Finalizar Solicitud' : 'Continuar Protocolo'}
             <ChevronRight size={20} className={step === 5 ? 'text-gold' : 'text-gray-400'} />
           </button>
           
           {step === 5 && (
             <button onClick={handleFinalConfirm} className="w-full md:w-32 py-6 bg-green-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl hover:bg-green-700 active:scale-95 transition-all group">
               <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
             </button>
           )}
        </div>
      </div>
      
      <style>{`
        .airbnb-scrollbar::-webkit-scrollbar { width: 4px; }
        .airbnb-scrollbar::-webkit-scrollbar-thumb { background: #80000020; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default BookingModal;
