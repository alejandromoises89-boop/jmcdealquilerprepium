
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vehicle, Reservation } from '../types';
import { TRANSLATIONS, Language, CONTRACT_CLAUSES } from '../constants';
import { 
  X, ChevronRight, Upload, ChevronLeft, Copy, 
  CheckCircle2, MessageCircle, Landmark, BadgeCheck, 
  Loader2, Eraser, CreditCard, QrCode, Calendar as CalendarIcon, User, FileText,
  DollarSign, Smartphone, Zap, ShieldCheck, Wallet, 
  LayoutDashboard, CreditCard as CardIcon, Check, Building2, Banknote
} from 'lucide-react';

const SignaturePad: React.FC<{ onSave: (dataUrl: string) => void; onClear: () => void; lang: Language }> = ({ onSave, onClear, lang }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#800000';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas.toDataURL());
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-white border-2 border-gold/20 rounded-3xl overflow-hidden touch-none shadow-inner">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className="w-full h-[180px] cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        <button onClick={() => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
          onClear();
        }} className="absolute top-4 right-4 p-3 bg-red-50 text-red-600 rounded-full shadow-lg">
          <Eraser size={18} />
        </button>
      </div>
      <p className="text-[8px] font-black text-gold uppercase tracking-widest text-center italic">Firma requerida Protocolo JM</p>
    </div>
  );
};

const BookingModal: React.FC<{
  vehicle: Vehicle;
  exchangeRate: number;
  reservations: Reservation[];
  onClose: () => void;
  onSubmit: (res: Reservation) => void;
  language?: Language;
  initialDates?: { start: Date; end: Date };
}> = ({ vehicle, exchangeRate, reservations, onClose, onSubmit, language = 'es', initialDates }) => {
  const [step, setStep] = useState(1);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reservationId] = useState<string>(`${Math.floor(100000 + Math.random() * 900000)}`);
  const [showToast, setShowToast] = useState(false);
  
  const [formData, setFormData] = useState({
    cliente: '', celular: '', ci: '', inicio: initialDates ? initialDates.start.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    fin: initialDates ? initialDates.end.toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0],
    horaIni: '08:00', horaFin: '17:00', contractRead: false, signature: ''
  });
  
  const [licenseBase64, setLicenseBase64] = useState<string | null>(null);
  const [paymentBase64, setPaymentBase64] = useState<string | null>(null);

  const totalDays = useMemo(() => {
    const start = new Date(`${formData.inicio}T${formData.horaIni}`);
    const end = new Date(`${formData.fin}T${formData.horaFin}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(1, Math.ceil(diffHours / 24));
  }, [formData.inicio, formData.horaIni, formData.fin, formData.horaFin]);

  const contractTotalBRL = totalDays * vehicle.precio;
  const paymentAmountPYG = Math.round(contractTotalBRL * exchangeRate);

  const formatToParaguayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleNext = () => {
    if (step === 3) {
       const inicioFormat = formatToParaguayDate(formData.inicio);
       const finFormat = formatToParaguayDate(formData.fin);
 
       const newRes: Reservation = {
         id: `JM-${reservationId}`, 
         cliente: formData.cliente.toUpperCase(), 
         email: 'online@jmasociados.com', 
         ci: formData.ci,
         documentType: 'CI', 
         celular: formData.celular, 
         auto: vehicle.nombre,
         inicio: `${inicioFormat} ${formData.horaIni}`, 
         fin: `${finFormat} ${formData.horaFin}`,
         total: contractTotalBRL, 
         status: 'Confirmed', 
         driverLicense: licenseBase64 || undefined, 
         signature: formData.signature || undefined,
         comprobante: paymentBase64 || undefined,
         includeInCalendar: true, 
         contractAccepted: formData.contractRead
       };
       
       onSubmit(newRes);
       setStep(4);
       setShowToast(true);
       setTimeout(() => setShowToast(false), 5000);
    } else {
      setStep(step + 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'receipt') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (type === 'receipt') {
      setIsProcessingReceipt(true);
      setUploadSuccess(false);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'license') {
         setLicenseBase64(reader.result as string);
      } else {
        setPaymentBase64(reader.result as string);
        setTimeout(() => {
           setIsProcessingReceipt(false);
           setUploadSuccess(true);
        }, 1500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const waMessage = useMemo(() => {
     const text = `✨ *JM ASOCIADOS - ALQUILER EXITOSO* ✨\n` +
                  `Hola *${formData.cliente}*, Tu reserva para el vehículo *${vehicle.nombre}* ha sido validada. Ya puedes retirar la unidad.\n` +
                  `🆔Comprobante de pago:JM-${reservationId}\n` +
                  `📅Inicio: *${formatToParaguayDate(formData.inicio)}*\n` +
                  `¡Gracias por confiar en JM Asociados!`;
     return encodeURIComponent(text);
  }, [formData.cliente, vehicle.nombre, reservationId, formData.inicio]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-dark-base/90 backdrop-blur-2xl p-0 md:p-6 overflow-hidden">
      {showToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[300] animate-slideUp">
           <div className="bg-emerald-900/90 backdrop-blur-xl text-white pl-6 pr-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-5 border border-emerald-500/30 ring-4 ring-emerald-900/20">
              <div className="bg-emerald-500 p-3 rounded-full shadow-lg shadow-emerald-500/40">
                 <CheckCircle2 size={24} className="text-white animate-bounce" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-emerald-200 uppercase tracking-[0.2em] mb-0.5">Operación Exitosa</p>
                 <p className="text-sm font-bold text-white tracking-tight italic">¡Reserva confirmada y pago recibido!</p>
              </div>
           </div>
        </div>
      )}

      <div className="relative bg-white dark:bg-dark-card w-full max-w-xl h-[94vh] md:h-auto md:max-h-[96vh] rounded-t-[4rem] md:rounded-[4.5rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp border-t-[10px] border-gold">
        
        <div className="px-8 py-6 border-b dark:border-white/5 shrink-0 bg-gray-50/20">
          <div className="flex items-center justify-between">
            <button onClick={() => step > 1 && step < 4 && setStep(step - 1)} className={`p-4 text-gold ${step === 1 || step === 4 ? 'invisible' : ''}`}><ChevronLeft size={20}/></button>
            <div className="text-center">
              <p className="text-[8px] font-black text-gold uppercase tracking-[0.5em] mb-1 italic">JM Platinum Access 2026</p>
              <h2 className="text-sm font-robust dark:text-white italic uppercase tracking-tighter">Fase de Reserva {step} / 4</h2>
            </div>
            <button onClick={onClose} className="p-4 text-gray-300 hover:text-red-500"><X size={20}/></button>
          </div>
          <div className="flex gap-2 mt-4 px-12">
             {[1,2,3,4].map(s => <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${step >= s ? 'bordeaux-gradient shadow-sm shadow-bordeaux-800' : 'bg-gray-100 dark:bg-dark-base'}`}></div>)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
           
           {step === 1 && (
             <div className="space-y-8 animate-fadeIn">
                <div className="bg-gray-50 dark:bg-dark-elevated p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-inner">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] flex items-center gap-2 italic"><CalendarIcon size={14}/> Agenda de Retiro</span>
                      <span className="px-4 py-1.5 bg-bordeaux-800 text-white rounded-full text-[9px] font-black">{totalDays} Días</span>
                   </div>
                   <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                         <label className="text-[8px] font-black text-gray-400 uppercase ml-2 tracking-widest">Desde</label>
                         <input type="date" value={formData.inicio} onChange={(e) => setFormData({...formData, inicio: e.target.value})} className="w-full bg-white dark:bg-dark-base rounded-2xl px-4 py-3 text-[11px] font-black outline-none border border-transparent focus:border-gold/30 shadow-sm dark:text-white" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[8px] font-black text-gray-400 uppercase ml-2 tracking-widest">Hasta</label>
                         <input type="date" value={formData.fin} onChange={(e) => setFormData({...formData, fin: e.target.value})} className="w-full bg-white dark:bg-dark-base rounded-2xl px-4 py-3 text-[11px] font-black outline-none border border-transparent focus:border-gold/30 shadow-sm dark:text-white" />
                      </div>
                   </div>
                   <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-200 dark:border-white/10">
                      <span className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">Valorización de Estadía:</span>
                      <span className="text-lg font-robust text-bordeaux-950 dark:text-white italic tracking-tighter">R$ {contractTotalBRL.toLocaleString()}</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 mb-1"><User size={16} className="text-gold"/><span className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Identificación del Conductor</span></div>
                   <input type="text" placeholder="Nombre Completo (Socio)" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-[2rem] px-8 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-gold/20 shadow-sm" />
                   <div className="grid grid-cols-2 gap-4">
                       <input type="text" placeholder="Documento ID" value={formData.ci} onChange={(e) => setFormData({...formData, ci: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-[2rem] px-8 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-gold/20 shadow-sm" />
                       <input type="tel" placeholder="Contacto / WhatsApp" value={formData.celular} onChange={(e) => setFormData({...formData, celular: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-[2rem] px-8 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-gold/20 shadow-sm" />
                   </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest italic">Captura de Licencia de Conducir</label>
                    <label className="flex items-center gap-6 w-full p-6 bg-gray-50 dark:bg-dark-base border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2.5rem] cursor-pointer hover:border-gold transition-all duration-300">
                       <div className="bg-white dark:bg-dark-elevated p-4 rounded-2xl text-gold shadow-lg ring-4 ring-gold/5"><Upload size={22} strokeWidth={1.5}/></div>
                       <div className="flex-1">
                          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest italic">{licenseBase64 ? 'Documento Digitalizado' : 'Adjuntar Frente'}</p>
                          <p className="text-[8px] text-gray-300 mt-0.5 uppercase">Máximo 10MB - JPG/PNG</p>
                       </div>
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'license')} />
                       {licenseBase64 && <CheckCircle2 size={24} className="text-emerald-500" />}
                    </label>
                 </div>
             </div>
           )}

           {step === 2 && (
              <div className="space-y-8 animate-fadeIn">
                 <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-bordeaux-50 dark:bg-bordeaux-900/20 rounded-2xl text-bordeaux-800 dark:text-gold shadow-sm"><FileText size={22}/></div>
                    <div className="text-left">
                       <h3 className="text-lg font-robust dark:text-white italic tracking-tight uppercase">Protocolo de Arrendamiento</h3>
                       <p className="text-[8px] font-black text-gold uppercase tracking-[0.3em] italic">Validez MERCOSUR 2026</p>
                    </div>
                 </div>
                 
                 <div className="bg-gray-50 dark:bg-dark-base p-8 rounded-[2.5rem] h-72 overflow-y-auto space-y-4 border border-gray-100 dark:border-white/5 scrollbar-thin text-justify shadow-inner">
                    <div className="sticky top-0 bg-gray-50 dark:bg-dark-base pb-3 border-b border-gold/10 flex justify-between items-center">
                       <h4 className="text-[10px] font-black uppercase text-gold tracking-[0.4em] italic">Cláusulas de Seguridad</h4>
                       <ShieldCheck size={14} className="text-gold" />
                    </div>
                    {CONTRACT_CLAUSES.map((c, i) => (
                       <p key={i} className="text-[10px] text-gray-500 font-medium leading-relaxed pb-3 border-b border-gray-200 dark:border-white/5 last:border-0">{i+1}. {c}</p>
                    ))}
                 </div>

                 <SignaturePad onSave={(s) => setFormData({...formData, signature: s})} onClear={() => setFormData({...formData, signature: ''})} lang={language} />

                 <label className="flex items-center gap-4 p-5 bg-gold/5 rounded-[2.5rem] border border-gold/30 cursor-pointer hover:bg-gold/10 transition-all duration-300 group">
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${formData.contractRead ? 'bg-gold border-gold shadow-lg shadow-gold/30' : 'border-gray-200 bg-white dark:bg-dark-base'}`}>
                       {formData.contractRead && <Check size={18} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.contractRead} onChange={() => setFormData({...formData, contractRead: !formData.contractRead})} />
                    <span className="text-[10px] font-black uppercase text-bordeaux-950 dark:text-white tracking-[0.2em] italic group-hover:translate-x-1 transition-transform">Declaración: He leído y acepto el protocolo</span>
                 </label>
              </div>
           )}

           {step === 3 && (
              <div className="space-y-10 animate-fadeIn">
                 {/* High Visibility Payment Summary Card */}
                 <div className="relative group overflow-hidden bordeaux-gradient p-1 rounded-[4rem] shadow-2xl border-2 border-gold/50">
                    <div className="absolute top-[-30%] right-[-15%] w-56 h-56 bg-white/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
                    <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3.8rem] text-center space-y-6">
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[11px] font-black text-gold uppercase tracking-[0.5em] italic">Liquidación de Reserva JM</p>
                            <div className="w-20 h-0.5 bg-gold/40 rounded-full"></div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col items-center justify-center">
                               <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1 italic">Monto en Reales (Base)</p>
                               <div className="flex items-baseline gap-4">
                                  <span className="text-3xl text-gold font-robust italic tracking-tighter">R$</span>
                                  <h3 className="text-6xl font-robust text-white italic tracking-tighter leading-none">{contractTotalBRL.toLocaleString()}</h3>
                               </div>
                            </div>
                            <div className="bg-black/40 py-5 px-12 rounded-[2.5rem] flex flex-col items-center gap-2 border border-white/20 shadow-2xl backdrop-blur-md ring-2 ring-gold/10 scale-105">
                               <p className="text-[8px] font-black text-gold/80 uppercase tracking-[0.3em] italic">Total en Guaraníes (DNIT)</p>
                               <div className="flex items-center gap-3">
                                 <Zap size={18} className="text-gold animate-pulse" />
                                 <span className="text-3xl font-robust text-gold tracking-tight italic uppercase">Gs. {paymentAmountPYG.toLocaleString()}</span>
                               </div>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Premium Bank Options with Clear Branding */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 px-6">
                        <Building2 size={16} className="text-gold" />
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] italic">Cuentas Bancarias JM</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Santander Card (Brazil) */}
                        <div className="bg-white dark:bg-dark-elevated rounded-[3rem] p-8 border-2 border-red-100 dark:border-red-900/20 shadow-xl relative overflow-hidden group hover:border-red-500 transition-all duration-500">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
                           <div className="relative flex flex-col h-full space-y-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 bg-red-600 rounded-[1.4rem] flex items-center justify-center text-white shadow-xl shadow-red-200 dark:shadow-red-950/40 ring-4 ring-white">
                                    <span className="font-robust italic text-xl">S</span>
                                 </div>
                                 <div className="text-left">
                                    <h4 className="text-lg font-robust text-red-700 dark:text-red-400 tracking-tight uppercase italic">Santander PIX</h4>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Protocolo Real (BRL)</p>
                                 </div>
                              </div>
                              <div className="bg-red-50/50 dark:bg-red-900/10 px-5 py-4 rounded-2xl border border-red-100 dark:border-red-800/30 flex items-center justify-between shadow-inner group-hover:bg-red-100/50 transition-colors">
                                 <p className="font-mono text-[12px] font-bold text-red-800 dark:text-red-300 tracking-wider">jm@santander.com</p>
                                 <button onClick={() => handleCopy("jm@santander.com")} className="text-red-600 hover:text-red-800 transition-all p-2 bg-white dark:bg-dark-card rounded-lg shadow-sm active:scale-90"><Copy size={16}/></button>
                              </div>
                              <button onClick={() => handleCopy("jm@santander.com")} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] italic hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none flex items-center justify-center gap-3">
                                 <QrCode size={16} /> COPIAR PIX JM
                              </button>
                           </div>
                        </div>

                        {/* Ueno Card (Paraguay) */}
                        <div className="bg-white dark:bg-dark-elevated rounded-[3rem] p-8 border-2 border-[#00e36b]/10 dark:border-[#00e36b]/20 shadow-xl relative overflow-hidden group hover:border-[#00e36b] transition-all duration-500">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e36b]/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
                           <div className="relative flex flex-col h-full space-y-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 bg-black dark:bg-[#00e36b] rounded-[1.4rem] flex items-center justify-center text-[#00e36b] dark:text-black shadow-xl shadow-green-200 dark:shadow-green-950/40 ring-4 ring-white">
                                    <Smartphone size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h4 className="text-lg font-robust text-gray-800 dark:text-white tracking-tight uppercase italic">Ueno Bank</h4>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Protocolo Guaraní (Gs.)</p>
                                 </div>
                              </div>
                              <div className="bg-[#00e36b]/10 dark:bg-[#00e36b]/5 px-5 py-4 rounded-2xl border border-[#00e36b]/20 dark:border-[#00e36b]/10 flex items-center justify-between shadow-inner group-hover:bg-[#00e36b]/20 transition-colors">
                                 <p className="font-mono text-[12px] font-bold text-gray-800 dark:text-gray-300 tracking-wider">600-987654-3</p>
                                 <button onClick={() => handleCopy("600-987654-3")} className="text-[#00e36b] hover:text-[#00c95f] transition-all p-2 bg-white dark:bg-dark-card rounded-lg shadow-sm active:scale-90"><Copy size={16}/></button>
                              </div>
                              <button onClick={() => handleCopy("600-987654-3")} className="w-full py-4 bg-black dark:bg-[#00e36b] text-[#00e36b] dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] italic hover:bg-gray-900 transition-all shadow-lg shadow-green-200 dark:shadow-none flex items-center justify-center gap-3">
                                 <Smartphone size={16} /> COPIAR CUENTA JM
                              </button>
                           </div>
                        </div>
                    </div>
                 </div>

                 {/* Prominent Upload Section with Visual Feedback */}
                 <div className="space-y-6 pt-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-6 flex items-center gap-3 italic">
                       <Banknote size={16} className="text-gold" /> Validación de Pago
                    </label>
                    
                    <label className={`relative w-full p-16 flex flex-col items-center justify-center border-4 border-dashed rounded-[4.5rem] cursor-pointer transition-all duration-1000 group overflow-hidden ${uploadSuccess ? 'border-emerald-500 bg-emerald-50/20 shadow-emerald-200/50' : 'border-gray-200 dark:border-white/10 hover:border-gold hover:bg-gold/5 shadow-2xl shadow-gray-200/50 dark:shadow-none ring-8 ring-transparent hover:ring-gold/5'}`}>
                       
                       <div className={`absolute inset-0 bordeaux-gradient flex flex-col items-center justify-center transition-transform duration-1000 ease-in-out z-40 ${uploadSuccess ? 'translate-y-0' : 'translate-y-full'}`}>
                          <div className="text-center text-white p-10 animate-slideUp">
                             <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border-4 border-emerald-500 animate-bounce">
                                <Check size={48} className="text-emerald-500" />
                             </div>
                             <p className="text-3xl font-robust italic uppercase tracking-widest leading-none">¡Pago Validado!</p>
                             <div className="flex items-center justify-center gap-3 mt-6">
                                <BadgeCheck size={16} className="text-gold" />
                                <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] italic">Generando Protocolo Final</p>
                             </div>
                          </div>
                       </div>

                       <div className={`transition-all duration-700 flex flex-col items-center ${uploadSuccess ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                          <div className={`w-36 h-36 rounded-[3.2rem] flex items-center justify-center shadow-2xl mb-10 transition-all relative ${isProcessingReceipt ? 'bg-gold text-white shadow-gold/40' : 'bg-white dark:bg-dark-elevated text-gold group-hover:scale-110 group-hover:rotate-6 ring-[12px] ring-gold/5'}`}>
                             {isProcessingReceipt ? (
                                <div className="relative flex flex-col items-center">
                                    <Loader2 size={64} className="animate-spin text-white" />
                                    <Smartphone className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/30" size={18} />
                                </div>
                             ) : (
                                <>
                                    <Upload size={64} strokeWidth={1} className="group-hover:translate-y-[-5px] transition-transform" />
                                    <div className="absolute -top-4 -right-4 bg-bordeaux-800 text-gold p-3 rounded-full shadow-2xl border-4 border-white animate-pulse">
                                        <ShieldCheck size={20} />
                                    </div>
                                </>
                             )}
                          </div>
                          <div className="text-center space-y-4">
                             <p className="text-2xl font-robust italic uppercase tracking-widest text-bordeaux-950 dark:text-white group-hover:text-gold transition-colors">
                                {isProcessingReceipt ? 'Analizando Comprobante...' : 'SUBIR COMPROBANTE JM'}
                             </p>
                             <div className="flex items-center justify-center gap-4 bg-gray-50 dark:bg-white/5 py-3 px-6 rounded-full border border-gray-100 dark:border-white/5">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">PDF / JPG / PNG</span>
                                <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">Max 15MB</span>
                             </div>
                          </div>
                       </div>
                       
                       <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'receipt')} disabled={isProcessingReceipt || uploadSuccess} />
                    </label>
                 </div>
              </div>
           )}

           {step === 4 && (
              <div className="text-center py-10 space-y-10 animate-fadeIn">
                 <div className="w-28 h-28 bg-emerald-100 dark:bg-emerald-950/40 rounded-[2.5rem] flex items-center justify-center mx-auto text-emerald-600 shadow-xl shadow-emerald-200/50 animate-bounce ring-8 ring-emerald-50 dark:ring-emerald-900/10">
                    <BadgeCheck size={56} />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-robust text-bordeaux-950 dark:text-white italic tracking-tight uppercase">¡Protocolo Finalizado!</h3>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-10 italic">Unidad bloqueada con éxito. El equipo JM ha validado su acceso premium.</p>
                 </div>
                 
                 <div className="relative group p-1 bordeaux-gradient rounded-[3rem] shadow-2xl inline-block overflow-hidden">
                    <div className="bg-white dark:bg-dark-card px-12 py-8 rounded-[2.8rem] text-center border-2 border-gold/10">
                        <p className="text-[10px] font-black text-gold uppercase tracking-[0.5em] mb-3 italic">Ticket de Seguridad</p>
                        <div className="flex items-center justify-center gap-4">
                           <LayoutDashboard size={28} className="text-gray-300" />
                           <p className="text-4xl font-robust text-gray-800 dark:text-white tracking-[0.2em] italic">JM-{reservationId}</p>
                        </div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-4 max-w-sm mx-auto">
                    <button 
                       className="w-full py-6 bg-emerald-500 text-white rounded-full font-black text-[11px] uppercase tracking-[0.4em] italic flex items-center justify-center gap-4 hover:bg-emerald-600 hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-emerald-500/40" 
                       onClick={() => window.open(`https://wa.me/595991681191?text=${waMessage}`)}
                    >
                       <MessageCircle size={22} /> Enviar a WhatsApp JM
                    </button>
                    <button onClick={onClose} className="w-full py-5 bg-gray-50 dark:bg-dark-elevated text-gray-400 rounded-full font-black text-[10px] uppercase tracking-widest italic hover:text-bordeaux-800 transition-colors">
                       Finalizar Protocolo 
                    </button>
                 </div>
              </div>
           )}

        </div>

        {/* Footer Navigation Pill */}
        <div className="p-8 md:p-10 border-t dark:border-white/5 bg-gray-50/40 dark:bg-dark-base shrink-0">
           {step < 4 && (
              <button 
                 onClick={handleNext} 
                 disabled={
                    (step === 1 && (!formData.cliente || !formData.ci || !formData.celular || !licenseBase64)) ||
                    (step === 2 && (!formData.contractRead || !formData.signature)) ||
                    (step === 3 && !uploadSuccess)
                 }
                 className={`w-full py-6 rounded-full font-robust text-[12px] uppercase tracking-[0.4em] italic shadow-2xl transition-all flex items-center justify-center gap-4 ${
                    ((step === 1 && formData.cliente && formData.ci && formData.celular && licenseBase64) || 
                     (step === 2 && formData.contractRead && formData.signature) || 
                     (step === 3 && uploadSuccess))
                    ? 'bordeaux-gradient text-white hover:scale-[1.02] active:scale-95' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                 }`}
              >
                 {step === 3 ? 'Finalizar Reserva JM' : 'Siguiente Protocolo'} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
           )}
        </div>

      </div>
    </div>
  );
};

export default BookingModal;
