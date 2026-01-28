import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, Reservation, Gasto, MaintenanceRecord, ExpirationRecord, ChecklistLog, InspectionItem } from '../types';
import { 
  Landmark, FileText, Wrench, Plus, Trash2, Printer, 
  CheckCircle2, AlertTriangle, UserPlus, Download, TrendingUp, TrendingDown,
  ArrowRight, PieChart as PieChartIcon, BarChart3, ClipboardList, 
  Car, ShieldCheck, Edit3, X, Settings, Bell,
  Sparkles, Bot, Video, MapPin, Globe, Loader2, Play, Image as ImageIcon,
  HandCoins, Repeat, Calculator, PenTool,
  CalendarClock, HardDrive, Save, FileSignature, Camera, Send, Check, Fuel, Gauge, User
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import ContractDocument from './ContractDocument';

interface AdminPanelProps {
  flota: Vehicle[];
  setFlota: (flota: Vehicle[]) => void;
  reservations: Reservation[];
  setReservations: (res: Reservation[]) => void;
  onDeleteReservation?: (id: string) => void;
  gastos: Gasto[];
  setGastos: (gastos: Gasto[]) => void;
  mantenimientos: MaintenanceRecord[];
  setMantenimientos: (records: MaintenanceRecord[]) => void;
  vencimientos: ExpirationRecord[];
  setVencimientos: (records: ExpirationRecord[]) => void;
  exchangeRate: number;
  language?: string;
  onSyncSheet?: () => void;
  isSyncing?: boolean;
  breakdowns?: any[];
  setBreakdowns?: (b: any[]) => void;
  onAddReservation?: (res: Reservation) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
  isError?: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  flota = [], setFlota, reservations = [], setReservations, onDeleteReservation, 
  exchangeRate, gastos = [], setGastos, mantenimientos = [], setMantenimientos, 
  vencimientos = [], setVencimientos, onAddReservation,
  isSyncing
}) => {
  const [activeTab, setActiveTab] = useState<'finanzas' | 'contratos' | 'flota' | 'taller' | 'checklists' | 'ai_studio' | 'vencimientos'>('finanzas');
  const [finanzasFilter, setFinanzasFilter] = useState({ start: '', end: '', vehicle: '' });
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualRes, setManualRes] = useState({ cliente: '', auto: '', inicio: '', fin: '', total: 0 });
  
  // Modals de Edición
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  
  const [viewingContract, setViewingContract] = useState<Reservation | null>(null);
  const [expandedMaintenance, setExpandedMaintenance] = useState<Record<string, boolean>>({});
  const [managingRes, setManagingRes] = useState<Reservation | null>(null);
  const [manageMode, setManageMode] = useState<'swap' | 'cancel'>('swap');
  const [swapVehicleId, setSwapVehicleId] = useState('');
  const [manualSwapValues, setManualSwapValues] = useState({ newTotal: 0, diff: 0 });
  const [manualCancelValues, setManualCancelValues] = useState({ penalty: 0, refund: 0 });
  const [customObs, setCustomObs] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    nombre: '', precio: 0, placa: '', color: '', kilometrajeActual: 0,
    transmision: 'Automático', combustible: 'Nafta', asientos: 5, tipo: 'Compacto',
    img: '', specs: []
  });
  const [tempSpec, setTempSpec] = useState('');

  // Checklist States
  const [showNewChecklist, setShowNewChecklist] = useState<string | null>(null); // ID del vehículo
  const [checklistType, setChecklistType] = useState<'Check-In' | 'Check-Out'>('Check-In');
  const [currentChecklist, setCurrentChecklist] = useState<Partial<ChecklistLog>>({
    responsable: '',
    kilometraje: 0,
    combustible: 'Full',
    observacionesGlobales: '',
    exterior: [
      { label: 'Chapa y Pintura', status: 'ok' },
      { label: 'Neumáticos', status: 'ok' },
      { label: 'Luces / Faros', status: 'ok' },
      { label: 'Espejos', status: 'ok' },
      { label: 'Cristales', status: 'ok' }
    ],
    interior: [
      { label: 'Tapicería', status: 'ok' },
      { label: 'Tablero / Instrumentos', status: 'ok' },
      { label: 'Aire Acondicionado', status: 'ok' },
      { label: 'Limpieza', status: 'ok' },
      { label: 'Gato / Herramientas', status: 'ok' }
    ],
    mecanica: [
      { label: 'Niveles (Aceite/Agua)', status: 'ok' },
      { label: 'Frenos', status: 'ok' },
      { label: 'Batería', status: 'ok' }
    ],
    documentacion: [
      { label: 'Habilitación Municipal', status: 'ok' },
      { label: 'Cédula Verde', status: 'ok' },
      { label: 'Seguro Mapfre', status: 'ok' }
    ]
  });

  // AI STUDIO
  const [aiTab, setAiTab] = useState<'chat' | 'veo'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [groundingMode, setGroundingMode] = useState<'none' | 'search' | 'maps'>('none');
  const [veoPrompt, setVeoPrompt] = useState('');
  const [veoImage, setVeoImage] = useState<string | null>(null);
  const [veoAspectRatio, setVeoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isVeoGenerating, setIsVeoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [newExpiration, setNewExpiration] = useState<Partial<ExpirationRecord>>({
    tipo: 'Seguro', monto: 0, vencimiento: '', vehicleId: '', pagado: false
  });

  // --- EXPORTACIÓN CSV ---
  const exportToCSV = (data: any[], fileName: string) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => {
        const clean = String(val).replace(/"/g, '""');
        return `"${clean}"`;
      }).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8,\ufeff" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- LOGIC: AUTO-CALCULO TOTAL MANUAL ---
  useEffect(() => {
    if (showManualBooking && manualRes.auto && manualRes.inicio && manualRes.fin) {
      const v = flota.find(f => f.nombre === manualRes.auto);
      if (v) {
        const start = new Date(manualRes.inicio);
        const end = new Date(manualRes.fin);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 
        const calcTotal = days * v.precio;
        setManualRes(prev => ({...prev, total: calcTotal}));
      }
    }
  }, [manualRes.auto, manualRes.inicio, manualRes.fin, showManualBooking, flota]);

  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    if(dStr.includes('/')) {
       const [d, m, y] = dStr.split('/');
       return new Date(Number(y), Number(m)-1, Number(d));
    }
    const parts = dStr.split('-');
    if(parts.length === 3) return new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
    return new Date(dStr);
  };

  const calculatePenalty = (res: Reservation) => {
     const start = parseDate(res.inicio);
     const end = parseDate(res.fin);
     if (isNaN(start.getTime()) || isNaN(end.getTime())) return { days: 0, penalty: 0, refund: 0, rate: 0 };
     const diffTime = Math.abs(end.getTime() - start.getTime());
     const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
     const penaltyRate = days <= 5 ? 0.15 : 0.50;
     const penalty = Math.round(res.total * penaltyRate);
     const refund = res.total - penalty;
     return { days, penalty, refund, rate: penaltyRate * 100 };
  };

  const handleApplyChanges = () => {
    if (!managingRes) return;
    let updatedReservations = [...reservations];
    const dateNow = new Date().toLocaleDateString('es-PY');
    if (manageMode === 'swap') {
       if (!swapVehicleId) return alert('Seleccione un vehículo');
       const targetVehicle = flota.find(v => v.id === swapVehicleId);
       if (!targetVehicle) return;
       const { newTotal, diff } = manualSwapValues;
       updatedReservations = updatedReservations.map(r => 
          r.id === managingRes.id ? { 
            ...r, auto: targetVehicle.nombre, total: newTotal,
            obs: `${r.obs || ''} | [CAMBIO ${dateNow}]: ${managingRes.auto} -> ${targetVehicle.nombre}. Nuevo Total: R$ ${newTotal}. Dif: R$ ${diff}. Nota: ${customObs || 'Sin notas.'}`
          } : r
       );
       alert(diff > 0 ? `Unidad cambiada. El cliente debe abonar la diferencia de R$ ${diff}.` : `Unidad cambiada. Saldo a favor del cliente: R$ ${Math.abs(diff)}.`);
    } else if (manageMode === 'cancel') {
       const { penalty, refund } = manualCancelValues;
       if(!confirm(`CONFIRMACIÓN DE RESCISIÓN MANUAL\n\nTotal Original: R$ ${managingRes.total}\n\nRetención (Multa Definida): R$ ${penalty}\nDevolución Cliente: R$ ${refund}\n\n¿Proceder con estos valores?`)) return;
       const obsText = ` | [RESCISIÓN ${dateNow}]: Contrato cancelado. Multa retenida: R$ ${penalty}. Devolución autorizada al cliente: R$ ${refund}. Nota: ${customObs || 'Ajuste manual aplicado.'}`;
       updatedReservations = updatedReservations.map(r => r.id === managingRes.id ? { ...r, status: 'Cancelled', obs: (r.obs || '') + obsText } : r);
       alert(`Contrato rescindido. Se ha dejado constancia en el historial.`);
    }
    setReservations(updatedReservations);
    setManagingRes(null);
    setCustomObs('');
  };

  const handleVerifyPayment = (resId: string) => {
    if(confirm("¿Validar manualmente el pago de esta reserva y marcar como CONFIRMADA?")) {
        setReservations(reservations.map(r => r.id === resId ? {...r, status: 'Confirmed'} : r));
    }
  };

  const handleMaintenancePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, maintenanceId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMantenimientos(mantenimientos.map(m => m.id === maintenanceId ? { ...m, images: [...(m.images || []), reader.result as string] } : m));
      };
      reader.readAsDataURL(file);
    }
  };

  const stats = useMemo(() => {
    const filteredRes = reservations.filter(r => {
      const matchV = finanzasFilter.vehicle ? r.auto === finanzasFilter.vehicle : true;
      const matchD = (finanzasFilter.start && finanzasFilter.end) ? (new Date(r.inicio) >= new Date(finanzasFilter.start) && new Date(r.inicio) <= new Date(finanzasFilter.end)) : true;
      return matchV && matchD;
    });
    const filteredGastos = gastos.filter(g => {
      const matchV = finanzasFilter.vehicle ? g.vehicleId === finanzasFilter.vehicle : true;
      const matchD = (finanzasFilter.start && finanzasFilter.end) ? (new Date(g.fecha) >= new Date(finanzasFilter.start) && new Date(g.fecha) <= new Date(finanzasFilter.end)) : true;
      return matchV && matchD;
    });
    const income = filteredRes.reduce((s, r) => s + (r.total || 0), 0);
    const expense = filteredGastos.reduce((s, g) => s + (g.monto || 0), 0) + mantenimientos.reduce((s, m) => s + m.monto, 0);
    const monthlyData = new Map();
    filteredRes.forEach(r => {
      if(!r.inicio) return;
      const month = r.inicio.substring(0, 7);
      if (!monthlyData.has(month)) monthlyData.set(month, { name: month, ing: 0, gas: 0 });
      monthlyData.get(month).ing += r.total;
    });
    filteredGastos.forEach(g => {
       if(!g.fecha) return;
       const month = g.fecha.substring(0, 7);
       if (!monthlyData.has(month)) monthlyData.set(month, { name: month, ing: 0, gas: 0 });
       monthlyData.get(month).gas += g.monto;
    });
    const areaData = Array.from(monthlyData.values()).sort((a,b) => a.name.localeCompare(b.name));
    const pieData = [
      { name: 'Operativo', value: filteredGastos.filter(g => g.categoria === 'Operativo').reduce((s, g) => s + g.monto, 0) },
      { name: 'Taller', value: mantenimientos.reduce((s, m) => s + m.monto, 0) },
      { name: 'Seguros', value: filteredGastos.filter(g => g.categoria === 'Seguros').reduce((s, g) => s + g.monto, 0) },
      { name: 'Cuotas', value: filteredGastos.filter(g => g.categoria === 'Cuotas').reduce((s, g) => s + g.monto, 0) }
    ].filter(v => v.value > 0);
    return { income, expense, balance: income - expense, areaData, pieData };
  }, [reservations, gastos, mantenimientos, finanzasFilter]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      let modelName = 'gemini-3-pro-preview';
      let tools: any[] = [];
      if (groundingMode === 'search') { modelName = 'gemini-3-flash-preview'; tools = [{ googleSearch: {} }]; }
      else if (groundingMode === 'maps') { modelName = 'gemini-2.5-flash'; tools = [{ googleMaps: {} }]; }
      const response = await ai.models.generateContent({
        model: modelName, contents: userMsg,
        config: { tools: tools.length > 0 ? tools : undefined, systemInstruction: "Eres un asistente ejecutivo para 'JM Alquiler de Vehículos'. Responde de forma breve, profesional y estratégica." }
      });
      let responseText = response.text || "No response text.";
      let sources: { uri: string; title: string }[] = [];
      if (groundingMode === 'search') {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) chunks.forEach((c: any) => { if (c.web?.uri) sources.push({ uri: c.web.uri, title: c.web.title || 'Fuente Externa' }); });
      } else if (groundingMode === 'maps') {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
         if (chunks) chunks.forEach((c: any) => { if(c.web?.uri) sources.push({ uri: c.web.uri, title: "Google Maps"}); });
      }
      setChatMessages(prev => [...prev, { role: 'model', text: responseText, sources }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Error de conexión con IA.", isError: true }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!veoImage) return alert("Imagen requerida.");
    setIsVeoGenerating(true);
    setGeneratedVideoUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const base64Image = veoImage.split(',')[1];
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: veoPrompt || "Cinematic shot of this car driving, 4k",
        image: { imageBytes: base64Image, mimeType: 'image/png' },
        config: { numberOfVideos: 1, aspectRatio: veoAspectRatio, resolution: '720p' }
      });
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) setGeneratedVideoUrl(`${videoUri}&key=${process.env.API_KEY}`);
    } catch (error) {
      alert("Error: " + error);
    } finally { setIsVeoGenerating(false); }
  };

  const handleVeoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVeoImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveVehicle = () => {
     if(!newVehicle.nombre || !newVehicle.precio || !newVehicle.placa) return alert("Complete los campos obligatorios (*)");
     const finalVehicle: Vehicle = {
        id: `V-${Date.now()}`,
        nombre: newVehicle.nombre || 'Nuevo Vehículo',
        precio: Number(newVehicle.precio),
        img: newVehicle.img || 'https://via.placeholder.com/400x200?text=Sin+Imagen',
        estado: 'Disponible',
        placa: newVehicle.placa || 'SIN-PLACA',
        color: newVehicle.color || 'Blanco',
        specs: newVehicle.specs || [],
        kilometrajeActual: Number(newVehicle.kilometrajeActual),
        transmision: newVehicle.transmision,
        combustible: newVehicle.combustible,
        asientos: Number(newVehicle.asientos),
        tipo: newVehicle.tipo,
        checklists: []
     };
     setFlota([...flota, finalVehicle]);
     setShowAddVehicle(false);
     setNewVehicle({ nombre: '', precio: 0, placa: '', color: '', kilometrajeActual: 0, transmision: 'Automático', combustible: 'Nafta', asientos: 5, tipo: 'Compacto', img: '', specs: [] });
  };

  const addSpec = () => {
    if (tempSpec && newVehicle.specs) {
       setNewVehicle({...newVehicle, specs: [...newVehicle.specs, tempSpec]});
       setTempSpec('');
    }
  };

  const handleAddExpiration = () => {
    if (!newExpiration.vehicleId || !newExpiration.vencimiento || !newExpiration.monto) return alert("Complete todos los campos");
    const vehicle = flota.find(f => f.id === newExpiration.vehicleId);
    const record: ExpirationRecord = {
       id: `VENC-${Date.now()}`,
       vehicleId: newExpiration.vehicleId,
       vehicleName: vehicle ? vehicle.nombre : 'Desconocido',
       tipo: newExpiration.tipo || 'Seguro',
       vencimiento: newExpiration.vencimiento,
       monto: Number(newExpiration.monto),
       pagado: false,
       referencia: newExpiration.referencia || ''
    };
    setVencimientos([...vencimientos, record]);
    setNewExpiration({ tipo: 'Seguro', monto: 0, vencimiento: '', vehicleId: '', pagado: false });
  };

  const handleSaveChecklist = () => {
    if (!currentChecklist.responsable || !currentChecklist.kilometraje) return alert("Complete Responsable y KM");
    
    const vehicle = flota.find(v => v.id === showNewChecklist);
    if (!vehicle) return;

    const checklist: ChecklistLog = {
      id: `CH-${Date.now()}`,
      tipo: checklistType,
      fecha: new Date().toISOString(),
      responsable: currentChecklist.responsable || '',
      kilometraje: currentChecklist.kilometraje || 0,
      combustible: currentChecklist.combustible as any,
      exterior: currentChecklist.exterior as any,
      interior: currentChecklist.interior as any,
      mecanica: currentChecklist.mecanica as any,
      documentacion: currentChecklist.documentacion as any,
      observacionesGlobales: currentChecklist.observacionesGlobales || '',
      firmado: true
    };

    const updatedVehicle = {
      ...vehicle,
      kilometrajeActual: checklistType === 'Check-In' ? checklist.kilometraje : vehicle.kilometrajeActual,
      checklists: [...(vehicle.checklists || []), checklist]
    };

    setFlota(flota.map(v => v.id === showNewChecklist ? updatedVehicle : v));
    setShowNewChecklist(null);
    alert(`Inspección ${checklistType} guardada con éxito.`);
  };

  const updateItemStatus = (category: string, index: number, status: 'ok' | 'bad' | 'na') => {
    const list = [...(currentChecklist as any)[category]];
    list[index].status = status;
    setCurrentChecklist({ ...currentChecklist, [category]: list });
  };

  const COLORS = ['#800000', '#D4AF37', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-8 animate-slideUp pb-40 max-w-full overflow-x-hidden relative">
      
      {/* HEADER GESTIÓN */}
      <div className="px-4 flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-robust text-bordeaux-950 dark:text-white italic tracking-tighter leading-none">CENTRO DE GESTIÓN MASTER</h2>
          <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
            <ShieldCheck size={14}/> Terminal de Control Operativo
          </p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="p-4 bg-gray-950 text-white rounded-[1.5rem] shadow-2xl hover:scale-105 transition-transform" title="Generar PDF (Imprimir)">
              <Printer size={20}/>
           </button>
           <button onClick={() => {
              if (activeTab === 'contratos') exportToCSV(reservations, 'Contratos_JM');
              else if (activeTab === 'flota') exportToCSV(flota, 'Flota_JM');
              else if (activeTab === 'taller') exportToCSV(mantenimientos, 'Taller_JM');
              else if (activeTab === 'vencimientos') exportToCSV(vencimientos, 'Alertas_JM');
              else alert("Exportación no disponible para esta pestaña");
           }} className="p-4 bg-bordeaux-800 text-white rounded-[1.5rem] shadow-2xl hover:scale-105 transition-transform flex items-center gap-2" title="Exportar CSV">
              <Download size={20}/> <span className="text-[9px] font-black uppercase hidden lg:inline">CSV</span>
           </button>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex bg-white dark:bg-dark-elevated p-2 rounded-[3rem] border-2 dark:border-white/5 overflow-x-auto gap-2 scrollbar-hide shadow-xl print:hidden">
        {[
          {id:'finanzas', icon: Landmark, label: 'Finanzas'},
          {id:'contratos', icon: FileText, label: 'Contratos'},
          {id:'flota', icon: Car, label: 'Flota'},
          {id:'taller', icon: Wrench, label: 'Taller'},
          {id:'checklists', icon: ClipboardList, label: 'Inspecciones'},
          {id:'vencimientos', icon: Bell, label: 'Vencimientos'},
          {id:'ai_studio', icon: Sparkles, label: 'AI Studio'}
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
            className={`flex flex-col items-center justify-center gap-1.5 min-w-[100px] py-5 rounded-[2.2rem] transition-all ${
              activeTab === tab.id ? 'bg-bordeaux-950 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-bordeaux-800'
            }`}>
            <tab.icon size={18} />
            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* --- FINANZAS --- */}
      {activeTab === 'finanzas' && (
        <div className="space-y-8 animate-fadeIn px-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-gradient-to-br from-white to-emerald-50/50 dark:from-dark-card dark:to-emerald-900/10 p-8 rounded-[3rem] border-l-8 border-emerald-500 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><TrendingUp size={24}/></div>
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">INGRESOS</span>
                </div>
                <h3 className="text-4xl font-robust dark:text-white italic relative z-10">R$ {stats.income.toLocaleString()}</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 italic border-t border-gray-100 dark:border-white/5 pt-2 relative z-10">Gs. {(stats.income * exchangeRate).toLocaleString()}</p>
             </div>
             <div className="bg-gradient-to-br from-white to-rose-50/50 dark:from-dark-card dark:to-rose-900/10 p-8 rounded-[3rem] border-l-8 border-rose-500 shadow-xl relative overflow-hidden">
                 <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl"><TrendingDown size={24}/></div>
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">EGRESOS</span>
                </div>
                <h3 className="text-4xl font-robust dark:text-white italic relative z-10">R$ {stats.expense.toLocaleString()}</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 italic border-t border-gray-100 dark:border-white/5 pt-2 relative z-10">Gs. {(stats.expense * exchangeRate).toLocaleString()}</p>
             </div>
             <div className="bg-gradient-to-br from-bordeaux-950 to-bordeaux-900 p-8 rounded-[3rem] border-2 border-gold/20 shadow-xl relative overflow-hidden">
                <p className="text-[9px] font-black text-gold uppercase mb-2">Balance Neto</p>
                <h3 className="text-5xl font-robust text-white italic mt-4">R$ {stats.balance.toLocaleString()}</h3>
                <p className="text-sm font-bold text-gold/60 mt-2 italic">Gs. {(stats.balance * exchangeRate).toLocaleString()}</p>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
             <div className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] shadow-xl h-[400px] border dark:border-white/5 relative print:mb-10">
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 flex items-center gap-2"><BarChart3 size={16}/> Tendencia Mensual</h4>
                <ResponsiveContainer width="100%" height="90%">
                   <AreaChart data={stats.areaData}>
                      <defs>
                        <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                      <Tooltip />
                      <Area type="monotone" dataKey="ing" stroke="#10b981" fillOpacity={1} fill="url(#colorIng)" />
                      <Area type="monotone" dataKey="gas" stroke="#ef4444" fillOpacity={1} fill="url(#colorGas)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
             <div className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] shadow-xl h-[400px] border dark:border-white/5">
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 flex items-center gap-2"><PieChartIcon size={16}/> Gastos Operativos</h4>
                <ResponsiveContainer width="100%" height="90%">
                   <PieChart>
                      <Pie data={stats.pieData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                         {stats.pieData.map((_, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {/* --- INSPECCIONES (CHECKLISTS) --- */}
      {activeTab === 'checklists' && (
        <div className="space-y-10 px-2 animate-fadeIn">
          {!showNewChecklist ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {flota.map(v => (
                 <div key={v.id} className="bg-white dark:bg-dark-card p-8 rounded-[3.5rem] border dark:border-white/5 shadow-xl flex flex-col items-center gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><ClipboardList size={80}/></div>
                    <img src={v.img} className="w-40 h-24 object-contain transition-transform group-hover:scale-110" />
                    <div className="text-center">
                       <h4 className="text-xl font-robust dark:text-white uppercase italic">{v.nombre}</h4>
                       <p className="text-[9px] font-black text-gold uppercase tracking-widest">{v.placa}</p>
                       <p className="text-[8px] font-bold text-gray-400 mt-1">KM ACTUAL: {v.kilometrajeActual}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full">
                       <button onClick={() => { setShowNewChecklist(v.id); setChecklistType('Check-In'); }} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 size={14}/> Check-In
                       </button>
                       <button onClick={() => { setShowNewChecklist(v.id); setChecklistType('Check-Out'); }} className="py-4 bg-bordeaux-800 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-bordeaux-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-bordeaux-500/20">
                          <ArrowRight size={14}/> Check-Out
                       </button>
                    </div>
                    <div className="w-full mt-2 pt-4 border-t dark:border-white/5">
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Últimas 3 Inspecciones:</p>
                       <div className="space-y-2">
                          {(v.checklists || []).slice(-3).reverse().map(ch => (
                             <div key={ch.id} className="flex justify-between items-center bg-gray-50 dark:bg-dark-elevated p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                <div>
                                   <p className={`text-[8px] font-black uppercase ${ch.tipo === 'Check-In' ? 'text-emerald-600' : 'text-bordeaux-800'}`}>{ch.tipo}</p>
                                   <p className="text-[7px] text-gray-400">{new Date(ch.fecha).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[8px] font-bold dark:text-white uppercase">{ch.responsable}</p>
                                   <p className="text-[7px] text-gray-400">{ch.kilometraje} KM</p>
                                </div>
                             </div>
                          ))}
                          {(v.checklists || []).length === 0 && <p className="text-[8px] text-gray-300 italic">No hay registros aún.</p>}
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          ) : (
             <div className="bg-white dark:bg-dark-card rounded-[4rem] p-10 md:p-14 border-2 border-gold/20 shadow-2xl space-y-12 animate-slideUp max-w-5xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-4 bordeaux-gradient"></div>
                <button onClick={() => setShowNewChecklist(null)} className="absolute top-10 right-10 p-4 bg-gray-100 dark:bg-dark-elevated rounded-full hover:text-red-500 transition-all"><X size={24}/></button>
                
                <div className="text-center space-y-3">
                   <h3 className="text-4xl font-robust text-bordeaux-950 dark:text-white italic tracking-tighter">
                      Protocolo {checklistType} Platinum
                   </h3>
                   <div className="flex items-center justify-center gap-4 text-gold font-black uppercase text-[10px] tracking-widest">
                      <span>Unidad: {flota.find(v => v.id === showNewChecklist)?.nombre}</span>
                      <div className="w-1 h-1 bg-gold rounded-full"></div>
                      <span>Placa: {flota.find(v => v.id === showNewChecklist)?.placa}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-50 dark:bg-dark-base p-10 rounded-[3rem] border border-gray-100 dark:border-white/5">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Responsable Inspección</label>
                      <input type="text" placeholder="Nombre completo" value={currentChecklist.responsable} onChange={e => setCurrentChecklist({...currentChecklist, responsable: e.target.value})} className="w-full bg-white dark:bg-dark-elevated rounded-2xl px-6 py-4 font-bold border-0 shadow-sm outline-none focus:ring-2 focus:ring-gold" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Gauge size={14}/> Kilometraje Actual</label>
                      <input type="number" placeholder="KM" value={currentChecklist.kilometraje || ''} onChange={e => setCurrentChecklist({...currentChecklist, kilometraje: Number(e.target.value)})} className="w-full bg-white dark:bg-dark-elevated rounded-2xl px-6 py-4 font-bold border-0 shadow-sm outline-none focus:ring-2 focus:ring-gold" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Fuel size={14}/> Nivel Combustible</label>
                      <select value={currentChecklist.combustible} onChange={e => setCurrentChecklist({...currentChecklist, combustible: e.target.value as any})} className="w-full bg-white dark:bg-dark-elevated rounded-2xl px-6 py-4 font-bold border-0 shadow-sm outline-none focus:ring-2 focus:ring-gold">
                         <option value="1/8">1/8 - Crítico</option>
                         <option value="1/4">1/4 - Bajo</option>
                         <option value="1/2">1/2 - Medio</option>
                         <option value="3/4">3/4 - Alto</option>
                         <option value="Full">Tanque Lleno</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   {[
                     { title: 'Exterior', key: 'exterior' },
                     { title: 'Interior y Equipamiento', key: 'interior' },
                     { title: 'Mecánica básica', key: 'mecanica' },
                     { title: 'Documentación', key: 'documentacion' }
                   ].map((cat) => (
                      <div key={cat.key} className="space-y-5">
                         <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] border-b border-gold/10 pb-2">{cat.title}</h4>
                         <div className="space-y-3">
                            {(currentChecklist as any)[cat.key].map((item: any, idx: number) => (
                               <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-dark-elevated/50 p-4 rounded-2xl group hover:bg-white dark:hover:bg-dark-elevated transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                                  <span className="text-[11px] font-bold dark:text-gray-200 uppercase">{item.label}</span>
                                  <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-dark-base rounded-xl">
                                     <button onClick={() => updateItemStatus(cat.key, idx, 'ok')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${item.status === 'ok' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-emerald-500'}`}>OK</button>
                                     <button onClick={() => updateItemStatus(cat.key, idx, 'bad')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${item.status === 'bad' ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-400 hover:text-rose-500'}`}>BAD</button>
                                     <button onClick={() => updateItemStatus(cat.key, idx, 'na')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${item.status === 'na' ? 'bg-gray-400 text-white shadow-lg' : 'text-gray-400 hover:text-gray-500'}`}>N/A</button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>

                <div className="space-y-4">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><PenTool size={14}/> Observaciones adicionales</label>
                   <textarea value={currentChecklist.observacionesGlobales} onChange={e => setCurrentChecklist({...currentChecklist, observacionesGlobales: e.target.value})} placeholder="Detalle cualquier daño visual o nota importante..." className="w-full bg-gray-50 dark:bg-dark-base rounded-[2.5rem] p-8 text-sm font-medium border-0 outline-none focus:ring-2 focus:ring-gold min-h-[150px] shadow-inner" />
                </div>

                <div className="pt-10 flex gap-6">
                   <button onClick={handleSaveChecklist} className="flex-1 py-8 bordeaux-gradient text-white rounded-[2.5rem] font-robust text-[12px] uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                      Finalizar y Firmar Digitalmente <Check size={20}/>
                   </button>
                   <button onClick={() => setShowNewChecklist(null)} className="px-10 py-8 bg-gray-100 dark:bg-dark-elevated text-gray-400 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all">Cancelar</button>
                </div>
             </div>
          )}
        </div>
      )}

      {/* --- CONTRATOS --- */}
      {activeTab === 'contratos' && (
        <div className="space-y-6 px-2 animate-fadeIn relative">
           <button onClick={() => setShowManualBooking(!showManualBooking)} className="w-full py-6 bg-gold/10 border-4 border-dashed border-gold text-gold rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-gold/20 transition-all print:hidden">
              <UserPlus size={24}/> Nuevo Bloqueo / Reserva Manual
           </button>

           {showManualBooking && (
             <form onSubmit={(e) => {
               e.preventDefault();
               const res: Reservation = {
                 id: `JM-MAN-${Date.now()}`, cliente: manualRes.cliente.toUpperCase(), email: 'manual@jmasociados.com', ci: 'MANUAL', documentType: 'CI', celular: '---', auto: manualRes.auto, inicio: manualRes.inicio, fin: manualRes.fin, total: manualRes.total, status: 'Confirmed', includeInCalendar: true
               };
               if (onAddReservation) onAddReservation(res);
               else setReservations([res, ...reservations]);
               setShowManualBooking(false);
             }} className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] border-2 border-gold shadow-2xl space-y-4 print:hidden">
                <div className="grid grid-cols-2 gap-4">
                   <input type="text" placeholder="Cliente" required value={manualRes.cliente} onChange={e => setManualRes({...manualRes, cliente: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                   <select required value={manualRes.auto} onChange={e => setManualRes({...manualRes, auto: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0">
                      <option value="">Seleccionar Auto...</option>
                      {flota.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <input type="date" required value={manualRes.inicio} onChange={e => setManualRes({...manualRes, inicio: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                   <input type="date" required value={manualRes.fin} onChange={e => setManualRes({...manualRes, fin: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                   <input type="number" placeholder="Total BRL" required value={manualRes.total} onChange={e => setManualRes({...manualRes, total: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                </div>
                <button type="submit" className="w-full py-6 bordeaux-gradient text-white rounded-[2rem] font-black uppercase tracking-widest">Confirmar Reserva</button>
             </form>
           )}

           <div className="grid grid-cols-1 gap-4">
             {reservations.map(r => (
               <div key={r.id} className="bg-white dark:bg-dark-card p-6 rounded-[2.5rem] border dark:border-white/5 flex flex-col md:flex-row justify-between items-center group shadow-md relative print:border print:shadow-none print:rounded-2xl">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                     <div className="w-12 h-12 bg-bordeaux-50 rounded-2xl flex items-center justify-center text-bordeaux-800"><FileText size={20}/></div>
                     <div className="flex-1">
                        <p className="text-sm font-black dark:text-white uppercase italic leading-none">{r.cliente}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{r.auto} | {r.inicio}</p>
                        {r.obs && <p className="text-[8px] text-blue-500 font-bold mt-1 uppercase italic">{r.obs}</p>}
                     </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 md:mt-0 print:hidden">
                     <div className="text-right">
                       <p className="text-lg font-robust dark:text-white">R$ {r.total}</p>
                       <span className={`px-3 py-0.5 rounded-full text-[7px] font-black uppercase ${r.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                     </div>
                     <button onClick={() => setEditingReservation(r)} className="p-3 text-gray-300 hover:text-gold transition-colors"><Edit3 size={16}/></button>
                     <button onClick={() => setViewingContract(r)} className="p-3 bg-blue-50 text-blue-600 rounded-xl" title="Ver Contrato"><FileSignature size={16}/></button>
                     {r.status !== 'Confirmed' && (
                        <button onClick={() => handleVerifyPayment(r.id)} className="p-3 bg-green-50 text-green-600 rounded-xl" title="Validar Pago"><CheckCircle2 size={16}/></button>
                     )}
                     <button onClick={() => setManagingRes(r)} className="p-3 text-gray-300 hover:text-bordeaux-800 transition-colors"><Settings size={16}/></button>
                     <button onClick={() => onDeleteReservation?.(r.id)} className="p-3 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* --- FLOTA --- */}
      {activeTab === 'flota' && (
        <div className="space-y-6 px-2 animate-fadeIn print:hidden">
           <button onClick={() => setShowAddVehicle(!showAddVehicle)} className="w-full py-6 bg-bordeaux-950 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.01] transition-all shadow-xl">
              <Plus size={24}/> Agregar Nueva Unidad
           </button>
           
           {showAddVehicle && (
             <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] border-2 border-gold shadow-2xl space-y-6">
                <h3 className="text-2xl font-robust text-bordeaux-950 dark:text-white italic">Registro de Unidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input type="text" placeholder="Nombre Modelo *" value={newVehicle.nombre} onChange={e => setNewVehicle({...newVehicle, nombre: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none" />
                   <input type="text" placeholder="Placa / Patente *" value={newVehicle.placa} onChange={e => setNewVehicle({...newVehicle, placa: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none" />
                   <input type="number" placeholder="Precio Diario (BRL) *" value={newVehicle.precio || ''} onChange={e => setNewVehicle({...newVehicle, precio: Number(e.target.value)})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none" />
                   <input type="text" placeholder="URL Imagen" value={newVehicle.img} onChange={e => setNewVehicle({...newVehicle, img: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none" />
                   <input type="text" placeholder="Color" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none" />
                   <input type="number" placeholder="KM Actual" value={newVehicle.kilometrajeActual || ''} onChange={e => setNewVehicle({...newVehicle, kilometrajeActual: Number(e.target.value)})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none" />
                </div>
                <button onClick={handleSaveVehicle} className="w-full py-5 bordeaux-gradient text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Guardar Vehículo</button>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flota.map(v => (
                 <div key={v.id} className="bg-white dark:bg-dark-card p-6 rounded-[2.5rem] border dark:border-white/5 flex items-center gap-4 shadow-sm relative">
                    <img src={v.img} className="w-20 h-20 object-contain" />
                    <div className="flex-1">
                       <h4 className="font-robust dark:text-white uppercase italic">{v.nombre}</h4>
                       <p className="text-[9px] font-black text-gold uppercase tracking-widest">{v.placa} | R$ {v.precio}/día</p>
                       <p className="text-[8px] text-gray-400 font-bold uppercase">{v.kilometrajeActual} KM</p>
                    </div>
                    <div className="flex flex-col gap-2">
                       <button onClick={() => setEditingVehicle(v)} className="p-2 text-gray-300 hover:text-gold transition-colors"><Edit3 size={14}/></button>
                       <button onClick={() => setFlota(flota.filter(x => x.id !== v.id))} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* --- TALLER --- */}
      {activeTab === 'taller' && (
        <div className="space-y-8 px-2 animate-fadeIn print:block">
           {flota.map(v => {
             const logs = mantenimientos.filter(m => m.vehicleId === v.id);
             const alertStatus = v.maintenanceStatus || 'ok';
             return (
               <div key={v.id} className={`bg-white dark:bg-dark-card p-8 rounded-[3.5rem] border-2 shadow-xl space-y-6 relative overflow-hidden transition-all print:border print:mb-10 ${alertStatus === 'critical' ? 'border-red-500' : 'border-gray-100 dark:border-white/5'}`}>
                  <div className={`absolute top-0 left-0 right-0 h-2 ${alertStatus === 'critical' ? 'bg-red-600' : alertStatus === 'warning' ? 'bg-gold' : 'bg-emerald-500'}`}></div>
                  <div className="flex flex-col md:flex-row items-center gap-8 border-b dark:border-white/5 pb-6">
                     <img src={v.img} className="w-32 h-20 object-contain p-2"/>
                     <div className="flex-1 text-center md:text-left">
                        <h4 className="text-2xl font-robust dark:text-white uppercase italic">{v.nombre}</h4>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                           <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase text-white ${alertStatus === 'critical' ? 'bg-red-600' : 'bg-emerald-500'}`}>{alertStatus}</div>
                           <div className="px-4 py-2 bg-gray-100 dark:bg-dark-elevated rounded-xl text-[9px] font-black text-bordeaux-800 uppercase">KM Actual: {v.kilometrajeActual}</div>
                        </div>
                     </div>
                     <button onClick={() => {
                        const newM: MaintenanceRecord = { id: `M-${Date.now()}`, vehicleId: v.id, vehicleName: v.nombre, fecha: new Date().toISOString().split('T')[0], kilometraje: v.kilometrajeActual, descripcion: 'Mantenimiento Preventivo', monto: 0, tipo: 'Preventivo', realizado: true, images: [] };
                        setMantenimientos([...mantenimientos, newM]);
                        setExpandedMaintenance(prev => ({...prev, [v.id]: true}));
                     }} className="p-4 bg-bordeaux-950 text-white rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2 print:hidden">
                        <Plus size={18}/> <span className="text-[10px] font-black uppercase">Registrar</span>
                     </button>
                  </div>
                  <div className="space-y-4">
                     <button onClick={() => setExpandedMaintenance(prev => ({...prev, [v.id]: !prev[v.id]}))} className="w-full flex justify-between items-center text-[9px] font-black text-gray-400 uppercase print:hidden">
                        <span className="flex items-center gap-2"><Wrench size={12}/> Historial Técnico ({logs.length})</span>
                        {expandedMaintenance[v.id] ? 'Cerrar' : 'Ver Detalles'}
                     </button>
                     {(expandedMaintenance[v.id] || window.matchMedia('print').matches) && logs.map(log => (
                        <div key={log.id} className="bg-gray-50 dark:bg-dark-base p-6 rounded-[2.5rem] border border-gray-200 dark:border-white/5 space-y-4 print:rounded-2xl">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input value={log.descripcion} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, descripcion: e.target.value} : m))} className="w-full bg-white dark:bg-dark-elevated px-4 py-2 rounded-xl text-xs font-bold outline-none" />
                              <input type="number" value={log.monto} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, monto: Number(e.target.value)} : m))} className="w-full bg-white dark:bg-dark-elevated px-4 py-2 rounded-xl text-xs font-bold text-right outline-none" />
                           </div>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div><p className="text-[7px] font-black uppercase text-gray-400">Fecha</p><input type="date" value={log.fecha} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, fecha: e.target.value} : m))} className="bg-transparent text-[10px] font-bold w-full" /></div>
                              <div><p className="text-[7px] font-black uppercase text-gray-400">KM</p><input type="number" value={log.kilometraje} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, kilometraje: Number(e.target.value)} : m))} className="bg-transparent text-[10px] font-bold w-full" /></div>
                           </div>
                           <div className="flex justify-end print:hidden">
                              <button onClick={() => setMantenimientos(mantenimientos.filter(x => x.id !== log.id))} className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1"><Trash2 size={12}/> Eliminar</button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {/* --- VENCIMIENTOS --- */}
      {activeTab === 'vencimientos' && (
        <div className="space-y-6 animate-fadeIn px-2">
           <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] border-2 border-gold/10 shadow-xl space-y-4 print:hidden">
              <h3 className="text-xl font-robust dark:text-white italic uppercase text-center flex items-center justify-center gap-2"><Bell className="text-gold"/> Monitor de Alertas</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                 <select value={newExpiration.vehicleId} onChange={e => setNewExpiration({...newExpiration, vehicleId: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-xs font-bold">
                    <option value="">Seleccionar Vehículo...</option>
                    {flota.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                 </select>
                 <select value={newExpiration.tipo} onChange={e => setNewExpiration({...newExpiration, tipo: e.target.value as any})} className="bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-xs font-bold">
                    <option value="Seguro">Seguro</option>
                    <option value="Patente">Patente</option>
                    <option value="Cuota">Cuota Financiación</option>
                 </select>
                 <input type="date" value={newExpiration.vencimiento} onChange={e => setNewExpiration({...newExpiration, vencimiento: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-xs font-bold" />
                 <input type="number" placeholder="Monto R$" value={newExpiration.monto || ''} onChange={e => setNewExpiration({...newExpiration, monto: Number(e.target.value)})} className="bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-xs font-bold" />
              </div>
              <button onClick={handleAddExpiration} className="w-full py-4 bg-bordeaux-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] transition-all">Agregar Alerta</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vencimientos.map(v => (
                 <div key={v.id} className={`p-8 rounded-[2.5rem] border-2 shadow-xl relative overflow-hidden transition-all group ${v.pagado ? 'bg-gray-50 opacity-60' : 'bg-white dark:bg-dark-card border-gray-100 dark:border-white/5'}`}>
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{v.vehicleName}</h4>
                          <h3 className={`text-xl font-robust italic ${v.pagado ? 'text-gray-500 line-through' : 'text-bordeaux-950 dark:text-white'}`}>{v.tipo}</h3>
                       </div>
                       <div className="text-right">
                          <p className="text-[7px] font-black uppercase text-gray-400">Estado</p>
                          <span className={`text-sm font-black uppercase ${v.pagado ? 'text-green-600' : 'text-red-500'}`}>{v.pagado ? 'Pagado' : 'Pendiente'}</span>
                       </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-elevated p-4 rounded-xl space-y-2">
                       <div className="flex justify-between text-xs font-bold"><span className="text-gray-400 uppercase">Vence:</span><span>{v.vencimiento}</span></div>
                       <div className="flex justify-between text-xs font-bold"><span className="text-gray-400 uppercase">Monto:</span><span>R$ {v.monto}</span></div>
                    </div>
                    <div className="flex gap-2 mt-6 print:hidden">
                       <button onClick={() => setVencimientos(vencimientos.map(x => x.id === v.id ? {...x, pagado: !x.pagado} : x))} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${v.pagado ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {v.pagado ? 'Reabrir' : 'Marcar Pagado'}
                       </button>
                       <button onClick={() => setVencimientos(vencimientos.filter(x => x.id !== v.id))} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* --- MODAL EDICIÓN VEHÍCULO --- */}
      {editingVehicle && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-dark-base/90 backdrop-blur-xl p-4 animate-fadeIn">
           <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-[3.5rem] p-10 shadow-2xl border-4 border-gold relative overflow-y-auto max-h-[90vh]">
              <button onClick={() => setEditingVehicle(null)} className="absolute top-8 right-8 p-3 bg-gray-100 dark:bg-dark-elevated rounded-full hover:text-red-500"><X size={20}/></button>
              <h3 className="text-3xl font-robust text-bordeaux-950 dark:text-white italic mb-8">Editar Unidad</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">Nombre Modelo</label><input value={editingVehicle.nombre} onChange={e => setEditingVehicle({...editingVehicle, nombre: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" /></div>
                 <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">Placa</label><input value={editingVehicle.placa} onChange={e => setEditingVehicle({...editingVehicle, placa: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" /></div>
                 <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">Precio Día R$</label><input type="number" value={editingVehicle.precio} onChange={e => setEditingVehicle({...editingVehicle, precio: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" /></div>
                 <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">KM Actual</label><input type="number" value={editingVehicle.kilometrajeActual} onChange={e => setEditingVehicle({...editingVehicle, kilometrajeActual: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" /></div>
                 <div className="col-span-2"><label className="text-[9px] font-black uppercase text-gray-400 ml-2">URL Imagen</label><input value={editingVehicle.img} onChange={e => setEditingVehicle({...editingVehicle, img: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" /></div>
              </div>
              <button onClick={() => {
                 setFlota(flota.map(v => v.id === editingVehicle.id ? editingVehicle : v));
                 setEditingVehicle(null);
              }} className="w-full mt-8 py-6 bordeaux-gradient text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Guardar Cambios</button>
           </div>
        </div>
      )}

      {/* --- MODAL EDICIÓN RESERVA --- */}
      {editingReservation && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-dark-base/90 backdrop-blur-xl p-4 animate-fadeIn">
           <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-[3.5rem] p-10 shadow-2xl border-4 border-gold relative overflow-y-auto max-h-[90vh]">
              <button onClick={() => setEditingReservation(null)} className="absolute top-8 right-8 p-3 bg-gray-100 dark:bg-dark-elevated rounded-full hover:text-red-500"><X size={20}/></button>
              <h3 className="text-3xl font-robust text-bordeaux-950 dark:text-white italic mb-8">Editar Contrato</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2"><label className="text-[9px] font-black uppercase text-gray-400 ml-2">Nombre Socio</label><input value={editingReservation.cliente} onChange={e => setEditingReservation({...editingReservation, cliente: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" /></div>
                 <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">Salida</label><input value={editingReservation.inicio} onChange={e => setEditingReservation({...editingReservation, inicio: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" /></div>
                 <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">Retorno</label><input value={editingReservation.fin} onChange={e => setEditingReservation({...editingReservation, fin: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" /></div>
                 <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">Total Contrato R$</label><input type="number" value={editingReservation.total} onChange={e => setEditingReservation({...editingReservation, total: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" /></div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Estado</label>
                    <select value={editingReservation.status} onChange={e => setEditingReservation({...editingReservation, status: e.target.value as any})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0">
                       <option value="Confirmed">Confirmado</option>
                       <option value="Pending">Pendiente</option>
                       <option value="Review">En Revisión</option>
                       <option value="Cancelled">Cancelado</option>
                    </select>
                 </div>
              </div>
              <button onClick={() => {
                 setReservations(reservations.map(r => r.id === editingReservation.id ? editingReservation : r));
                 setEditingReservation(null);
              }} className="w-full mt-8 py-6 bordeaux-gradient text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Guardar Cambios</button>
           </div>
        </div>
      )}

      {/* --- MODAL GESTION AVANZADA (RESCISIÓN / CAMBIO) --- */}
      {managingRes && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-base/90 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-[3rem] p-8 shadow-2xl border-4 border-gold relative max-h-[90vh] overflow-y-auto scrollbar-hide">
               <button onClick={() => setManagingRes(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-all"><X size={20}/></button>
               <div className="text-center mb-8"><h3 className="text-2xl font-robust text-bordeaux-950 dark:text-white italic">Gestión Avanzada</h3><p className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Contrato: {managingRes.id}</p></div>
               <div className="flex gap-2 bg-gray-100 dark:bg-dark-elevated p-1 rounded-2xl mb-6">
                  <button onClick={() => setManageMode('swap')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${manageMode === 'swap' ? 'bg-white shadow-md text-bordeaux-950' : 'text-gray-400'}`}>Cambio Unidad</button>
                  <button onClick={() => setManageMode('cancel')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${manageMode === 'cancel' ? 'bg-white shadow-md text-red-600' : 'text-gray-400'}`}>Rescisión</button>
               </div>
               {manageMode === 'swap' && (
                  <div className="space-y-4 animate-slideUp">
                     <select value={swapVehicleId} onChange={e => setSwapVehicleId(e.target.value)} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none"><option value="">Seleccione Unidad...</option>{flota.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}</select>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[9px] font-black uppercase">Nuevo Total R$</label><input type="number" value={manualSwapValues.newTotal} onChange={e => setManualSwapValues({...manualSwapValues, newTotal: Number(e.target.value)})} className="w-full border-b font-bold" /></div>
                        <div><label className="text-[9px] font-black uppercase">Diferencia R$</label><input type="number" value={manualSwapValues.diff} onChange={e => setManualSwapValues({...manualSwapValues, diff: Number(e.target.value)})} className="w-full border-b font-bold text-right" /></div>
                     </div>
                  </div>
               )}
               {manageMode === 'cancel' && (
                  <div className="space-y-4 animate-slideUp">
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[9px] font-black uppercase">Multa R$</label><input type="number" value={manualCancelValues.penalty} onChange={e => setManualCancelValues({...manualCancelValues, penalty: Number(e.target.value)})} className="w-full border-b font-bold text-red-600" /></div>
                        <div><label className="text-[9px] font-black uppercase">Devolución R$</label><input type="number" value={manualCancelValues.refund} onChange={e => setManualCancelValues({...manualCancelValues, refund: Number(e.target.value)})} className="w-full border-b font-bold text-green-600" /></div>
                     </div>
                  </div>
               )}
               <textarea value={customObs} onChange={e => setCustomObs(e.target.value)} placeholder="Motivo del cambio..." className="w-full mt-4 bg-gray-50 dark:bg-dark-base rounded-2xl p-4 text-xs font-medium h-20 outline-none resize-none" />
               <button onClick={handleApplyChanges} className="w-full mt-6 py-5 bordeaux-gradient text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl">Confirmar Gestión</button>
            </div>
         </div>
      )}

      {/* --- AI STUDIO TAB --- */}
      {activeTab === 'ai_studio' && (
        <div className="space-y-6 animate-fadeIn px-2 print:hidden">
           <div className="flex gap-2 bg-gray-100 dark:bg-dark-elevated p-1 rounded-2xl mb-4">
              <button onClick={() => setAiTab('chat')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiTab === 'chat' ? 'bg-white shadow-md text-bordeaux-950' : 'text-gray-400'}`}>Asistente IA</button>
              <button onClick={() => setAiTab('veo')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiTab === 'veo' ? 'bg-white shadow-md text-bordeaux-950' : 'text-gray-400'}`}>Marketing Video</button>
           </div>
           {aiTab === 'chat' && (
              <div className="bg-white dark:bg-dark-card rounded-[3rem] shadow-xl border dark:border-white/5 overflow-hidden h-[600px] flex flex-col">
                 <div className="p-6 bg-bordeaux-950 text-white flex justify-between items-center"><div className="flex items-center gap-3"><Bot size={24} className="text-gold"/><div><h3 className="font-robust italic">JM Assistant</h3><p className="text-[8px] font-black text-gold uppercase">Gemini 3 Pro</p></div></div><div className="flex gap-2"><button onClick={() => setGroundingMode('none')} className={`p-2 rounded-lg ${groundingMode === 'none' ? 'bg-white/20' : ''}`}><Sparkles size={16}/></button><button onClick={() => setGroundingMode('search')} className={`p-2 rounded-lg ${groundingMode === 'search' ? 'bg-white/20' : ''}`}><Globe size={16}/></button></div></div>
                 <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-dark-base">{chatMessages.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-bordeaux-900 text-white' : 'bg-white dark:bg-dark-elevated border shadow-sm'}`}><p className="whitespace-pre-wrap">{msg.text}</p></div></div>))}{isChatLoading && <div className="flex justify-start"><div className="bg-white dark:bg-dark-elevated p-4 rounded-2xl animate-pulse">...</div></div>}</div>
                 <div className="p-4 border-t dark:border-white/5"><div className="flex gap-2"><input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Consulte al sistema..." className="flex-1 bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-sm font-medium outline-none" /><button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()} className="p-3 bg-bordeaux-950 text-white rounded-xl"><Send size={20}/></button></div></div>
              </div>
           )}
           {aiTab === 'veo' && (
              <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] border-2 border-gold shadow-2xl space-y-6">
                 <div className="text-center space-y-2"><div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg mb-4"><Video size={32}/></div><h3 className="text-2xl font-robust italic dark:text-white">Google VEO Generator</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contenido Promocional</p></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <textarea value={veoPrompt} onChange={e => setVeoPrompt(e.target.value)} placeholder="Describe el video..." className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl p-4 text-sm font-medium h-32 outline-none" />
                       <label className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-base rounded-2xl cursor-pointer border border-dashed border-gray-300"><input type="file" className="hidden" accept="image/*" onChange={handleVeoImageUpload} /><ImageIcon size={20}/><div className="flex-1"><p className="text-xs font-bold">Cargar Imagen Base</p></div>{veoImage && <img src={veoImage} className="w-12 h-12 rounded-lg object-cover"/>}</label>
                       <button onClick={handleGenerateVideo} disabled={isVeoGenerating || !veoImage} className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">{isVeoGenerating ? <Loader2 className="animate-spin mx-auto"/> : 'Generar Video AI'}</button>
                    </div>
                    <div className="bg-black/90 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden min-h-[300px]">{generatedVideoUrl ? <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" /> : <div className="text-center opacity-50"><Video size={48} className="mx-auto text-white"/><p className="text-xs font-bold text-gray-400 uppercase">Vista Previa</p></div>}{isVeoGenerating && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white text-xs font-black uppercase animate-pulse">Renderizando...</div>}</div>
                 </div>
              </div>
           )}
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
