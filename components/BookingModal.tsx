
import React, { useState, useEffect } from 'react';
import { Vehicle, Reservation } from '../types';
import { 
  X, Calendar, ChevronRight, Upload, 
  Copy, Check, ShieldCheck, User, CreditCard, ArrowLeft, PenTool,
  Mail, Info, AlertTriangle, ArrowLeftCircle, Image as ImageIcon, Sparkles
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
  const diffInMs = endDateTime.getTime() - startDateTime.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const days = Math.max(1, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  
  const isPeriodValid = diffInHours >= 24;
  const fullTotalBRL = isPeriodValid ? days * vehicle.precio : 0;
  const bookingTotalBRL = formData.paymentType === 'Full' ? fullTotalBRL : vehicle.precio;

  useEffect(() => {
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
  }, [formData.inicio, formData.fin, formData.horaIni, formData.horaFin, reservations, vehicle.nombre, startDateTime, endDateTime]);

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
      comprobante: receiptBase64 || undefined,
      status: 'Confirmed'
    };
    onSubmit(newReservation);
    const waText = `*JM ASOCIADOS - NUEVA RESERVA*\n🚗 Unidad: ${vehicle.nombre}\n👤 Cliente: ${formData.cliente}\n📅 Desde: ${formData.inicio} ${formData.horaIni}\n📅 Hasta: ${formData.fin} ${formData.horaFin}\n💰 Total: R$ ${fullTotalBRL}`;
    window.open(`https://wa.me/595991681191?text=${encodeURIComponent(waText)}`, '_blank');
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert("Formatos admitidos: JPG o PNG.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setReceiptBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bordeaux-950/98 backdrop-blur-3xl p-0 sm:p-4 md:p-12 overflow-y-auto airbnb-scrollbar">
      <div className="relative bg-white w-full max-w-6xl min-h-screen sm:min-h-0 sm:max-h-[95vh] sm:rounded-[3rem] md:rounded-[4.5rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp border border-white/20">
        
        <div className="bg-white border-b border-gray-100 px-6 md:px-14 py-6 md:py-8 flex justify-between items-center sticky top-0 z-[110]">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="p-2 md:p-3 bg-bordeaux-50 rounded-xl md:rounded-2xl shrink-0">
                <img src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" className="h-6 md:h-10 w-auto" alt="Logo" />
             </div>
             <div className="flex flex-col min-w-0">
                <h2 className="text-[11px] md:text-[14px] font-black text-bordeaux-950 uppercase tracking-[0.3em] md:tracking-[0.5em] truncate">
                   Reserva Ejecutiva
                </h2>
                <span className="text-[8px] md:text-[9px] font-black text-gold uppercase tracking-[0.2em] md:tracking-[0.4em]">Corporate Mobility Excellence</span>
             </div>
          </div>
          
          <button 
             onClick={onClose}
             className="p-3 md:p-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl md:rounded-[1.5rem] transition-all flex items-center justify-center shadow-lg active:scale-90"
          >
             <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-16 lg:p-24 space-y-8 md:space-y-12 pb-32 bg-gray-50/15">
          
          <div className="flex items-center justify-between">
            <button 
              onClick={step > 1 ? () => setStep(step - 1) : onClose}
              className="group flex items-center gap-3 text-bordeaux-950 font-black text-[10px] md:text-[12px] uppercase tracking-[0.4em] active:scale-95 transition-all"
            >
              <ArrowLeftCircle size={24} className="md:w-8 md:h-8 text-bordeaux-800" /> 
              <span>{step === 1 ? 'Volver' : 'Atrás'}</span>
            </button>
            <div className="flex gap-2 md:gap-4">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-2 md:h-2.5 w-10 md:w-24 rounded-full transition-all duration-700 ${step >= s ? 'bordeaux-gradient shadow-lg shadow-bordeaux-950/20' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>

          <div className="bordeaux-gradient text-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl relative overflow-hidden border border-white/10">
             <div className="relative z-10 space-y-3 md:space-y-4">
                <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] md:tracking-[0.8em] opacity-70">Operativo JM 2026</p>
                <h4 className="text-2xl md:text-5xl font-serif font-bold tracking-tight">
                  {step === 1 ? 'Periodo y Titularidad' : step === 2 ? 'Contrato de Arrendamiento' : 'Liquidación Bancaria'}
                </h4>
             </div>
          </div>

          {step === 1 && (
            <div className="space-y-8 md:space-y-12 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
                <div className="bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-gray-100 shadow-xl space-y-10 md:space-y-14">
                  <h4 className="text-[11px] md:text-[13px] font-black text-bordeaux-950 uppercase tracking-[0.5em] flex items-center gap-4">
                    <Calendar size={22} className="md:w-7 md:h-7 text-gold" /> Ventana Temporal
                  </h4>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                       <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Entrega</label>
                        <input type="date" value={formData.inicio} min="2026-01-01" onChange={(e) => setFormData({...formData, inicio: e.target.value})} className="w-full px-5 py-5 md:px-8 md:py-6 bg-gray-50 border-0 rounded-3xl font-bold text-sm shadow-inner outline-none focus:ring-4 focus:ring-bordeaux-50" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Hora</label>
                        <input type="time" value={formData.horaIni} onChange={(e) => setFormData({...formData, horaIni: e.target.value})} className="w-full px-5 py-5 md:px-8 md:py-6 bg-gray-50 border-0 rounded-3xl font-bold text-sm shadow-inner outline-none focus:ring-4 focus:ring-bordeaux-50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Retorno</label>
                        <input type="date" value={formData.fin} min={formData.inicio} onChange={(e) => setFormData({...formData, fin: e.target.value})} className="w-full px-5 py-5 md:px-8 md:py-6 bg-gray-50 border-0 rounded-3xl font-bold text-sm shadow-inner outline-none focus:ring-4 focus:ring-bordeaux-50" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Hora</label>
                        <input type="time" value={formData.horaFin} onChange={(e) => setFormData({...formData, horaFin: e.target.value})} className="w-full px-5 py-5 md:px-8 md:py-6 bg-gray-50 border-0 rounded-3xl font-bold text-sm shadow-inner outline-none focus:ring-4 focus:ring-bordeaux-50" />
                      </div>
                    </div>
                  </div>
                  {!isAvailable && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-pulse">
                      <AlertTriangle size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Unidad no disponible en estas fechas</span>
                    </div>
                  )}
                </div>

                <div className="bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-gray-100 shadow-xl space-y-10 md:space-y-14">
                  <h4 className="text-[11px] md:text-[13px] font-black text-bordeaux-950 uppercase tracking-[0.5em] flex items-center gap-4">
                    <User size={22} className="md:w-7 md:h-7 text-gold" /> Perfil del Arrendatario
                  </h4>
                  <div className="space-y-6 md:space-y-10">
                    <input type="text" placeholder="Nombre completo" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} className="w-full px-7 py-5 md:px-10 md:py-7 bg-gray-50 border-0 rounded-[2rem] md:rounded-[2.5rem] font-bold text-sm shadow-inner focus:ring-4 focus:ring-bordeaux-50 outline-none" />
                    <input type="email" placeholder="Email de contacto" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-7 py-5 md:px-10 md:py-7 bg-gray-50 border-0 rounded-[2rem] md:rounded-[2.5rem] font-bold text-sm shadow-inner focus:ring-4 focus:ring-bordeaux-50 outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Cédula / RG" value={formData.ci} onChange={(e) => setFormData({...formData, ci: e.target.value})} className="w-full px-5 py-5 bg-gray-50 border-0 rounded-2xl font-bold text-xs shadow-inner focus:ring-2 focus:ring-bordeaux-800 outline-none" />
                      <input type="tel" placeholder="WhatsApp" value={formData.celular} onChange={(e) => setFormData({...formData, celular: e.target.value})} className="w-full px-5 py-5 bg-gray-50 border-0 rounded-2xl font-bold text-xs shadow-inner focus:ring-2 focus:ring-bordeaux-800 outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[5rem] border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-10 md:gap-20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 md:h-2.5 gold-shine opacity-50"></div>
                <div className="text-center lg:text-left space-y-6">
                  <p className="text-[12px] md:text-[14px] font-black text-bordeaux-800 uppercase tracking-[0.6em] md:tracking-[1em]">Liquidación Bancaria</p>
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                     <button onClick={() => setFormData({...formData, paymentType: 'Full'})} className={`px-7 py-3.5 rounded-full font-black text-[10px] md:text-[12px] uppercase tracking-widest transition-all ${formData.paymentType === 'Full' ? 'bg-bordeaux-950 text-white shadow-xl' : 'bg-gray-50 text-gray-400 hover:text-bordeaux-800'}`}>Totalidad</button>
                     <button onClick={() => setFormData({...formData, paymentType: 'OneDay'})} className={`px-7 py-3.5 rounded-full font-black text-[10px] md:text-[12px] uppercase tracking-widest transition-all ${formData.paymentType === 'OneDay' ? 'bg-bordeaux-950 text-white shadow-xl' : 'bg-gray-50 text-gray-400 hover:text-bordeaux-800'}`}>Garantía</button>
                  </div>
                  <h3 className="text-4xl md:text-7xl font-black text-bordeaux-950 tracking-tighter">R$ {bookingTotalBRL}</h3>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  disabled={!formData.cliente || !formData.ci || !isAvailable || !isPeriodValid}
                  className="w-full lg:w-auto bordeaux-gradient text-white px-10 md:px-24 py-7 md:py-10 rounded-[2rem] md:rounded-[4rem] font-black text-sm md:text-lg uppercase tracking-[0.6em] shadow-2xl active:scale-95 disabled:opacity-30 flex items-center justify-center gap-5 transition-all hover:scale-[1.03] hover:shadow-bordeaux-800/50"
                >
                  Continuar <ChevronRight size={28} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 md:space-y-16 animate-fadeIn text-center max-w-4xl mx-auto py-8">
               <div className="w-24 h-24 md:w-36 md:h-36 bg-bordeaux-950 rounded-[2rem] md:rounded-[3.5rem] flex items-center justify-center mx-auto text-gold mb-10 shadow-[0_25px_60px_-15px_rgba(58,11,11,0.6)] border border-white/10">
                  <CreditCard className="w-12 h-12 md:w-20 md:h-20" />
               </div>
               
               <div className="p-8 md:p-20 bg-white border border-gray-100 rounded-[3rem] md:rounded-[5rem] space-y-10 md:space-y-14 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-4 text-gold mb-4">
                       <Sparkles size={20} className="animate-pulse" />
                       <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em]">Llave PIX JM VIP</span>
                       <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <code className="text-2xl md:text-7xl font-black text-bordeaux-950 block tracking-tighter leading-none break-all p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner group-hover:bg-white transition-colors duration-500">24510861818</code>
                    <p className="text-[10px] md:text-[14px] text-gray-400 font-bold uppercase tracking-[0.3em]">Titular: Marina Baez &bull; Gestión Corporativa</p>
                  </div>
                  
                  <button 
                    onClick={handleCopyPix} 
                    className={`w-full py-6 md:py-10 rounded-[1.5rem] md:rounded-[2.5rem] text-[10px] md:text-[14px] font-black uppercase tracking-[0.4em] md:tracking-[0.8em] transition-all duration-700 active:scale-95 flex items-center justify-center gap-6 shadow-xl relative overflow-hidden ${
                      copied 
                      ? 'bg-green-600 text-white scale-[1.02]' 
                      : 'bg-white border-2 border-gold text-bordeaux-950 hover:bg-gold hover:text-white hover:shadow-gold/40'
                    }`}
                  >
                    {copied ? <><Check size={24}/> ¡Llave Copiada!</> : <><Copy size={24}/> Copiar Llave PIX</>}
                  </button>
               </div>

               <div className="space-y-8 text-left px-4 md:px-0">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-bordeaux-50 rounded-2xl flex items-center justify-center text-bordeaux-800">
                       <Upload size={24} />
                    </div>
                    <h4 className="text-[11px] md:text-[14px] font-black text-bordeaux-950 uppercase tracking-[0.4em] md:tracking-[0.6em]">Comprobante de Pago</h4>
                  </div>
                  
                  <label className={`group flex flex-col items-center justify-center min-h-[300px] md:min-h-[450px] rounded-[2.5rem] md:rounded-[4rem] border-4 border-dashed transition-all duration-700 cursor-pointer shadow-inner relative overflow-hidden bg-white ${
                    receiptBase64 ? 'bg-white border-gold/40 shadow-gold/5' : 'bg-gray-50 border-gray-100 hover:border-gold/50'
                  }`}>
                    <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={handleReceiptUpload} />
                    {receiptBase64 ? (
                      <div className="flex flex-col items-center gap-8 animate-fadeIn text-center p-8">
                        <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center text-white shadow-2xl animate-scaleIn">
                          <Check size={40} />
                        </div>
                        <img src={receiptBase64} className="h-40 md:h-64 w-auto rounded-[1.5rem] md:rounded-[2rem] object-cover shadow-2xl border-4 border-white" alt="Preview" />
                        <span className="text-[9px] font-black text-gold uppercase tracking-[0.4em]">Toque para cambiar archivo</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6 text-center">
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-[2rem] flex items-center justify-center text-gray-200 shadow-xl border border-gray-50 group-hover:scale-110 group-hover:text-gold transition-all duration-500">
                          <ImageIcon size={36} md:size={48} />
                        </div>
                        <p className="text-[9px] md:text-sm font-black text-gray-400 uppercase tracking-[0.6em] group-hover:text-bordeaux-800 transition-colors">Adjuntar Comprobante (JPG/PNG)</p>
                      </div>
                    )}
                  </label>
               </div>

               <button 
                  onClick={handleFinalConfirm} 
                  disabled={!receiptBase64} 
                  className="w-full bordeaux-gradient text-white py-8 md:py-14 rounded-[2rem] md:rounded-[4rem] font-black text-xs md:text-xl uppercase tracking-[0.6em] md:tracking-[1.2em] shadow-[0_35px_80px_-20px_rgba(128,0,0,0.5)] disabled:opacity-10 transition-all duration-700 active:scale-95 mt-10 hover:scale-[1.02] hover:shadow-bordeaux-950/60 border border-white/10 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  Finalizar Reserva VIP
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
