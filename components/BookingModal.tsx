
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vehicle, Reservation } from '../types';
import { TRANSLATIONS, Language, CONTRACT_CLAUSES } from '../constants';
import { 
  X, ChevronRight, Upload, ChevronLeft, Copy, 
  CheckCircle2, MessageCircle, Landmark, BadgeCheck, 
  Loader2, Eraser, CreditCard, QrCode, Calendar as CalendarIcon, User, FileText,
  DollarSign
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
      <p className="text-[8px] font-black text-gold uppercase tracking-widest text-center italic">Firma requerida JM Central</p>
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
  const paymentAmountBRL = contractTotalBRL;
  const paymentAmountPYG = Math.round(paymentAmountBRL * exchangeRate);

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
        }, 1500); // Slightly longer delay for effect
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
                 <p className="text-sm font-bold text-white tracking-tight">¡Reserva confirmada y pago recibido!</p>
              </div>
           </div>
        </div>
      )}

      <div className="relative bg-white dark:bg-dark-card w-full max-w-xl h-[92vh] md:h-auto md:max-h-[95vh] rounded-t-[3.5rem] md:rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp border-t-[8px] border-gold">
        
        <div className="px-8 py-5 border-b dark:border-white/5 shrink-0 bg-gray-50/10">
          <div className="flex items-center justify-between">
            <button onClick={() => step > 1 && step < 4 && setStep(step - 1)} className={`p-4 text-gold ${step === 1 || step === 4 ? 'invisible' : ''}`}><ChevronLeft size={20}/></button>
            <div className="text-center">
              <p className="text-[7px] font-black text-gold uppercase tracking-[0.4em] mb-1">Platinum Protocol 3.0</p>
              <h2 className="text-sm font-robust dark:text-white italic uppercase tracking-tighter">Fase {step} de 4</h2>
            </div>
            <button onClick={onClose} className="p-4 text-gray-300 hover:text-red-500"><X size={20}/></button>
          </div>
          <div className="flex gap-1.5 mt-4 px-10">
             {[1,2,3,4].map(s => <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-700 ${step >= s ? 'bordeaux-gradient' : 'bg-gray-100'}`}></div>)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
           
           {step === 1 && (
             <div className="space-y-6 animate-fadeIn">
                <div className="bg-gray-50 dark:bg-dark-elevated p-4 rounded-[2rem] border border-gray-100 dark:border-white/5">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-gold uppercase tracking-widest flex items-center gap-1"><CalendarIcon size={12}/> Agenda de Retiro</span>
                      <span className="text-[9px] font-bold text-gray-400">{totalDays} Días</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <input type="date" value={formData.inicio} onChange={(e) => setFormData({...formData, inicio: e.target.value})} className="bg-white dark:bg-dark-base rounded-xl px-3 py-2 text-[10px] font-bold outline-none border border-transparent focus:border-gold" />
                      <input type="date" value={formData.fin} onChange={(e) => setFormData({...formData, fin: e.target.value})} className="bg-white dark:bg-dark-base rounded-xl px-3 py-2 text-[10px] font-bold outline-none border border-transparent focus:border-gold" />
                   </div>
                   <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-white/5">
                      <span className="text-[10px] font-black text-gray-500 uppercase">Total Estimado:</span>
                      <span className="text-sm font-robust text-bordeaux-950 dark:text-white">R$ {contractTotalBRL}</span>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center gap-2 mb-1"><User size={14} className="text-gold"/><span className="text-[9px] font-black uppercase text-gray-400">Datos del Conductor</span></div>
                   <input type="text" placeholder="Nombre Completo (Titular)" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-gold/20" />
                   <div className="grid grid-cols-2 gap-3">
                       <input type="text" placeholder="CI / RG / Pasaporte" value={formData.ci} onChange={(e) => setFormData({...formData, ci: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-gold/20" />
                       <input type="tel" placeholder="Celular / WhatsApp" value={formData.celular} onChange={(e) => setFormData({...formData, celular: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-gold/20" />
                   </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Licencia de Conducir (Frente)</label>
                    <label className="flex items-center gap-4 w-full p-4 bg-gray-50 dark:bg-dark-base border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl cursor-pointer hover:border-gold transition-colors">
                       <div className="bg-white dark:bg-dark-elevated p-3 rounded-full text-gold shadow-sm"><Upload size={20}/></div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{licenseBase64 ? 'Documento Cargado' : 'Subir Foto Licencia'}</p>
                       </div>
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'license')} />
                       {licenseBase64 && <CheckCircle2 size={20} className="text-green-500" />}
                    </label>
                 </div>
             </div>
           )}

           {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-bordeaux-50 rounded-lg text-bordeaux-800"><FileText size={18}/></div>
                    <h3 className="text-lg font-robust dark:text-white italic">Contrato Digital</h3>
                 </div>
                 
                 <div className="bg-gray-50 dark:bg-dark-base p-6 rounded-[2rem] h-64 overflow-y-auto space-y-3 border border-gray-100 dark:border-white/5 scrollbar-thin text-justify">
                    <h4 className="text-[9px] font-black uppercase text-gold sticky top-0 bg-gray-50 dark:bg-dark-base py-2">Cláusulas del Contrato</h4>
                    {CONTRACT_CLAUSES.map((c, i) => (
                       <p key={i} className="text-[9px] text-gray-500 font-medium leading-relaxed pb-2 border-b border-gray-200 dark:border-white/5 last:border-0">{i+1}. {c}</p>
                    ))}
                 </div>

                 <SignaturePad onSave={(s) => setFormData({...formData, signature: s})} onClear={() => setFormData({...formData, signature: ''})} lang={language} />

                 <label className="flex items-center gap-3 p-4 bg-gold/5 rounded-2xl border border-gold/20 cursor-pointer hover:bg-gold/10 transition-colors">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.contractRead ? 'bg-gold border-gold' : 'border-gray-300 bg-white'}`}>
                       {formData.contractRead && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.contractRead} onChange={() => setFormData({...formData, contractRead: !formData.contractRead})} />
                    <span className="text-[9px] font-black uppercase text-bordeaux-950 dark:text-white tracking-widest">He leído y acepto los términos</span>
                 </label>
              </div>
           )}

           {step === 3 && (
              <div className="space-y-8 animate-fadeIn">
                 {/* Currency Display */}
                 <div className="text-center bg-gray-50 dark:bg-dark-base p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Monto Total a Transferir</p>
                    <div className="flex flex-col items-center gap-2">
                       <div className="flex items-baseline gap-2">
                          <span className="text-2xl text-gray-400 font-bold">R$</span>
                          <h3 className="text-5xl font-robust text-bordeaux-950 dark:text-white italic tracking-tighter">{contractTotalBRL}</h3>
                       </div>
                       <div className="bg-gold/10 px-4 py-1 rounded-full border border-gold/20">
                          <span className="text-sm font-black text-gold uppercase tracking-widest">Gs. {paymentAmountPYG.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>

                 {/* Banks */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Santander */}
                    <div className="bg-gradient-to-br from-[#ec0000] to-[#a30000] text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Landmark size={100} /></div>
                       <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                             <span className="text-[#ec0000] font-black text-2xl tracking-tighter">S</span>
                          </div>
                          <div>
                             <h4 className="font-robust text-xl tracking-wider">Santander</h4>
                             <p className="text-[9px] font-medium opacity-90 uppercase tracking-widest">Cuenta Corriente</p>
                          </div>
                          <div className="bg-black/20 p-3 rounded-xl w-full backdrop-blur-sm border border-white/10">
                             <p className="font-mono text-sm tracking-wider">050-123456-7</p>
                          </div>
                          <button onClick={() => handleCopy("050-123456-7")} className="w-full py-3 bg-white text-[#ec0000] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                             <Copy size={12} /> Copiar CBU
                          </button>
                       </div>
                    </div>

                    {/* Ueno Bank */}
                    <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={100} /></div>
                       <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                          <div className="w-14 h-14 bg-[#00e36b] rounded-2xl flex items-center justify-center shadow-lg">
                             <span className="text-black font-black text-xl tracking-tighter">ueno</span>
                          </div>
                          <div>
                             <h4 className="font-robust text-xl tracking-wider">Ueno Bank</h4>
                             <p className="text-[9px] font-medium opacity-90 uppercase tracking-widest">Caja de Ahorro</p>
                          </div>
                          <div className="bg-white/10 p-3 rounded-xl w-full backdrop-blur-sm border border-white/10">
                             <p className="font-mono text-sm tracking-wider">600-987654-3</p>
                          </div>
                          <button onClick={() => handleCopy("600-987654-3")} className="w-full py-3 bg-[#00e36b] text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00c95f] transition-colors flex items-center justify-center gap-2">
                             <Copy size={12} /> Copiar Cuenta
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Upload Receipt */}
                 <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-4 flex items-center gap-2">
                       <Upload size={14} /> Comprobante de Transferencia
                    </label>
                    <label className={`relative w-full p-10 flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] cursor-pointer transition-all duration-500 group overflow-hidden ${uploadSuccess ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 dark:border-white/10 hover:border-gold hover:bg-gold/5'}`}>
                       
                       {/* Success Overlay Animation */}
                       <div className={`absolute inset-0 bg-emerald-500 flex items-center justify-center transition-transform duration-500 ${uploadSuccess ? 'translate-y-0' : 'translate-y-full'}`}>
                          <div className="text-center text-white">
                             <CheckCircle2 size={48} className="mx-auto mb-2 animate-bounce" />
                             <p className="text-sm font-black uppercase tracking-widest">¡Carga Exitosa!</p>
                          </div>
                       </div>

                       <div className={`transition-all duration-300 flex flex-col items-center ${uploadSuccess ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                          <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl mb-4 transition-all ${isProcessingReceipt ? 'bg-gold text-white animate-pulse' : 'bg-white dark:bg-dark-elevated text-gold group-hover:scale-110 group-hover:rotate-3'}`}>
                             {isProcessingReceipt ? <Loader2 size={40} className="animate-spin" /> : <Upload size={40} strokeWidth={1.5} />}
                          </div>
                          <div className="text-center space-y-1">
                             <p className="text-sm font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 group-hover:text-gold transition-colors">
                                {isProcessingReceipt ? 'Procesando...' : 'Subir Comprobante'}
                             </p>
                             <p className="text-[9px] font-bold text-gray-400">PDF, JPG o PNG</p>
                          </div>
                       </div>
                       
                       <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'receipt')} />
                    </label>
                 </div>
              </div>
           )}

           {step === 4 && (
              <div className="text-center py-6 space-y-8 animate-fadeIn">
                 <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-xl shadow-green-200 animate-bounce">
                    <BadgeCheck size={48} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-robust text-bordeaux-950 dark:text-white italic">¡Reserva Exitosa!</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-8">La unidad ha sido bloqueada. El equipo de JM ha sido notificado.</p>
                 </div>
                 <div className="p-6 bg-gray-50 dark:bg-dark-elevated rounded-[2.5rem] inline-block border border-gray-100 dark:border-white/5">
                    <p className="text-[9px] font-black text-gold uppercase mb-2">Ticket ID</p>
                    <div className="flex items-center justify-center gap-3">
                       <QrCode size={24} className="text-gray-400" />
                       <p className="text-3xl font-mono font-bold text-gray-800 dark:text-white tracking-widest">JM-{reservationId}</p>
                    </div>
                 </div>
                 
                 <div className="flex justify-center gap-2 pt-4">
                    <button 
                       className="px-8 py-4 bg-green-500 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-green-600 hover:scale-[1.02] transition-all shadow-xl shadow-green-500/30" 
                       onClick={() => window.open(`https://wa.me/595991681191?text=${waMessage}`)}
                    >
                       <MessageCircle size={18} /> Notificar a JM (WhatsApp)
                    </button>
                 </div>
              </div>
           )}

        </div>

        <div className="p-6 md:p-8 border-t dark:border-white/5 bg-gray-50/50 dark:bg-dark-base shrink-0">
           {step === 4 ? (
              <button onClick={onClose} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.01] transition-all">
                 Cerrar
              </button>
           ) : (
              <button 
                 onClick={handleNext} 
                 disabled={
                    (step === 1 && (!formData.cliente || !formData.ci || !formData.celular || !licenseBase64)) ||
                    (step === 2 && (!formData.contractRead || !formData.signature)) ||
                    (step === 3 && !uploadSuccess)
                 }
                 className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-3 ${
                    ((step === 1 && formData.cliente && formData.ci && formData.celular && licenseBase64) || 
                     (step === 2 && formData.contractRead && formData.signature) || 
                     (step === 3 && uploadSuccess))
                    ? 'bordeaux-gradient text-white hover:scale-[1.01] active:scale-95' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                 }`}
              >
                 {step === 3 ? 'Finalizar Reserva' : 'Siguiente Paso'} <ChevronRight size={16}/>
              </button>
           )}
        </div>

      </div>
    </div>
  );
};

export default BookingModal;
