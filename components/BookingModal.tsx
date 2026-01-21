
import React, { useState, useEffect } from 'react';
import { Vehicle, Reservation } from '../types';
import { 
  X, Calendar, ChevronRight, Upload, 
  Copy, Check, ShieldCheck, User, CreditCard, ArrowLeft, PenTool,
  Mail, Minus, Square, Info, AlertTriangle, ArrowLeftCircle
} from 'lucide-react';
import ContractDocument from './ContractDocument';

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
    paymentType: 'Full' as 'Full' | 'OneDay'
  });
  
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [copied, setCopied] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  const startDateTime = new Date(`${formData.inicio}T${formData.horaIni}`);
  const endDateTime = new Date(`${formData.fin}T${formData.horaFin}`);
  const diffTime = endDateTime.getTime() - startDateTime.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isPeriodValid = days >= 1;
  const fullTotalBRL = isPeriodValid ? days * vehicle.precio : 0;
  const bookingTotalBRL = formData.paymentType === 'Full' ? fullTotalBRL : vehicle.precio;

  useEffect(() => {
    // Check overlapping availability
    const simpleTarget = vehicle.nombre.toLowerCase().replace(/toyota|hyundai|blanco|negro|gris/g, '').trim();
    const overlap = reservations.find(r => {
      const resAuto = (r.auto || "").toLowerCase();
      if (!resAuto.includes(simpleTarget) && !simpleTarget.includes(resAuto)) return false;
      if (r.status === 'Cancelled') return false;
      
      const parseD = (s: string) => {
        const p = s.split(' ')[0].split(/[/-]/);
        if (p.length !== 3) return new Date();
        return p[0].length === 4 
          ? new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])) 
          : new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
      };
      
      const rStart = parseD(r.inicio);
      const rEnd = parseD(r.fin);
      return startDateTime < rEnd && endDateTime > rStart;
    });
    setIsAvailable(!overlap);
  }, [formData.inicio, formData.fin, reservations, vehicle.nombre, startDateTime, endDateTime]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText("24510861818");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinalConfirm = () => {
    const newReservation: Reservation = {
      id: `jm-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      cliente: formData.cliente,
      email: formData.email,
      ci: formData.ci,
      celular: formData.celular,
      auto: vehicle.nombre,
      inicio: `${formData.inicio} ${formData.horaIni}`,
      fin: `${formData.fin} ${formData.horaFin}`,
      total: fullTotalBRL,
      paymentType: formData.paymentType,
      status: 'Confirmed'
    };
    onSubmit(newReservation);
    const waText = `*JM ASOCIADOS - NUEVA RESERVA*\n🚗 Unidad: ${vehicle.nombre}\n👤 Cliente: ${formData.cliente}\n📅 Desde: ${formData.inicio} hasta ${formData.fin}\n💰 Tipo Pago: ${formData.paymentType === 'Full' ? 'Pago Total' : 'Reserva 1 Diaria'}`;
    window.open(`https://wa.me/595991681191?text=${encodeURIComponent(waText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bordeaux-950/90 backdrop-blur-xl p-0 sm:p-4 md:p-12 overflow-y-auto airbnb-scrollbar">
      <div className="relative bg-white w-full max-w-5xl min-h-screen sm:min-h-0 sm:max-h-[95vh] sm:rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp">
        
        {/* Superior Header with Clear Close Button */}
        <div className="bg-white border-b border-gray-100 px-6 sm:px-10 py-5 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-bordeaux-50 rounded-xl">
                <img src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" className="h-7 w-auto" alt="Logo" />
             </div>
             <h2 className="text-[10px] sm:text-[11px] font-black text-bordeaux-950 uppercase tracking-[0.4em] truncate max-w-[150px] sm:max-w-none">
                Reserva Corporativa
             </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={onClose}
                className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl transition-all flex items-center justify-center"
                title="Cerrar Reserva"
             >
                <X size={24} />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-16 space-y-10 pb-32 bg-gray-50/20">
          
          {/* Progress & Back Button Section */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={step > 1 ? () => setStep(step - 1) : onClose}
              className="flex items-center gap-2 text-bordeaux-800 font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
            >
              <ArrowLeftCircle size={20} /> <span className="hidden sm:inline">Volver</span>
            </button>
            <div className="flex gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 w-12 rounded-full transition-all ${step >= s ? 'bg-bordeaux-800' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>

          <div className="bordeaux-gradient text-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-60 mb-1">Operación Elite</p>
                <h4 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                  {step === 1 ? 'Configuración de Estancia' : step === 2 ? 'Revisión de Contrato' : 'Validación Bancaria'}
                </h4>
                <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                   <Info size={14} className="text-gold" />
                   <span className="text-[9px] font-bold uppercase tracking-widest">{vehicle.nombre}</span>
                </div>
             </div>
          </div>

          {step === 1 && (
            <div className="space-y-10 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                  <h4 className="text-[10px] font-black text-bordeaux-950 uppercase tracking-[0.4em] flex items-center gap-4">
                    <Calendar size={20} className="text-gold" /> Periodo de Alquiler
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Entrega</label>
                      <input type="date" value={formData.inicio} min="2026-01-01" onChange={(e) => setFormData({...formData, inicio: e.target.value})} className="w-full px-6 py-5 bg-gray-50 border-0 rounded-[2rem] font-bold text-sm shadow-inner focus:ring-2 focus:ring-bordeaux-800 transition-all outline-none" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Devolución</label>
                      <input type="date" value={formData.fin} min={formData.inicio} onChange={(e) => setFormData({...formData, fin: e.target.value})} className="w-full px-6 py-5 bg-gray-50 border-0 rounded-[2rem] font-bold text-sm shadow-inner focus:ring-2 focus:ring-bordeaux-800 transition-all outline-none" />
                    </div>
                  </div>
                  
                  {/* Duration Validation & Policy */}
                  <div className={`p-4 rounded-2xl border transition-all ${!isPeriodValid ? 'bg-red-50 border-red-100 text-red-700' : 'bg-gold/5 border-gold/10 text-bordeaux-800'}`}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={18} />
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        {!isPeriodValid ? 'Duración mínima: 1 Día' : 'Reserva No Reembolsable'}
                      </p>
                    </div>
                    {isPeriodValid && (
                      <p className="text-[9px] font-medium mt-1 opacity-70">
                        Los periodos de reserva confirmados no admiten reembolsos por cancelación.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                  <h4 className="text-[10px] font-black text-bordeaux-950 uppercase tracking-[0.4em] flex items-center gap-4">
                    <User size={20} className="text-gold" /> Datos del Titular
                  </h4>
                  <div className="space-y-5">
                    <input type="text" placeholder="Nombre completo" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} className="w-full px-8 py-5 bg-gray-50 border-0 rounded-[2rem] font-bold text-sm shadow-inner focus:ring-2 focus:ring-bordeaux-800 transition-all outline-none" />
                    <div className="relative">
                       <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                       <input type="email" placeholder="Email corporativo" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-16 pr-8 py-5 bg-gray-50 border-0 rounded-[2rem] font-bold text-sm shadow-inner focus:ring-2 focus:ring-bordeaux-800 transition-all outline-none" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <input type="text" placeholder="CI / RUC No." value={formData.ci} onChange={(e) => setFormData({...formData, ci: e.target.value})} className="w-full px-8 py-5 bg-gray-50 border-0 rounded-[2rem] font-bold text-sm shadow-inner focus:ring-2 focus:ring-bordeaux-800 transition-all outline-none" />
                      <input type="tel" placeholder="WhatsApp / Celular" value={formData.celular} onChange={(e) => setFormData({...formData, celular: e.target.value})} className="w-full px-8 py-5 bg-gray-50 border-0 rounded-[2rem] font-bold text-sm shadow-inner focus:ring-2 focus:ring-bordeaux-800 transition-all outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {!isAvailable && (
                <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2.5rem] flex items-center gap-6 text-red-700 animate-shake">
                  <Info size={36} className="shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest mb-1">Conflicto Detectado</p>
                    <p className="text-xs font-medium opacity-80 leading-relaxed">La unidad ya cuenta con una reserva confirmada para este periodo. Por favor, ajuste las fechas.</p>
                  </div>
                </div>
              )}

              <div className="bg-white p-10 md:p-16 rounded-[4rem] border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-12 shadow-2xl">
                <div className="text-center lg:text-left space-y-6">
                  <p className="text-[11px] font-black text-bordeaux-800 uppercase tracking-[0.6em]">Esquema de Liquidación</p>
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                     <button onClick={() => setFormData({...formData, paymentType: 'Full'})} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.paymentType === 'Full' ? 'bg-bordeaux-800 text-white shadow-xl scale-105' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>Totalidad</button>
                     <button onClick={() => setFormData({...formData, paymentType: 'OneDay'})} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.paymentType === 'OneDay' ? 'bg-bordeaux-800 text-white shadow-xl scale-105' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>Seña (1 Día)</button>
                  </div>
                  <div className="flex items-baseline gap-4 pt-2 justify-center lg:justify-start">
                    <h3 className="text-5xl md:text-7xl font-black text-bordeaux-950 tracking-tighter">R$ {bookingTotalBRL}</h3>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">{formData.paymentType === 'Full' ? `${days} Días` : 'Reserva Unidad'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  disabled={!formData.cliente || !formData.ci || !isAvailable || !isPeriodValid}
                  className="w-full lg:w-auto bordeaux-gradient text-white px-16 py-8 rounded-[3rem] font-black text-xs uppercase tracking-[0.6em] shadow-2xl active:scale-95 disabled:opacity-30 flex items-center justify-center gap-6"
                >
                  Confirmar Detalles <ChevronRight size={24} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12 animate-fadeIn max-w-5xl mx-auto">
              <ContractDocument vehicle={vehicle} data={{...formData, total: fullTotalBRL}} days={days} totalPYG={fullTotalBRL * exchangeRate} signature={signature || undefined} />
              <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-10 text-center">
                 <PenTool className="mx-auto text-gold mb-4" size={50} />
                 <div className="space-y-3">
                    <h4 className="text-2xl font-serif font-bold text-bordeaux-950">Firma Electrónica Autorizada</h4>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">Al firmar digitalmente, acepta la responsabilidad civil y penal sobre la unidad alquilada.</p>
                 </div>
                 <button 
                    onClick={() => { setSignature(`Firmado por ${formData.cliente}`); setStep(3); }} 
                    className="w-full bg-bordeaux-800 text-white py-10 rounded-[3rem] font-black text-xs uppercase tracking-[0.6em] shadow-2xl hover:bg-bordeaux-950 transition-all active:scale-95"
                  >
                    Estampar Firma y Proceder
                  </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-12 animate-fadeIn text-center max-w-3xl mx-auto py-10">
               <div className="w-28 h-28 bg-gold/10 rounded-[3.5rem] flex items-center justify-center mx-auto text-gold mb-8 border border-gold/10 shadow-inner">
                  <CreditCard size={56} />
               </div>
               <h3 className="text-4xl font-serif font-bold text-bordeaux-950">Liquidación Bancaria</h3>
               
               <div className="p-12 bg-white border border-gray-100 rounded-[4rem] space-y-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 gold-shine"></div>
                  <div className="space-y-8">
                    <p className="text-[11px] font-black text-gold uppercase tracking-[0.8em]">Llave PIX JM Asociados</p>
                    <code className="text-4xl md:text-6xl font-black text-bordeaux-800 block tracking-tight">24510861818</code>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Titular: Marina Baez &bull; Gestión Administrativa</p>
                  </div>
                  <button onClick={handleCopyPix} className={`w-full py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] transition-all active:scale-95 flex items-center justify-center gap-6 shadow-xl ${copied ? 'bg-green-600 text-white scale-105' : 'bg-bordeaux-950 text-white hover:bg-black'}`}>
                    {copied ? <><Check size={28}/> ¡Llave Copiada!</> : <><Copy size={24}/> Copiar Llave Bancaria</>}
                  </button>
               </div>

               <div className="space-y-8 text-left px-4">
                  <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.6em] flex items-center gap-4 ml-6">
                    <Upload size={24} className="text-gold" /> Adjuntar Comprobante (Captura)
                  </h4>
                  <label className={`group flex flex-col items-center justify-center min-h-[400px] rounded-[4.5rem] border-4 border-dashed transition-all cursor-pointer shadow-inner relative overflow-hidden ${
                    receiptBase64 ? 'bg-green-50 border-green-500/30' : 'bg-gray-50 border-gray-200 hover:border-gold/50'
                  }`}>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                       const f = e.target.files?.[0];
                       if(f) { const r = new FileReader(); r.onloadend = () => setReceiptBase64(r.result as string); r.readAsDataURL(f); }
                    }} />
                    {receiptBase64 ? (
                      <div className="flex flex-col items-center gap-10 animate-fadeIn text-center p-12">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl">
                          <Check size={48} />
                        </div>
                        <p className="text-sm font-black text-green-700 uppercase tracking-[0.4em]">Documento Adjunto Correctamente</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-10">
                        <div className="w-28 h-28 bg-white rounded-[3rem] flex items-center justify-center text-gray-200 shadow-xl border border-gray-50 group-hover:scale-110 transition-transform">
                          <Upload size={52} />
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-[1em]">Cargar Comprobante</p>
                      </div>
                    )}
                  </label>
               </div>

               <button onClick={handleFinalConfirm} disabled={!receiptBase64} className="w-full bordeaux-gradient text-white py-12 rounded-[3.5rem] font-black text-sm uppercase tracking-[0.8em] shadow-[0_40px_80px_-20px_rgba(128,0,0,0.6)] disabled:opacity-30 transition-all active:scale-95 mt-10">Finalizar Reserva de Unidad</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
