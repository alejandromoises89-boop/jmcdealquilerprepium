
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Vehicle, Reservation } from '../types';
import { TRANSLATIONS, Language, CONTRACT_CLAUSES } from '../constants';
import { 
  X, ChevronRight, Upload, 
  Check, User as UserIcon, 
  ChevronLeft, Car, Calendar, Smartphone, CreditCard, Copy, 
  QrCode, CheckCircle2, ShieldCheck, Mail, FileText, PenTool, ExternalLink, MessageCircle
} from 'lucide-react';

interface BookingModalProps {
  vehicle: Vehicle;
  exchangeRate: number;
  reservations: Reservation[];
  onClose: () => void;
  onSubmit: (res: Reservation) => void;
  language?: Language;
  initialDates?: { start: Date; end: Date };
}

const BookingModal: React.FC<BookingModalProps> = ({ vehicle, exchangeRate, reservations, onClose, onSubmit, language = 'es', initialDates }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cliente: '',
    email: '',
    ci: '',
    documentType: 'CI' as 'CI' | 'RG' | 'Pasaporte',
    celular: '',
    inicio: initialDates ? initialDates.start.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    fin: initialDates ? initialDates.end.toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0],
    horaIni: '08:00',
    horaFin: '17:00',
    payMethod: 'Pix' as 'Pix' | 'Transfer',
    contractRead: false
  });
  
  const [licenseBase64, setLicenseBase64] = useState<string | null>(null);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [reservationId, setReservationId] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const t = TRANSLATIONS[language];
  const stepsLabels = t.steps;

  const totals = useMemo(() => {
    const start = new Date(`${formData.inicio}T${formData.horaIni}`);
    const end = new Date(`${formData.fin}T${formData.horaFin}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { days: 1, fullTotalBRL: vehicle.precio };
    const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const days = Math.max(1, Math.ceil(diffInHours / 24));
    // Se mantiene el precio con decimales exactos
    return { days, fullTotalBRL: parseFloat((days * vehicle.precio).toFixed(2)) };
  }, [formData.inicio, formData.horaIni, formData.fin, formData.horaFin, vehicle.precio]);

  const { days, fullTotalBRL } = totals;

  useEffect(() => {
    const startDT = new Date(`${formData.inicio}T${formData.horaIni}`);
    const endDT = new Date(`${formData.fin}T${formData.horaFin}`);
    
    const keyTerm = vehicle.nombre.toLowerCase()
      .replace(/toyota|hyundai|blanco|negro|gris|suv|familiar|compacto/g, '')
      .trim();

    const overlap = (reservations || []).find(r => {
      if (!r.inicio || r.status === 'Cancelled' || r.status === 'Completed') return false;
      const resAuto = (r.auto || "").toLowerCase();
      
      const isMatch = resAuto.includes(keyTerm) || keyTerm.includes(resAuto) || resAuto === vehicle.nombre.toLowerCase();
      if (!isMatch) return false;

      const parseD = (s: string) => {
        if (!s) return null;
        const parts = s.split(' ');
        const dateParts = parts[0].split(/[/-]/);
        const timeParts = parts[1]?.split(':') || ['08','00'];
        let y, m, d;
        if (dateParts[0].length === 4) { y = parseInt(dateParts[0]); m = parseInt(dateParts[1])-1; d = parseInt(dateParts[2]); }
        else { d = parseInt(dateParts[0]); m = parseInt(dateParts[1])-1; y = parseInt(dateParts[2]); if (y < 100) y += 2000; }
        return new Date(y, m, d, parseInt(timeParts[0]), parseInt(timeParts[1]));
      };

      const rStart = parseD(r.inicio);
      const rEnd = parseD(r.fin);
      if (!rStart || !rEnd) return false;
      
      return startDT < rEnd && endDT > rStart;
    });

    setIsAvailable(!overlap);
  }, [formData.inicio, formData.fin, formData.horaIni, formData.horaFin, reservations, vehicle.nombre]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#800000';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureBase64(canvasRef.current.toDataURL());
    }
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.beginPath();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureBase64(null);
    }
  };

  const handleFinalConfirm = () => {
    const resId = `JM-${Date.now().toString().slice(-6)}`;
    setReservationId(resId);
    const newRes: Reservation = {
      id: resId,
      cliente: formData.cliente,
      email: formData.email,
      ci: formData.ci,
      documentType: formData.documentType,
      celular: formData.celular,
      auto: vehicle.nombre,
      inicio: `${formData.inicio} ${formData.horaIni}`,
      fin: `${formData.fin} ${formData.horaFin}`,
      total: fullTotalBRL,
      status: 'Requested',
      comprobante: receiptBase64 || undefined,
      driverLicense: licenseBase64 || undefined,
      signature: signatureBase64 || undefined,
      includeInCalendar: true
    };
    onSubmit(newRes);
    setStep(6);
  };

  const sendToWhatsApp = () => {
    const text = `Hola JM Asociados, solicito validación de mi reserva:\n\nID: ${reservationId}\nSocio: ${formData.cliente}\nUnidad: ${vehicle.nombre}\nPeriodo: ${formData.inicio} ${formData.horaIni} hasta ${formData.fin} ${formData.horaFin}\nTotal: R$ ${fullTotalBRL.toFixed(2)}`;
    window.open(`https://wa.me/595991681191?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isNextDisabled = () => {
    if (step === 1) {
      const hIni = parseInt(formData.horaIni.split(':')[0]);
      const hFin = parseInt(formData.horaFin.split(':')[0]);
      return !isAvailable || hIni < 8 || hIni > 17 || hFin < 8 || hFin > 17;
    }
    if (step === 2) return !formData.cliente || !formData.email || !formData.ci || !formData.celular || !licenseBase64;
    if (step === 3) return !formData.contractRead || !signatureBase64;
    if (step === 4) return !receiptBase64;
    return false;
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-bordeaux-950/95 backdrop-blur-md p-0 md:p-4">
      <div className="relative bg-white dark:bg-dark-base w-full max-w-2xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-[3rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slideUp border-t md:border-2 border-gold/20">
        
        {step < 6 && (
          <div className="px-8 py-5 border-b dark:border-gold/10 bg-white dark:bg-dark-card">
             <div className="flex justify-between items-center mb-2">
                <button onClick={step > 1 ? () => setStep(step - 1) : onClose} className="p-2 bg-gray-50 dark:bg-dark-elevated rounded-xl text-gold">
                  <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                  <h2 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] leading-none mb-1">Paso {step} de 5</h2>
                  <p className="text-xs font-robust text-bordeaux-950 dark:text-white italic uppercase tracking-tight">{stepsLabels[step-1]}</p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400"><X size={20} /></button>
             </div>
             <div className="h-1 bg-gray-100 dark:bg-dark-base rounded-full overflow-hidden">
                <div className="h-full bordeaux-gradient transition-all duration-500" style={{ width: `${(step/5)*100}%` }}></div>
             </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide pb-32">
           
           {/* PASO 1: HORARIOS Y DISPONIBILIDAD */}
           {step === 1 && (
             <div className="space-y-6 animate-slideUp">
                <div className="bg-bordeaux-950 dark:bg-dark-card p-6 rounded-[2rem] border-2 border-gold/20 text-white flex justify-around">
                   <div className="text-center"><p className="text-[7px] font-black text-gold uppercase">Días</p><p className="text-2xl font-robust">{days}</p></div>
                   <div className="w-px h-8 bg-white/10"></div>
                   <div className="text-center"><p className="text-[7px] font-black text-gold uppercase">Inversión</p><p className="text-2xl font-robust">R$ {fullTotalBRL.toFixed(2)}</p></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-dark-elevated rounded-2xl space-y-2 border dark:border-white/5">
                    <p className="text-[8px] font-black text-gold uppercase tracking-widest">Retiro (08:00 - 17:00)</p>
                    <input type="date" value={formData.inicio} onChange={e => setFormData({...formData, inicio: e.target.value})} className="w-full bg-white dark:bg-dark-base p-2 rounded-lg text-xs font-bold" />
                    <input type="time" value={formData.horaIni} onChange={e => setFormData({...formData, horaIni: e.target.value})} className="w-full bg-white dark:bg-dark-base p-2 rounded-lg text-xs font-bold" />
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-dark-elevated rounded-2xl space-y-2 border dark:border-white/5">
                    <p className="text-[8px] font-black text-gold uppercase tracking-widest">Entrega (08:00 - 17:00)</p>
                    <input type="date" value={formData.fin} onChange={e => setFormData({...formData, fin: e.target.value})} className="w-full bg-white dark:bg-dark-base p-2 rounded-lg text-xs font-bold" />
                    <input type="time" value={formData.horaFin} onChange={e => setFormData({...formData, horaFin: e.target.value})} className="w-full bg-white dark:bg-dark-base p-2 rounded-lg text-xs font-bold" />
                  </div>
                </div>

                <div className="p-4 bg-gold/5 rounded-2xl border border-gold/20">
                   <p className="text-[8px] font-black text-gold uppercase mb-2 flex items-center gap-2"><ShieldCheck size={12}/> Protocolo de Puntualidad</p>
                   <ul className="text-[7.5px] font-bold text-gray-500 dark:text-gray-400 space-y-1 leading-tight uppercase">
                      <li>• Retiro y entrega estrictamente entre 08:00 y 17:00 hs.</li>
                      <li>• Tolerancia máxima de 1 hora de retraso con previo aviso.</li>
                      <li>• Retrasos mayores incurren en multas de media diaria.</li>
                   </ul>
                </div>

                {!isAvailable && <div className="p-3 bg-red-600/10 text-red-600 rounded-xl text-[9px] font-robust text-center border border-red-600/20 uppercase animate-pulse">Unidad no disponible (Local o Nube)</div>}
             </div>
           )}

           {/* PASO 2: SOCIO Y DOCUMENTOS */}
           {step === 2 && (
             <div className="space-y-6 animate-slideUp">
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={16}/><input type="text" placeholder="NOMBRE COMPLETO" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl pl-12 pr-4 py-4 text-xs font-bold outline-none" /></div>
                  <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={16}/><input type="email" placeholder="CORREO ELECTRÓNICO" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl pl-12 pr-4 py-4 text-xs font-bold outline-none" /></div>
                  <div className="relative"><Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={16}/><input type="tel" placeholder="CELULAR" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl pl-12 pr-4 py-4 text-xs font-bold outline-none" /></div>
                  <div className="flex gap-2">
                     <select value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value as any})} className="bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-4 py-4 text-xs font-bold outline-none border-0">
                        <option value="CI">CI</option><option value="RG">RG</option><option value="Pasaporte">PAS</option>
                     </select>
                     <input type="text" placeholder="NRO DOCUMENTO" value={formData.ci} onChange={e => setFormData({...formData, ci: e.target.value})} className="flex-1 bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[8px] font-black text-gold uppercase tracking-widest ml-1">Licencia de Conducir (Adjuntar)</p>
                  <label className="flex flex-col items-center justify-center gap-3 w-full h-32 border-2 border-dashed border-gold/20 rounded-3xl bg-gray-50 dark:bg-dark-elevated cursor-pointer hover:bg-gold/5 transition-all">
                    <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setLicenseBase64(r.result as string); r.readAsDataURL(f); } }} />
                    {licenseBase64 ? <CheckCircle2 size={30} className="text-green-500" /> : <Upload size={30} className="text-gray-300" />}
                    <span className="text-[8px] font-black text-gray-400 uppercase">Habilitación de Conducir</span>
                  </label>
                </div>
             </div>
           )}

           {/* PASO 3: CONTRATO DIGITAL */}
           {step === 3 && (
             <div className="space-y-6 animate-slideUp">
                <div className="bg-gray-50 dark:bg-dark-card p-6 rounded-[2rem] border dark:border-gold/10 max-h-80 overflow-y-auto space-y-4 shadow-inner text-[9.5px] leading-relaxed dark:text-gray-300">
                   <h3 className="text-xs font-robust text-bordeaux-950 dark:text-white text-center border-b pb-2 mb-4">CONTRATO DE ALQUILER JM ASOCIADOS</h3>
                   {CONTRACT_CLAUSES.map((c, i) => (
                     <p key={i}><b>{i+1}.</b> {c.replace('el vehículo descrito', vehicle.nombre).replace('el periodo acordado', `${formData.inicio} - ${formData.fin}`)}</p>
                   ))}
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gold/5 rounded-2xl border border-gold/20">
                   <input type="checkbox" checked={formData.contractRead} onChange={() => setFormData({...formData, contractRead: !formData.contractRead})} className="mt-1 w-5 h-5 rounded border-gold text-bordeaux-800" />
                   <p className="text-[9px] font-bold text-bordeaux-950 dark:text-gold uppercase leading-tight">He leído y acepto íntegramente las 12 cláusulas del contrato de alquiler.</p>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <p className="text-[8px] font-black text-gold uppercase tracking-widest">Firma Digital (Con el dedo)</p>
                      <button onClick={clearSignature} className="text-[8px] font-black text-red-500 uppercase">Limpiar</button>
                   </div>
                   <canvas 
                    ref={canvasRef}
                    width={500}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                    className="w-full h-32 bg-white dark:bg-gray-100 rounded-2xl border-2 border-gold/10 cursor-crosshair shadow-inner"
                   />
                </div>
             </div>
           )}

           {/* PASO 4: PAGO Y ACTIVACIÓN */}
           {step === 4 && (
             <div className="space-y-6 animate-slideUp text-center">
                <div className="flex bg-gray-50 dark:bg-dark-elevated p-1 rounded-2xl border dark:border-white/5 gap-1 mb-6">
                   {['Pix', 'Transfer'].map(m => (
                     <button key={m} onClick={() => setFormData({...formData, payMethod: m as any})} className={`flex-1 py-3 rounded-xl text-[9px] font-robust transition-all ${formData.payMethod === m ? 'bg-bordeaux-950 text-white shadow-lg' : 'text-gray-400'}`}>{m.toUpperCase()}</button>
                   ))}
                </div>

                <div className="bg-white dark:bg-dark-card p-8 rounded-[2.5rem] border-2 border-gold/20 space-y-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-12 -mt-12"></div>
                   <p className="text-[9px] font-black text-gold uppercase tracking-widest">Datos de Transferencia</p>
                   <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-dark-base p-4 rounded-xl">
                        <div><p className="text-[7px] font-bold text-gray-400 uppercase">Clave PIX / Cuenta</p><p className="text-xs font-robust dark:text-white tracking-widest">{formData.payMethod === 'Pix' ? t.payData.pix : t.payData.acc}</p></div>
                        <button onClick={() => { navigator.clipboard.writeText(formData.payMethod === 'Pix' ? t.payData.pix : t.payData.acc); alert(t.copied); }} className="p-2 text-gold"><Copy size={16}/></button>
                      </div>
                      <div className="flex justify-between items-center p-1 px-4">
                        <div><p className="text-[7px] font-bold text-gray-400 uppercase">Banco</p><p className="text-xs font-robust dark:text-white">{t.payData.bank}</p></div>
                        <div className="text-right"><p className="text-[7px] font-bold text-gray-400 uppercase">Titular</p><p className="text-xs font-robust dark:text-white">{t.payData.holder}</p></div>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[8px] font-black text-gold uppercase tracking-widest ml-1">Adjuntar Comprobante de Pago</p>
                  <label className="flex flex-col items-center justify-center gap-3 w-full h-32 border-2 border-dashed border-gold/20 rounded-3xl bg-gray-50 dark:bg-dark-elevated cursor-pointer hover:bg-gold/5 transition-all">
                    <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setReceiptBase64(r.result as string); r.readAsDataURL(f); } }} />
                    {receiptBase64 ? <CheckCircle2 size={30} className="text-green-500" /> : <Upload size={30} className="text-gray-300" />}
                    <span className="text-[8px] font-black text-gray-400 uppercase">Comprobante de Depósito</span>
                  </label>
                </div>
             </div>
           )}

           {/* PASO 5: TICKET JM */}
           {step === 5 && (
             <div className="space-y-6 animate-slideUp">
                <div className="bg-white dark:bg-dark-card rounded-[3rem] border-2 border-gold/10 shadow-2xl overflow-hidden">
                   <div className="bordeaux-gradient p-8 text-center text-white space-y-2">
                      <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto text-gold mb-2 border border-gold/30"><ShieldCheck size={32}/></div>
                      <h4 className="text-xl font-robust italic uppercase tracking-tight">Ticket de Reserva</h4>
                      <p className="text-[9px] font-black uppercase text-gold/60">Sujeto a Validación JM</p>
                   </div>
                   <div className="p-8 space-y-6">
                      <div className="flex justify-between border-b dark:border-white/5 pb-4">
                         <div><p className="text-[7px] font-black text-gray-400 uppercase">Socio</p><p className="text-xs font-robust dark:text-white uppercase">{formData.cliente}</p></div>
                         <div className="text-right"><p className="text-[7px] font-black text-gray-400 uppercase">Unidad</p><p className="text-xs font-robust dark:text-white uppercase">{vehicle.nombre}</p></div>
                      </div>
                      <div className="flex justify-between border-b dark:border-white/5 pb-4">
                         <div><p className="text-[7px] font-black text-gray-400 uppercase">Recojo</p><p className="text-xs font-robust dark:text-white italic">{formData.inicio} {formData.horaIni}</p></div>
                         <div className="text-right"><p className="text-[7px] font-black text-gray-400 uppercase">Entrega</p><p className="text-xs font-robust dark:text-white italic">{formData.fin} {formData.horaFin}</p></div>
                      </div>
                      <div className="text-center pt-2">
                         <p className="text-[7px] font-black text-gold uppercase tracking-[0.4em] mb-1">Inversión Total</p>
                         <p className="text-3xl font-robust text-bordeaux-950 dark:text-white italic">R$ {fullTotalBRL.toFixed(2)}</p>
                      </div>
                   </div>
                </div>
                
                <button onClick={sendToWhatsApp} className="w-full flex items-center justify-center gap-3 py-5 bg-green-600 text-white rounded-[2rem] font-robust text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                   <MessageCircle size={18} /> Enviar Validación WhatsApp
                </button>
             </div>
           )}

           {/* PASO 6: ÉXITO / VALIDACIÓN */}
           {step === 6 && (
             <div className="animate-slideUp flex flex-col items-center text-center gap-8 py-10">
                <div className="w-24 h-24 bg-gold/10 rounded-[2.5rem] flex items-center justify-center text-gold border-2 border-gold/30 shadow-2xl animate-pulse">
                   <Check size={48} />
                </div>
                <div className="space-y-4">
                   <h3 className="text-2xl font-robust font-speed text-bordeaux-950 dark:text-white italic uppercase">Protocolo Iniciado</h3>
                   <div className="p-6 bg-gray-50 dark:bg-dark-card rounded-3xl border dark:border-white/5 space-y-4">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-tight">Hemos registrado su solicitud con ID <span className="text-bordeaux-800 dark:text-gold">{reservationId}</span>.</p>
                      <p className="text-[10px] font-black text-bordeaux-950 dark:text-white uppercase">Sujeto a validación del comprobante y documentos por nuestra central.</p>
                      <p className="text-[9px] font-bold text-gray-400 italic">Se ha enviado una copia del registro a su correo: {formData.email}</p>
                   </div>
                </div>
                <button onClick={onClose} className="w-full py-5 border-2 border-gold/20 text-gold rounded-[2rem] font-robust text-[10px] uppercase tracking-widest hover:bg-gold hover:text-white transition-all">Volver a Flota VIP</button>
             </div>
           )}
        </div>

        {step < 6 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-dark-base/95 backdrop-blur-xl border-t dark:border-white/5 z-[160] flex gap-3">
             <button onClick={() => step < 5 ? setStep(step + 1) : handleFinalConfirm()} disabled={isNextDisabled()} 
               className="flex-1 py-5 bordeaux-gradient text-white rounded-[2rem] font-robust text-[11px] uppercase tracking-[0.4em] shadow-xl disabled:opacity-20 transition-all flex items-center justify-center gap-2">
               {step === 5 ? 'Confirmar Reserva' : 'Siguiente'} <ChevronRight size={18} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
