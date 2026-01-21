
import React, { useState, useEffect } from 'react';
import { Vehicle, Reservation } from '../types';
import { 
  X, Calendar, ChevronRight, Upload, 
  Copy, Check, ShieldCheck, User, CreditCard, 
  Mail, Info, AlertTriangle, ArrowLeftCircle, Image as ImageIcon, Sparkles, MessageCircle, PenTool, FileText, Clock
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
    signature: ''
  });
  
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [copied, setCopied] = useState(false);

  const stepsLabels = ["Reserva", "Contrato", "Firma", "Pago", "Validación"];

  const startDateTime = new Date(`${formData.inicio}T${formData.horaIni}`);
  const endDateTime = new Date(`${formData.fin}T${formData.horaFin}`);
  const diffInMs = endDateTime.getTime() - startDateTime.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  // Cálculo de días corregido: Si hay más de 24 horas exactas, suma otro día.
  // Ejemplo: 24.1 horas = 2 días.
  const days = Math.max(1, Math.ceil(diffInHours / 24));
  
  const isPeriodValid = diffInHours >= 1; // Al menos 1 hora de diferencia
  const fullTotalBRL = isPeriodValid ? days * vehicle.precio : 0;
  const bookingTotalBRL = formData.paymentType === 'Full' ? fullTotalBRL : vehicle.precio;

  useEffect(() => {
    const simpleTarget = vehicle.nombre.toLowerCase().replace(/toyota|hyundai|blanco|negro|gris/g, '').trim();
    const overlap = reservations.find(r => {
      const resAuto = (r.auto || "").toLowerCase();
      if (!resAuto.includes(simpleTarget) && !simpleTarget.includes(resAuto)) return false;
      if (r.status === 'Cancelled') return false;
      
      const parseD = (s: string) => {
        const parts = s.split(' ');
        const datePart = parts[0].split(/[/-]/);
        const timePart = parts[1] ? parts[1].split(':') : ["00", "00"];
        
        let d, m, y;
        if (datePart[0].length === 4) { // YYYY-MM-DD
          y = parseInt(datePart[0]); m = parseInt(datePart[1]) - 1; d = parseInt(datePart[2]);
        } else { // DD-MM-YYYY
          d = parseInt(datePart[0]); m = parseInt(datePart[1]) - 1; y = parseInt(datePart[2]);
        }
        return new Date(y, m, d, parseInt(timePart[0]), parseInt(timePart[1]));
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
      id: `JM${Math.floor(1000 + Math.random() * 9000)}`,
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
      status: 'Requested',
      admissionStatus: 'Review',
      includeInCalendar: true
    };
    onSubmit(newReservation);
    
    const waText = `*JM ASOCIADOS - SOLICITUD DE RESERVA VIP*\n\nHola, deseo solicitar el alquiler de la siguiente unidad:\n\n🚗 *Unidad:* ${vehicle.nombre}\n👤 *Cliente:* ${formData.cliente}\n📅 *Desde:* ${formData.inicio} ${formData.horaIni}\n📅 *Hasta:* ${formData.fin} ${formData.horaFin}\n⏱️ *Duración:* ${days} día(s)\n💰 *Total:* R$ ${fullTotalBRL}\n\n_Adjunto comprobante para validación de perfil._`;
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
        
        {/* Header con Progreso Detallado */}
        <div className="bg-white border-b border-gray-100 px-6 md:px-14 py-6 md:py-8 sticky top-0 z-[110]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3 md:gap-4">
               <div className="p-2 md:p-3 bg-bordeaux-50 rounded-xl md:rounded-2xl shrink-0">
                  <img src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" className="h-6 md:h-10 w-auto" alt="Logo" />
               </div>
               <div className="flex flex-col min-w-0">
                  <h2 className="text-[11px] md:text-[14px] font-black text-bordeaux-950 uppercase tracking-[0.3em] md:tracking-[0.5em] truncate">
                     {stepsLabels[step - 1]} VIP
                  </h2>
                  <span className="text-[8px] md:text-[9px] font-black text-gold uppercase tracking-[0.2em] md:tracking-[0.4em]">Corporate Mobility & Security</span>
               </div>
            </div>
            <button onClick={onClose} className="p-3 md:p-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl md:rounded-[1.5rem] transition-all flex items-center justify-center shadow-lg active:scale-90">
               <X size={24} />
            </button>
          </div>

          <div className="flex justify-between items-center px-4 max-w-4xl mx-auto">
            {stepsLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-2 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-bordeaux-800 text-white shadow-xl scale-110' : 'bg-gray-100 text-gray-400'}`}>
                  {step > i + 1 ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${step === i + 1 ? 'text-bordeaux-800' : 'text-gray-300'}`}>
                  {label}
                </span>
                {i < stepsLabels.length - 1 && (
                  <div className={`absolute left-full top-4 w-full h-[1px] md:w-20 lg:w-32 -translate-x-1/2 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-16 lg:p-24 space-y-8 md:space-y-12 pb-32 bg-gray-50/15">
          
          <button 
            onClick={step > 1 ? () => setStep(step - 1) : onClose}
            className="group flex items-center gap-3 text-bordeaux-950 font-black text-[10px] md:text-[12px] uppercase tracking-[0.4em] active:scale-95 transition-all"
          >
            <ArrowLeftCircle size={24} className="md:w-8 md:h-8 text-bordeaux-800" /> 
            <span>Atrás</span>
          </button>

          {step === 1 && (
            <div className="space-y-8 md:space-y-12 animate-fadeIn">
              <div className="bordeaux-gradient text-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="space-y-4">
                    <h4 className="text-2xl md:text-5xl font-serif font-bold tracking-tight">Periodo y Validación</h4>
                    <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] md:tracking-[0.8em] opacity-70">Configuración de Alquiler Multi-Día</p>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center min-w-[200px]">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Estimado</p>
                    <p className="text-3xl font-black">R$ {fullTotalBRL}</p>
                    <p className="text-[10px] font-bold text-gold mt-1 uppercase tracking-widest">{days} Día(s) Seleccionado(s)</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
                <div className="bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-gray-100 shadow-xl space-y-10">
                  <h4 className="text-[11px] font-black text-bordeaux-950 uppercase tracking-[0.5em] flex items-center gap-4">
                    <Clock size={22} className="text-gold" /> Tiempo de Arrendamiento
                  </h4>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desde</label>
                        <input type="date" value={formData.inicio} min="2026-01-01" onChange={(e) => setFormData({...formData, inicio: e.target.value})} className="w-full px-5 py-5 bg-gray-50 border-0 rounded-3xl font-bold text-sm shadow-inner outline-none focus:ring-4 focus:ring-bordeaux-50" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</label>
                        <input type="time" value={formData.horaIni} onChange={(e) => setFormData({...formData, horaIni: e.target.value})} className="w-full px-5 py-5 bg-gray-50 border-0 rounded-3xl font-bold text-sm shadow-inner outline-none focus:ring-4 focus:ring-bordeaux-50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hasta</label>
                        <input type="date" value={formData.fin} min={formData.inicio} onChange={(e) => setFormData({...formData, fin: e.target.value})} className="w-full px-5 py-5 bg-gray-50 border-0 rounded-3xl font-bold text-sm shadow-inner outline-none focus:ring-4 focus:ring-bordeaux-50" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</label>
                        <input type="time" value={formData.horaFin} onChange={(e) => setFormData({...formData, horaFin: e.target.value})} className="w-full px-5 py-5 bg-gray-50 border-0 rounded-3xl font-bold text-sm shadow-inner outline-none focus:ring-4 focus:ring-bordeaux-50" />
                      </div>
                    </div>
                  </div>
                  
                  {!isAvailable && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-pulse">
                      <AlertTriangle size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Cruza con reserva existente</span>
                    </div>
                  )}

                  <div className="p-4 bg-bordeaux-50 border border-bordeaux-100 rounded-2xl flex items-center justify-between text-bordeaux-800">
                    <div className="flex items-center gap-3">
                       <Info size={18} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Auditoría JM: {days} día(s)</span>
                    </div>
                    <span className="text-[10px] font-bold text-gold">R$ {vehicle.precio}/día</span>
                  </div>
                </div>

                <div className="bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-gray-100 shadow-xl space-y-10">
                  <h4 className="text-[11px] font-black text-bordeaux-950 uppercase tracking-[0.5em] flex items-center gap-4">
                    <User size={22} className="text-gold" /> Datos Titular
                  </h4>
                  <div className="space-y-6">
                    <input type="text" placeholder="Nombre completo" value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border-0 rounded-[2rem] font-bold text-sm shadow-inner focus:ring-4 focus:ring-bordeaux-50 outline-none" />
                    <input type="email" placeholder="Email contacto" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border-0 rounded-[2rem] font-bold text-sm shadow-inner focus:ring-4 focus:ring-bordeaux-50 outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Cédula / RG" value={formData.ci} onChange={(e) => setFormData({...formData, ci: e.target.value})} className="w-full px-5 py-5 bg-gray-50 border-0 rounded-2xl font-bold text-xs shadow-inner focus:ring-2 focus:ring-bordeaux-800 outline-none" />
                      <input type="tel" placeholder="WhatsApp" value={formData.celular} onChange={(e) => setFormData({...formData, celular: e.target.value})} className="w-full px-5 py-5 bg-gray-50 border-0 rounded-2xl font-bold text-xs shadow-inner focus:ring-2 focus:ring-bordeaux-800 outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                 <button 
                  onClick={() => setStep(2)}
                  disabled={!formData.cliente || !formData.ci || !isAvailable || !isPeriodValid}
                  className="bordeaux-gradient text-white px-24 py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.6em] shadow-2xl active:scale-95 disabled:opacity-30 transition-all hover:scale-[1.03]"
                >
                  Continuar al Contrato <ChevronRight size={28} />
                </button>
              </div>
            </div>
          )}

          {/* ... Pasos de contrato, firma, pago y validación permanecen iguales o con ligeras mejoras visuales ... */}
          {/* PASO 2: CONTRATO */}
          {step === 2 && (
            <div className="space-y-12 animate-fadeIn max-w-4xl mx-auto">
               <div className="bg-white p-10 md:p-20 rounded-[4rem] border border-gray-100 shadow-2xl font-serif text-sm leading-relaxed text-gray-800 space-y-8">
                  <div className="text-center border-b-2 border-bordeaux-800 pb-8 mb-10">
                    <h3 className="text-2xl font-black text-bordeaux-950 uppercase">Contrato de Arrendamiento Premium</h3>
                    <p className="text-[10px] font-black text-gold uppercase tracking-[0.5em] mt-2">JM Asociados Corporate Mobility</p>
                  </div>

                  <div className="space-y-6 text-justify airbnb-scrollbar max-h-[500px] overflow-y-auto pr-6">
                    <p><b>PRIMERA - OBJETO:</b> El arrendador otorga en alquiler al arrendatario la unidad <b>{vehicle.nombre}</b>, Chapa <b>{vehicle.placa}</b>, en perfecto estado.</p>
                    <p><b>SEGUNDA - DURACIÓN:</b> El arrendamiento tendrá una vigencia de <b>{days} día(s)</b>, desde el {formData.inicio} {formData.horaIni} hasta el {formData.fin} {formData.horaFin}.</p>
                    <p><b>TERCERA - PRECIO:</b> El costo total es de <b>R$ {fullTotalBRL}</b> (Gs. {(fullTotalBRL * exchangeRate).toLocaleString()}).</p>
                    <p><b>CUARTA - DEPÓSITO:</b> Se establece una garantía de Gs. 5.000.000 en caso de siniestro para cubrir deducibles del seguro.</p>
                    <p><b>QUINTA - USO:</b> El vehículo es para uso personal/ejecutivo. Queda prohibido el transporte de materiales ilícitos o uso en competencias.</p>
                    <p><b>SEXTA - KILOMETRAJE:</b> Límite de 200km/día. Exceso se cobrará a Gs. 50.000 por cada 10km excedentes.</p>
                    <p><b>SÉPTIMA - SEGURO:</b> Cobertura contra terceros y colisión mediante MAPFRE S.A. El arrendatario es responsable del deducible.</p>
                    <p><b>OCTAVA - MANTENIMIENTO:</b> El cliente debe vigilar niveles de aceite y agua. No se permite reparaciones sin autorización previa.</p>
                    <p><b>NOVENA - COMBUSTIBLE:</b> La unidad se entrega con tanque lleno y debe devolverse igual, bajo pena de recargo administrativo.</p>
                    <p><b>DÉCIMA - MULTAS:</b> El arrendatario es responsable legal por infracciones de tránsito cometidas durante el periodo contratado.</p>
                    <p><b>DÉCIMA PRIMERA - DEVOLUCIÓN:</b> En caso de retraso mayor a 2 horas, se cobrará una diaria adicional completa.</p>
                    <p><b>DÉCIMA SEGUNDA - JURISDICCIÓN:</b> Para cualquier litigio, las partes se someten a los Tribunales de Ciudad del Este, Paraguay.</p>
                  </div>

                  <div className="p-6 bg-bordeaux-50 rounded-3xl flex items-center gap-5 text-bordeaux-800">
                    <ShieldCheck size={32} />
                    <p className="text-[10px] font-bold uppercase leading-relaxed">He leído y acepto las 12 cláusulas por el periodo de {days} día(s).</p>
                  </div>
               </div>

               <button onClick={() => setStep(3)} className="w-full bordeaux-gradient text-white py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.6em] shadow-2xl hover:scale-[1.02] transition-all">
                 Aceptar y Firmar Digitalmente
               </button>
            </div>
          )}

          {/* PASO 3: FIRMA DIGITAL */}
          {step === 3 && (
            <div className="space-y-12 animate-fadeIn max-w-2xl mx-auto text-center">
               <div className="w-24 h-24 bg-bordeaux-50 rounded-full flex items-center justify-center mx-auto text-bordeaux-800 mb-8">
                  <PenTool size={40} />
               </div>
               <h3 className="text-3xl font-serif font-bold text-bordeaux-950">Validación de Identidad</h3>
               <p className="text-gray-500 font-medium">Por favor, escriba su nombre completo como firma digital para validar este documento legal.</p>

               <div className="space-y-8 bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl">
                  <input 
                    type="text" 
                    placeholder="Escriba su firma aquí..." 
                    value={formData.signature}
                    onChange={(e) => setFormData({...formData, signature: e.target.value})}
                    className="w-full border-b-2 border-bordeaux-800 py-6 text-2xl font-serif text-center text-bordeaux-950 outline-none bg-transparent placeholder:text-gray-100 italic"
                  />
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Al firmar, usted autoriza el débito de R$ {fullTotalBRL}.</p>
               </div>

               <button onClick={() => setStep(4)} disabled={!formData.signature} className="w-full bordeaux-gradient text-white py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.6em] shadow-2xl hover:scale-[1.02] disabled:opacity-20 transition-all">
                 Registrar Firma y Proceder al Pago
               </button>
            </div>
          )}

          {/* PASO 4: PAGO */}
          {step === 4 && (
            <div className="space-y-12 animate-fadeIn text-center max-w-4xl mx-auto">
               <div className="p-12 md:p-20 bg-white border border-gray-100 rounded-[3rem] space-y-10 shadow-2xl">
                  <div className="space-y-6">
                    <span className="text-[10px] font-black text-gold uppercase tracking-[0.6em]">Llave PIX JM VIP</span>
                    <code className="text-3xl md:text-6xl font-black text-bordeaux-950 block tracking-tighter p-6 bg-gray-50 rounded-3xl border border-gray-100">24510861818</code>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Marina Baez &bull; Corporate Desk</p>
                    <p className="text-4xl font-black text-bordeaux-800">R$ {fullTotalBRL}</p>
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Corresponde a {days} día(s) de alquiler</p>
                  </div>
                  
                  <button onClick={handleCopyPix} className={`w-full py-8 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.6em] transition-all duration-700 active:scale-95 flex items-center justify-center gap-6 shadow-xl ${copied ? 'bg-green-600 text-white' : 'bordeaux-gradient text-white'}`}>
                    {copied ? <><Check size={24}/> ¡Copiada!</> : <><Copy size={24}/> Copiar Llave PIX</>}
                  </button>
               </div>

               <button onClick={() => setStep(5)} className="w-full bg-bordeaux-950 text-white py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.6em] shadow-xl hover:bg-gold transition-all">
                 Ya realicé el pago, subir comprobante
               </button>
            </div>
          )}

          {/* PASO 5: VALIDACIÓN */}
          {step === 5 && (
            <div className="space-y-12 animate-fadeIn max-w-4xl mx-auto text-center">
               <div className="space-y-6 text-left">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-bordeaux-50 rounded-2xl flex items-center justify-center text-bordeaux-800">
                       <Upload size={24} />
                    </div>
                    <h4 className="text-[14px] font-black text-bordeaux-950 uppercase tracking-[0.6em]">Validación Final</h4>
                  </div>
                  
                  <label className={`group flex flex-col items-center justify-center min-h-[400px] rounded-[4rem] border-4 border-dashed transition-all duration-700 cursor-pointer bg-white ${receiptBase64 ? 'border-gold/40 shadow-gold/5' : 'border-gray-100 hover:border-gold/50'}`}>
                    <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={handleReceiptUpload} />
                    {receiptBase64 ? (
                      <div className="flex flex-col items-center gap-8 animate-fadeIn">
                        <img src={receiptBase64} className="h-64 w-auto rounded-[2rem] object-cover shadow-2xl border-4 border-white" alt="Comprobante" />
                        <span className="text-[9px] font-black text-gold uppercase tracking-[0.4em]">Toque para cambiar</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6">
                        <ImageIcon size={48} className="text-gray-200" />
                        <p className="text-sm font-black text-gray-400 uppercase tracking-[0.6em]">Subir Comprobante PIX</p>
                      </div>
                    )}
                  </label>
               </div>

               <button onClick={handleFinalConfirm} disabled={!receiptBase64} className="w-full bordeaux-gradient text-white py-12 rounded-[4rem] font-black text-xl uppercase tracking-[1em] shadow-2xl disabled:opacity-10 transition-all hover:scale-[1.03] flex items-center justify-center gap-6">
                  Confirmar Pre-Aprobación <MessageCircle size={32} />
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
