
import React from 'react';
import { Vehicle, Reservation } from '../types';
import { FileText, Printer, ShieldCheck, CheckCircle, Award } from 'lucide-react';

interface ContractDocumentProps {
  vehicle: Vehicle;
  data: Partial<Reservation>;
  days: number;
  totalPYG: number;
  signature?: string;
}

const ContractDocument: React.FC<ContractDocumentProps> = ({ vehicle, data, days, totalPYG, signature }) => {
  const todayDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const digitalTimestamp = new Date().toLocaleString('es-ES', { hour12: false });
  const digitalHash = Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 md:p-12 shadow-2xl rounded-[2.5rem] border border-gray-100 max-w-5xl mx-auto font-sans text-[11px] leading-relaxed text-gray-800 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bordeaux-50 rounded-xl flex items-center justify-center text-bordeaux-800">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-bordeaux-950">Contrato Oficial</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-gold">JM Asociados Corporate</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="bordeaux-gradient text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:shadow-xl transition-all active:scale-95"
        >
          <Printer size={16} /> Generar PDF / Imprimir
        </button>
      </div>

      <div id="printable-contract" className="space-y-6 bg-white p-8 rounded-[2rem] border border-gray-100 print:bg-white print:p-0 print:border-none print:space-y-4">
        {/* Header Contract */}
        <div className="text-center border-b-2 border-bordeaux-800 pb-6 mb-8 print:mb-4 print:pb-4">
           <img src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" className="h-16 mx-auto mb-4 opacity-80" alt="JM Logo" />
           <h1 className="text-xl font-black text-bordeaux-950 uppercase tracking-tight">CONTRATO DE ALQUILER DE VEHÍCULO</h1>
           <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Protocolo de Arrendamiento - Versión 2026</p>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 mb-6 print:gap-4 print:mb-4">
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 print:border print:bg-transparent">
              <h3 className="font-black uppercase text-[9px] text-gold tracking-widest mb-3 border-b border-gray-200 pb-1 italic">ARRENDADOR</h3>
              <div className="space-y-1 text-[10px]">
                <p><b>Razón Social:</b> J&M ASOCIADOS</p>
                <p><b>RUC / CI:</b> 1.702.076-0</p>
                <p><b>Dirección:</b> CURUPAYTU ESQUINA FARID RAHAL</p>
                <p><b>Ciudad:</b> CIUDAD DEL ESTE, PY</p>
                <p><b>Contacto:</b> +595 983 635 573</p>
              </div>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 print:border print:bg-transparent">
              <h3 className="font-black uppercase text-[9px] text-gold tracking-widest mb-3 border-b border-gray-200 pb-1 italic">ARRENDATARIO</h3>
              <div className="space-y-1 text-[10px]">
                <p><b>Nombre:</b> <span className="uppercase font-bold">{data.cliente || '________________________'}</span></p>
                <p><b>Documento:</b> {data.ci || '________________________'}</p>
                <p><b>Nacionalidad:</b> {data.ci?.includes('RG') ? 'BRASILEÑA' : 'PARAGUAYA'}</p>
                <p><b>Teléfono:</b> {data.celular || '________________________'}</p>
                <p><b>Email:</b> online@jmasociados.com</p>
              </div>
            </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-bordeaux-50/30 p-4 rounded-xl border border-bordeaux-100 print:border-gray-300 print:bg-transparent">
           <h3 className="font-black uppercase text-[9px] text-bordeaux-800 tracking-widest mb-3 border-b border-bordeaux-200 pb-1">UNIDAD ARRENDADA</h3>
           <div className="grid grid-cols-4 gap-4 text-[10px] print:grid-cols-4">
              <div><span className="block text-gray-400 text-[8px] uppercase">Vehículo</span><span className="font-bold">{vehicle.nombre}</span></div>
              <div><span className="block text-gray-400 text-[8px] uppercase">Matrícula</span><span className="font-bold">{vehicle.placa}</span></div>
              <div><span className="block text-gray-400 text-[8px] uppercase">Color</span><span className="font-bold">{vehicle.color}</span></div>
              <div><span className="block text-gray-400 text-[8px] uppercase">Kilometraje Salida</span><span className="font-bold">{vehicle.kilometrajeActual} KM</span></div>
           </div>
        </div>

        {/* Clauses */}
        <div className="text-justify leading-relaxed space-y-3 text-[10px] print:text-[9px]">
          <p><b>PRIMERA - Objeto y Estado:</b> El Arrendador entrega al Arrendatario el vehículo descrito en perfecto estado de funcionamiento, limpieza y conservación. El Arrendatario declara haberlo inspeccionado y recibirlo a su entera satisfacción.</p>
          <p><b>SEGUNDA - Vigencia:</b> El alquiler tendrá una duración de <b>{days} DÍAS</b>, desde el <b>{data.inicio?.split(' ')[0]}</b> hasta el <b>{data.fin?.split(' ')[0]}</b>. La no devolución en fecha y hora pactada generará multas automáticas.</p>
          <p><b>TERCERA - Valor y Pago:</b> El precio total pactado es de <b>R$ {data.total}</b>. El pago se realiza por adelantado. En caso de extensión, se deberá abonar la diferencia antes del nuevo periodo.</p>
          <p><b>CUARTA - Responsabilidad:</b> El Arrendatario asume plena responsabilidad CIVIL y PENAL por el uso del vehículo, así como por cualquier infracción de tránsito o siniestro ocurrido durante la vigencia del contrato.</p>
        </div>

        {/* SIGNATURE SECTION REDESIGNED */}
        <div className="pt-10 mt-6 grid grid-cols-2 gap-20 print:pt-8 print:gap-12">
          {/* Arrendador Signature */}
          <div className="text-center space-y-4">
            <div className="h-28 border-b-2 border-gray-200 flex flex-col items-center justify-center relative bg-gray-50/30 rounded-t-2xl border-dashed">
               <ShieldCheck size={40} className="text-bordeaux-800/10 absolute opacity-20" />
               <span className="font-serif text-2xl text-bordeaux-800 italic opacity-80">J&M Asociados</span>
               <div className="absolute bottom-2 right-2 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-1 border border-emerald-200">
                  <Award size={8}/> Sello Autorizado
               </div>
            </div>
            <div className="space-y-1">
               <p className="font-black text-bordeaux-950 uppercase tracking-[0.2em] text-[10px]">POR LA EMPRESA</p>
               <p className="text-[8px] text-gray-400 uppercase tracking-widest italic">Ciudad del Este, Paraguay</p>
            </div>
          </div>
          
          {/* Arrendatario Signature - Professional & Prominent */}
          <div className="text-center space-y-4">
            <div className={`h-28 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 rounded-t-2xl ${
              signature 
                ? 'bg-gray-50/50 border-b-2 border-gold shadow-inner' 
                : 'bg-gray-50/10 border-b-2 border-gray-200 border-dashed'
            }`}>
              {signature ? (
                <>
                  {/* Digital Paper Texture Background */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                       style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '6px 6px' }}>
                  </div>
                  
                  {/* Verified Seal */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white border border-gold/30 px-3 py-1.5 rounded-full shadow-sm z-20 animate-slideUp">
                     <CheckCircle size={10} className="text-emerald-500" />
                     <span className="text-[7px] font-black text-gold uppercase tracking-widest italic leading-none">Vínculo Verificado</span>
                  </div>

                  {/* Actual Signature Image */}
                  <img src={signature} alt="Firma Arrendatario" className="max-h-[80%] max-w-[90%] object-contain filter contrast-150 grayscale brightness-90 relative z-10" />
                  
                  {/* Digital ID & Timestamp */}
                  <div className="absolute bottom-2 left-3 flex flex-col items-start gap-0.5 z-20">
                     <p className="text-[6px] font-mono text-gray-400 uppercase leading-none">ID: {digitalHash}</p>
                     <p className="text-[6px] font-mono text-gray-400 uppercase leading-none">TS: {digitalTimestamp}</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-40">
                   <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
                   <div className="flex flex-col items-center gap-1">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] italic">Firma Digital</p>
                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Requerida para Validación JM</p>
                   </div>
                   <div className="absolute top-1/2 left-4 -translate-y-1/2 text-2xl font-serif text-gray-200 select-none">X</div>
                </div>
              )}
            </div>
            <div className="space-y-1">
               <p className="font-black text-bordeaux-950 uppercase tracking-[0.2em] text-[10px]">{data.cliente || 'EL CLIENTE'}</p>
               <p className="text-[8px] text-gray-400 uppercase tracking-widest italic">Aceptación Consentida vía App</p>
            </div>
          </div>
        </div>

        {/* Footer for Print */}
        <div className="pt-8 mt-10 border-t border-gray-100 flex justify-between items-center text-[8px] text-gray-400 uppercase font-black tracking-[0.4em] print:pt-4 print:mt-4">
           <span>DOC-REF: {data.id || 'JM-PEND'}</span>
           <span className="text-gold italic">JM Asociados Platinum Edition 2026</span>
           <span>Generado: {digitalTimestamp}</span>
        </div>
      </div>
      
      {/* Legal Footer Note (Visible in Print) */}
      <div className="mt-8 text-[7px] text-gray-400 italic text-center uppercase tracking-widest print:mt-4">
        Este documento posee validez contractual mediante aceptación electrónica de términos y condiciones JM. 
        Toda reproducción debe ir acompañada del sello de verificación digital.
      </div>
    </div>
  );
};

export default ContractDocument;
