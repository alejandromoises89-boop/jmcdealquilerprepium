
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vehicle, Reservation } from '../types';
import { TRANSLATIONS, Language, CONTRACT_CLAUSES } from '../constants';
import { 
  X, ChevronRight, Upload, ChevronLeft, Smartphone, Copy, 
  CheckCircle2, MessageCircle, Landmark, BadgeCheck, 
  Printer, Image as ImageIcon, Wallet, Loader2,
  Eraser, ShieldCheck, CreditCard, ArrowRight, DollarSign
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
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
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
  const [hasNotified, setHasNotified] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reservationId] = useState<string>(`${Math.floor(100000 + Math.random() * 900000)}`);
  
  // State interno usa ISO YYYY-MM-DD para los inputs tipo "date"
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
  
  // SOLO PAGO TOTAL PERMITIDO
  const paymentAmountBRL = contractTotalBRL;
  const paymentAmountPYG = Math.round(paymentAmountBRL * exchangeRate);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=JM-${reservationId}`;

  // Función para convertir fecha ISO (YYYY-MM-DD) a formato Paraguay (DD/MM/AAAA)
  const formatToParaguayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleNext = () => {
    if (step === 3 && paymentBase64) {
      // AQUÍ OCURRE LA MAGIA: Convertimos a DD/MM/AAAA para el sistema
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
        // GUARDAR CON FORMATO PARAGUAY PARA LA HOJA Y EL CALENDARIO
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
      
      // Enviar al sistema central (App.tsx)
      onSubmit(newRes);
      setStep(4);
    } else if (step < 4) {
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
      if (type === 'license') setLicenseBase64(reader.result as string);
      else {
        setPaymentBase64(reader.result as string);
        setTimeout(() => {
           setIsProcessingReceipt(false);
           setUploadSuccess(true);
        }, 1500);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-dark-base/90 backdrop-blur-2xl p-0 md:p-6 overflow-hidden">
      <div className="relative bg-white dark:bg-dark-card w-full max-w-xl h-[92vh] md:h-auto md:max-h-[95vh] rounded-t-[3.5rem] md:rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp border-t-[8px] border-gold">
        
        {/* Header */}
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
             {[1,2,3,4].map(s => <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-700 ${step >= s ? 'bordeaux-gradient' : 'bg-gray-100 dark:bg-dark-elevated'}`} />)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <input type="text" placeholder="Nombre Completo" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-7 py-4 text-[10px] font-bold border-2 dark:border-white/5 focus:border-gold outline-none" />
              <input type="text" placeholder="WhatsApp" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-7 py-4 text-[10px] font-bold border-2 dark:border-white/5 focus:border-gold outline-none" />
              <input type="text" placeholder="Documento (CI / RG)" value={formData.ci} onChange={e => setFormData({...formData, ci: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-7 py-4 text-[10px] font-bold border-2 dark:border-white/5 focus:border-gold outline-none" />
              <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-gold/30 rounded-2xl bg-gray-50 dark:bg-dark-elevated cursor-pointer">
                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'license')} />
                {licenseBase64 ? <CheckCircle2 className="text-green-500" /> : <Upload className="text-gold" />}
                <span className="text-[7px] font-black uppercase text-gray-400">Adjuntar Registro</span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
               <div className="bg-gray-50 dark:bg-dark-elevated rounded-2xl p-5 text-[8px] text-gray-400 italic max-h-[120px] overflow-y-auto scrollbar-hide">
                 {CONTRACT_CLAUSES.map((c, i) => <p key={i} className="mb-1"><b>{i+1}.</b> {c}</p>)}
               </div>
               <SignaturePad onSave={d => setFormData({...formData, signature: d})} onClear={() => setFormData({...formData, signature: ''})} lang={language} />
               <label className="flex items-center gap-4 p-5 bg-gold/5 rounded-2xl border border-gold/20 cursor-pointer">
                  <input type="checkbox" className="w-6 h-6 accent-gold" checked={formData.contractRead} onChange={() => setFormData({...formData, contractRead: !formData.contractRead})} />
                  <span className="text-[10px] font-black uppercase italic dark:text-white">Acepto términos JM Master.</span>
               </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
               {/* Resumen de Pago */}
               <div className="bg-bordeaux-950 p-6 rounded-3xl text-center shadow-2xl border-2 border-gold/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Landmark size={80} className="text-white"/></div>
                  <p className="text-[9px] font-black text-gold uppercase tracking-[0.3em] mb-2">TOTAL A PAGAR</p>
                  <div className="grid grid-cols-2 gap-4 items-center justify-center relative z-10">
                     <div className="text-center border-r border-white/10">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">REALES</p>
                        <p className="text-3xl font-robust text-white italic tracking-tighter">R$ {paymentAmountBRL.toLocaleString()}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">GUARANIES</p>
                        <p className="text-2xl font-robust text-gold italic tracking-tighter">Gs. {paymentAmountPYG.toLocaleString()}</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Santander Card */}
                 <div className="bg-red-600 p-5 rounded-[2rem] text-center relative overflow-hidden group shadow-lg text-white border-2 border-red-500">
                    <div className="absolute -top-4 -right-4 bg-white/10 w-24 h-24 rounded-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Landmark size={18} />
                            <h4 className="text-lg font-robust italic">SANTANDER</h4>
                        </div>
                        <p className="text-[9px] font-bold opacity-80 mb-3 uppercase tracking-widest">PIX OFICIAL</p>
                        <button onClick={() => { navigator.clipboard.writeText('24510861818'); alert('PIX Copiado'); }} className="w-full bg-white text-red-600 hover:bg-gray-100 p-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all shadow-md">
                        24510861818 <Copy size={12}/>
                        </button>
                    </div>
                 </div>
                 
                 {/* Ueno Card */}
                 <div className="bg-emerald-600 p-5 rounded-[2rem] text-center relative overflow-hidden group shadow-lg text-white border-2 border-emerald-500">
                    <div className="absolute -top-4 -right-4 bg-white/10 w-24 h-24 rounded-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <CreditCard size={18} />
                            <h4 className="text-lg font-robust italic">UENO BANK</h4>
                        </div>
                        <p className="text-[9px] font-bold opacity-80 mb-3 uppercase tracking-widest">ALIAS BANCARIO</p>
                        <button onClick={() => { navigator.clipboard.writeText('1008110'); alert('Alias Copiado'); }} className="w-full bg-white text-emerald-600 hover:bg-gray-100 p-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all shadow-md">
                        1008110 <Copy size={12}/>
                        </button>
                    </div>
                 </div>
               </div>

               <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Comprobante de Transferencia</p>
                     {uploadSuccess && <span className="text-[9px] font-black text-green-600 uppercase flex items-center gap-1 animate-pulse"><CheckCircle2 size={12}/> Recibido</span>}
                  </div>
                  
                  <label className={`flex flex-col items-center justify-center gap-3 w-full h-32 border-4 border-dashed rounded-[2.5rem] cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                     uploadSuccess 
                     ? 'bg-green-50 border-green-400' 
                     : isProcessingReceipt 
                        ? 'bg-gold/5 border-gold/30' 
                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gold'
                  }`}>
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'receipt')} />
                    
                    {isProcessingReceipt ? (
                       <div className="flex flex-col items-center animate-pulse">
                          <Loader2 className="animate-spin text-gold mb-2" size={32} />
                          <span className="text-[10px] font-black text-gold uppercase">Procesando...</span>
                       </div>
                    ) : uploadSuccess ? (
                       <div className="flex flex-col items-center animate-bounce">
                          <BadgeCheck className="text-green-500 mb-2" size={40} />
                          <span className="text-[11px] font-black text-green-600 uppercase tracking-widest">Listo para Generar</span>
                       </div>
                    ) : (
                       <div className="flex flex-col items-center text-gray-300 group-hover:text-bordeaux-800 transition-colors">
                          <div className="bg-gray-100 group-hover:bg-bordeaux-50 p-4 rounded-full mb-2 transition-colors">
                             <Upload size={24} />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest">Toca para Subir Imagen</span>
                       </div>
                    )}
                  </label>
               </div>

               {/* Prominent Generate Ticket Button - Only visible/active here if success */}
               <button 
                  onClick={handleNext}
                  disabled={!uploadSuccess}
                  className={`w-full py-6 rounded-[2rem] font-robust text-[12px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 transition-all transform ${
                     uploadSuccess 
                     ? 'bg-green-600 text-white hover:scale-[1.02] hover:shadow-green-500/30 cursor-pointer animate-slideUp' 
                     : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
               >
                  {uploadSuccess ? 'Finalizar Reserva' : 'Adjuntar Comprobante'} 
                  {uploadSuccess && <ArrowRight size={18} />}
               </button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-slideUp flex flex-col items-center gap-6 py-2">
               <div id="reservation-ticket" className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center border-t-[8px] border-bordeaux-800 relative">
                  <div className="w-16 h-16 bg-bordeaux-950 rounded-full mx-auto flex items-center justify-center border-2 border-gold shadow-xl mb-4"><ShieldCheck size={32} className="text-gold" /></div>
                  <h3 className="text-2xl font-robust text-bordeaux-950 uppercase italic leading-none mb-1">VALIDADO</h3>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-6">Platinum Ticket 3.0</p>
                  
                  <div className="bg-gold/5 p-5 rounded-[2rem] border border-gold/10 flex flex-col items-center gap-3">
                     <p className="text-[7px] font-black text-gold uppercase tracking-widest leading-none">CÓDIGO ÚNICO</p>
                     <h4 className="text-3xl font-black italic tracking-tighter text-bordeaux-950">JM-{reservationId}</h4>
                     <img src={qrUrl} className="w-28 h-28 border-4 border-white rounded-xl shadow-md" alt="QR" />
                  </div>

                  <div className="mt-6 pt-5 border-t border-dashed border-gray-200 space-y-2">
                     <div className="flex justify-between text-[9px] font-bold"><span className="text-gray-300 uppercase">Socio:</span><span className="text-bordeaux-950 uppercase italic">{formData.cliente}</span></div>
                     <div className="flex justify-between text-[9px] font-bold"><span className="text-gray-300 uppercase">Unidad:</span><span className="text-bordeaux-950 uppercase italic">{vehicle.nombre}</span></div>
                     <div className="flex justify-between text-[9px] font-black border-t border-gray-100 pt-2"><span className="text-bordeaux-800">TOTAL CONTRATO:</span><span className="text-bordeaux-950">R$ {contractTotalBRL}</span></div>
                     <div className="flex justify-between text-[9px] font-black bg-gold/10 p-1 rounded"><span className="text-bordeaux-800">ABONADO:</span><span className="text-bordeaux-950">R$ {paymentAmountBRL} (TOTAL)</span></div>
                  </div>
               </div>

               <div className="w-full space-y-3">
                  <button onClick={() => {
                     const msg = `✨ *JM ASOCIADOS - MASTER 2026* ✨\n\nReserva para *${vehicle.nombre}* validada exitosamente.\n🆔 ID: JM-${reservationId}\n📅 Inicio: ${formatToParaguayDate(formData.inicio)} ${formData.horaIni}\n💰 Total Contrato: R$ ${contractTotalBRL}\n✅ Abonado: R$ ${paymentAmountBRL} (TOTAL)\n\nGracias por su confianza.`;
                     window.open(`https://wa.me/595991681191?text=${encodeURIComponent(msg)}`, '_blank');
                     setHasNotified(true);
                  }} className="w-full flex items-center justify-center gap-4 py-6 bg-green-600 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                     <MessageCircle size={20}/> NOTIFICAR JM CENTRAL
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => window.print()} className="py-5 bg-gray-100 rounded-[1.5rem] text-[8px] font-black uppercase text-gray-400 tracking-widest"><Printer size={14} className="inline mr-2"/> IMPRIMIR</button>
                    <button onClick={onClose} className={`py-5 rounded-[1.5rem] text-[8px] font-black uppercase tracking-widest shadow-xl transition-all ${hasNotified ? 'bg-gold text-dark-base' : 'bg-gray-100 text-gray-300'}`}>CERRAR</button>
                  </div>
               </div>
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="p-8 bg-white dark:bg-dark-base border-t dark:border-white/5 shrink-0">
             <button onClick={handleNext} disabled={ (step === 1 && !formData.cliente) || (step === 2 && !formData.signature) } 
               className={`w-full py-8 text-white rounded-[2.5rem] font-robust text-[12px] uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-4 disabled:opacity-20 active:scale-95 transition-all bordeaux-gradient`}
             >
               SIGUIENTE PASO <ChevronRight size={20} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
