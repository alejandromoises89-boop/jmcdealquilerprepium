import React from 'react';
import { Vehicle, Reservation } from '../types';
import { FileText, Printer, ShieldCheck } from 'lucide-react';

interface ContractDocumentProps {
  vehicle: Vehicle;
  data: Partial<Reservation>;
  days: number;
  totalPYG: number;
  signature?: string;
}

const ContractDocument: React.FC<ContractDocumentProps> = ({ vehicle, data, days, totalPYG, signature }) => {
  const todayDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  
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
              <h3 className="font-black uppercase text-[9px] text-gold tracking-widest mb-3 border-b border-gray-200 pb-1">ARRENDADOR</h3>
              <div className="space-y-1 text-[10px]">
                <p><b>Razón Social:</b> J&M ASOCIADOS</p>
                <p><b>RUC / CI:</b> 1.702.076-0</p>
                <p><b>Dirección:</b> CURUPAYTU ESQUINA FARID RAHAL</p>
                <p><b>Ciudad:</b> CIUDAD DEL ESTE, PY</p>
                <p><b>Contacto:</b> +595 983 635 573</p>
              </div>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 print:border print:bg-transparent">
              <h3 className="font-black uppercase text-[9px] text-gold tracking-widest mb-3 border-b border-gray-200 pb-1">ARRENDATARIO</h3>
              <div className="space-y-1 text-[10px]">
                <p><b>Nombre:</b> <span className="uppercase font-bold">{data.cliente || '________________________'}</span></p>
                <p><b>Documento (CI/RG):</b> {data.ci || '________________________'}</p>
                <p><b>Nacionalidad:</b> {data.ci?.includes('RG') ? 'BRASILEÑA' : 'PARAGUAYA'}</p>
                <p><b>Teléfono:</b> {data.celular || '________________________'}</p>
                <p><b>Domicilio:</b> ________________________</p>
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

          <p><b>QUINTA - Franquicia:</b> Se establece una franquicia (deducible) de Gs. 5.000.000 en caso de siniestro, a cargo exclusivo del Arrendatario.</p>

          <p><b>SEXTA - Jurisdicción:</b> Las partes se someten a la jurisdicción de los tribunales de Ciudad del Este para cualquier controversia derivada de este contrato.</p>
        </div>

        {/* Signatures */}
        <div className="pt-12 mt-4 grid grid-cols-2 gap-20 print:pt-8 print:gap-12">
          <div className="text-center space-y-4">
            <div className="h-24 border-b border-gray-300 flex items-end justify-center pb-2">
               <span className="font-script text-2xl text-gray-400">J&M Asociados</span>
            </div>
            <div className="space-y-1">
               <p className="font-black text-bordeaux-950 uppercase tracking-widest text-[9px]">POR LA EMPRESA</p>
               <p className="text-[8px] text-gray-400 uppercase">Firma Autorizada y Sello</p>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <div className={`h-24 flex items-center justify-center relative overflow-hidden ${
              signature 
                ? 'bg-white' 
                : 'border-b border-gray-300'
            }`}>
              {signature ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <div className="absolute inset-0 opacity-[0.05] print:opacity-[0.1]" 
                       style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '4px 4px' }}>
                  </div>
                  <img src={signature} alt="Firma" className="max-h-full max-w-full object-contain filter contrast-125 relative z-10" />
                  <div className="absolute bottom-0 right-0">
                     <span className="text-[6px] font-mono text-gray-400 uppercase">DIGITAL ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                  </div>
                </div>
              ) : (
                <span className="text-gray-300 italic">Firma del Cliente</span>
              )}
            </div>
            <div className="space-y-1">
               <p className="font-black text-bordeaux-950 uppercase tracking-widest text-[9px]">{data.cliente || 'EL CLIENTE'}</p>
               <p className="text-[8px] text-gray-400 uppercase">Aceptación Plena de Términos</p>
            </div>
          </div>
        </div>

        {/* Footer for Print */}
        <div className="pt-8 mt-8 border-t border-gray-100 flex justify-between items-center text-[8px] text-gray-400 uppercase font-bold tracking-widest print:pt-4 print:mt-4">
           <span>DOC. REF: {data.id}</span>
           <span>Página 1 de 1</span>
           <span>Generado: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ContractDocument;