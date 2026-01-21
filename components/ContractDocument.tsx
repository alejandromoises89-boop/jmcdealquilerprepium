
import React from 'react';
import { Vehicle, Reservation } from '../types';
import { FileText, Printer, Download, ShieldCheck } from 'lucide-react';

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
    <div className="bg-white p-6 md:p-12 shadow-2xl rounded-[2.5rem] border border-gray-100 max-w-5xl mx-auto font-sans text-[11px] leading-relaxed text-gray-800 print:shadow-none print:border-none print:p-0">
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

      <div id="printable-contract" className="space-y-6 bg-gray-50/30 p-8 rounded-[2rem] border border-gray-100 print:bg-white print:p-0 print:border-none">
        <div className="text-center space-y-2 border-b-2 border-bordeaux-800 pb-6 mb-8">
          <h1 className="text-xl font-black text-bordeaux-950 uppercase tracking-tight">CONTRATO DE ALQUILER DE VEHÍCULO Y AUTORIZACIÓN PARA CONDUCIR</h1>
        </div>

        <div className="space-y-4">
          <p className="font-bold">Entre:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-gray-100">
            <div className="space-y-2">
              <p className="font-black uppercase text-[9px] text-gold tracking-widest">ARRENDADOR:</p>
              <p><b>Nombre:</b> J&M ASOCIADOS</p>
              <p><b>Cédula de Identidad:</b> 1.702.076-0</p>
              <p><b>Domicilio:</b> CURUPAYTU ESQUINA FARID RAHAL</p>
              <p><b>Teléfono:</b> +595983635573</p>
            </div>
            <div className="space-y-2">
              <p className="font-black uppercase text-[9px] text-gold tracking-widest">ARRENDATARIO:</p>
              <p><b>Nombre:</b> <span className="uppercase font-bold">{data.cliente || '________________________'}</span></p>
              <p><b>Cédula de Identidad / RG:</b> {data.ci || '________________________'}</p>
              <p><b>Domicilio:</b> {data.ci?.includes('RG') ? 'BRASIL' : 'PARAGUAY'}</p>
              <p><b>Teléfono:</b> {data.celular || '________________________'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-justify leading-relaxed">
          <p>Se acuerda lo siguiente:</p>
          
          <p><b>PRIMERA - Objeto del Contrato.</b> El arrendador otorga en alquiler al arrendatario el siguiente vehículo:
            <br/>* Marca: <b>{vehicle.nombre.split(' ')[0]}</b>. 
            <br/>* Modelo: <b>{vehicle.nombre.split(' ').slice(1).join(' ')}</b>.
            <br/>* Color: <b>{vehicle.color || 'SEGÚN REGISTRO'}</b>.
            <br/>* Número de CHAPA: <b>{vehicle.placa}</b>.
          </p>
          <p>El vehículo se encuentra en perfecto estado de funcionamiento y libre de cargas o gravámenes. El arrendatario confirma la recepción del vehículo en buen estado, tras realizar una inspección visual y técnica con soporte Técnico VIDEO del Vehículo. <b>EL ARRENDADOR AUTORIZA AL ARRENDATARIO A CONDUCIR EL VEHÍCULO EN TODO EL TERRITORIO PARAGUAYO Y EL MERCOSUR.</b></p>

          <p><b>SEGUNDA - Duración del Contrato.</b> El presente contrato tendrá una duración de <b>{days} ({days === 1 ? 'UN' : days === 2 ? 'DOS' : days === 3 ? 'TRES' : days}) DÍAS</b>, comenzando el {data.inicio?.split(' ')[0] || '___/___/___'} y finalizando el {data.fin?.split(' ')[0] || '___/___/___'}, salvo que se acuerde otra cosa por ambas partes mediante una extensión o terminación anticipada.</p>

          <p><b>TERCERA - Precio y Forma de Pago.</b> El arrendatario se compromete a pagar al arrendador la cantidad de R$ {vehicle.precio} (o su equivalente en Guaraníes Gs. {(vehicle.precio * 1450).toLocaleString()}) por cada día de alquiler. <b>TOTAL DEL CONTRATO: R$ {data.total}</b> (Aprox. Gs. {totalPYG.toLocaleString()}). El pago se realizará por adelantado mediante Efectivo o Transferencia Electrónica.</p>

          <p><b>CUARTA - Depósito de Seguridad.</b> El arrendatario pagará cinco millones de guaraníes (Gs. 5.000.000) en caso de siniestro (accidente) para cubrir los daños al vehículo durante el periodo de alquiler.</p>

          <p><b>QUINTA - Condiciones de Uso.</b> 1. El vehículo será utilizado exclusivamente para fines personales. 2. El ARRENDATARIO es responsable PENAL y CIVIL, de todo lo ocurrido dentro del vehículo y/o encontrado durante el alquiler. 3. El arrendatario se compromete a no subarrendar el vehículo ni permitir que terceros lo conduzcan sin autorización.</p>

          <p><b>SEXTA - Kilometraje.</b> El alquiler incluye un límite de 200 kilómetros por día. En caso de superar este límite, el arrendatario pagará 100.000 guaraníes adicionales por los kilómetros excedentes.</p>

          <p><b>SÉPTIMA - Seguro.</b> El vehículo cuenta con seguro básico de Responsabilidad CIVIL, cobertura en accidentes y rastreo satelital. El arrendatario será responsable de los daños no cubiertos por negligencia.</p>

          <p><b>OCTAVA - Mantenimiento.</b> El arrendatario se compromete a mantener el vehículo en buen estado (Agua, combustible, limpieza). Las reparaciones por uso indebido serán responsabilidad del arrendatario.</p>

          <p><b>NOVENA - Devolución.</b> El arrendatario devolverá el vehículo en la misma condición recibida. Retrasos incurrirán en penalizaciones de media o una diaria completa.</p>

          <p><b>DÉCIMA - Jurisdicción.</b> Para cualquier disputa, las partes se someten a la jurisdicción de los tribunales del Alto Paraná, Paraguay.</p>
        </div>

        <div className="pt-16 grid grid-cols-2 gap-20">
          <div className="text-center space-y-4">
            <div className="h-24 border-b border-gray-200 flex items-end justify-center pb-2">
               <img src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" className="h-14 opacity-20 grayscale" alt="Sello JM" />
            </div>
            <p className="font-black text-bordeaux-950 uppercase tracking-widest text-[9px]">J&M ASOCIADOS</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase">Arrendador</p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-24 border-b border-gray-200 flex items-center justify-center italic text-bordeaux-800 font-serif text-lg">
              {signature ? (
                <div className="flex flex-col items-center">
                  <span className="text-bordeaux-800 font-serif mb-1">{signature}</span>
                  <ShieldCheck size={16} className="text-green-500" />
                </div>
              ) : (
                <span className="text-gray-200">Firma Digital del Arrendatario</span>
              )}
            </div>
            <p className="font-black text-bordeaux-950 uppercase tracking-widest text-[9px]">{data.cliente || 'CLIENTE'}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase">Arrendatario</p>
          </div>
        </div>

        <p className="text-[8px] text-center text-gray-400 pt-10 uppercase font-bold tracking-[0.2em]">
          Contrato generado digitalmente en Ciudad del Este, Paraguay a los {todayDate}.
        </p>
      </div>
    </div>
  );
};

export default ContractDocument;
