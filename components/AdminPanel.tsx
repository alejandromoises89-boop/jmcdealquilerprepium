import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Vehicle, Reservation, Gasto, MaintenanceRecord, ExpirationRecord, ChecklistLog, InspectionItem } from '../types';
import { 
  Landmark, FileText, Wrench, Search, Plus, Trash2, Printer, 
  CheckCircle2, AlertTriangle, UserPlus, Download, TrendingUp, TrendingDown,
  ArrowRight, PieChart as PieChartIcon, BarChart3, ClipboardList, 
  Car, MessageCircle, FileSpreadsheet, ShieldCheck, 
  Edit3, X, Settings, User, CreditCard, Check, AlertCircle, Bell,
  Sparkles, Bot, Video, MapPin, Globe, Loader2, Play, Image as ImageIcon,
  Fuel, Gauge, Users, Zap, RefreshCw, HandCoins, Repeat, Calculator, PenTool,
  CalendarClock, Timer, HardDrive, Save, FileSignature, Camera, Upload, Coins
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
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

// --- AI & CHAT INTERFACES ---
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
  isError?: boolean;
}

// Subcomponente para Notificaciones Flotantes
const NotificationCenter: React.FC<{ alerts: string[] }> = ({ alerts }) => {
  if (alerts.length === 0) return null;
  return (
    <div className="fixed top-28 right-6 z-[140] space-y-3 animate-slideUp pointer-events-none">
      {alerts.map((alert, idx) => (
        <div key={idx} className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border-l-4 border-rose-500 flex items-start gap-3 w-80 pointer-events-auto">
          <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-full text-rose-600">
             <AlertTriangle size={16} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Atención Requerida</h4>
            <p className="text-xs font-bold dark:text-gray-200 leading-tight mt-1">{alert}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

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
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNewChecklist, setShowNewChecklist] = useState<string | null>(null);
  
  // Contract Viewer Modal
  const [viewingContract, setViewingContract] = useState<Reservation | null>(null);

  // Taller collapsible state
  const [expandedMaintenance, setExpandedMaintenance] = useState<Record<string, boolean>>({});

  // RESCISSION / SWAP MODAL
  const [managingRes, setManagingRes] = useState<Reservation | null>(null);
  const [manageMode, setManageMode] = useState<'swap' | 'cancel'>('swap');
  const [swapVehicleId, setSwapVehicleId] = useState('');
  
  // NEW: Editable States for Management
  const [manualSwapValues, setManualSwapValues] = useState({ newTotal: 0, diff: 0 });
  const [manualCancelValues, setManualCancelValues] = useState({ penalty: 0, refund: 0 });
  const [customObs, setCustomObs] = useState('');

  // FLOTA MANAGEMENT STATE
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    nombre: '', precio: 0, placa: '', color: '', kilometrajeActual: 0,
    transmision: 'Automático', combustible: 'Nafta', asientos: 5, tipo: 'Compacto',
    img: '', specs: []
  });
  const [tempSpec, setTempSpec] = useState('');

  // AI STUDIO STATE
  const [aiTab, setAiTab] = useState<'chat' | 'veo'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [groundingMode, setGroundingMode] = useState<'none' | 'search' | 'maps'>('none');
  
  // VEO STATE
  const [veoPrompt, setVeoPrompt] = useState('');
  const [veoImage, setVeoImage] = useState<string | null>(null);
  const [veoAspectRatio, setVeoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isVeoGenerating, setIsVeoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // NEW: State for Vencimientos form
  const [newExpiration, setNewExpiration] = useState<Partial<ExpirationRecord>>({
    tipo: 'Seguro', monto: 0, vencimiento: '', vehicleId: '', pagado: false
  });

  // --- LOGIC: AUTO-CALCULO TOTAL MANUAL ---
  useEffect(() => {
    if (showManualBooking && manualRes.auto && manualRes.inicio && manualRes.fin) {
      const v = flota.find(f => f.nombre === manualRes.auto);
      if (v) {
        const start = new Date(manualRes.inicio);
        const end = new Date(manualRes.fin);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const calcTotal = (days > 0 ? days : 1) * v.precio;
        setManualRes(prev => ({...prev, total: calcTotal}));
      }
    }
  }, [manualRes.auto, manualRes.inicio, manualRes.fin, showManualBooking, flota]);

  // --- LOGIC: AUTO-CALCULO SWAP & CANCEL ---
  useEffect(() => {
     if (manageMode === 'swap' && managingRes && swapVehicleId) {
        const target = flota.find(v => v.id === swapVehicleId);
        if (target) {
            const start = parseDate(managingRes.inicio);
            const end = parseDate(managingRes.fin);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
            const calculatedTotal = days * target.precio;
            const calculatedDiff = calculatedTotal - managingRes.total;
            setManualSwapValues({ newTotal: calculatedTotal, diff: calculatedDiff });
        }
     }
  }, [swapVehicleId, managingRes, manageMode, flota]);

  useEffect(() => {
     if (manageMode === 'cancel' && managingRes) {
        const { penalty, refund } = calculatePenalty(managingRes);
        setManualCancelValues({ penalty, refund });
     }
  }, [manageMode, managingRes]);

  // --- HELPER: DATE PARSER ---
  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    if(dStr.includes('/')) {
       const [d, m, y] = dStr.split('/');
       return new Date(Number(y), Number(m)-1, Number(d));
    }
    // Try YYYY-MM-DD
    const parts = dStr.split('-');
    if(parts.length === 3) return new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
    return new Date(dStr);
  };

  // --- HELPER: PENALTY CALCULATION ---
  const calculatePenalty = (res: Reservation) => {
     const start = parseDate(res.inicio);
     const end = parseDate(res.fin);
     
     if (isNaN(start.getTime()) || isNaN(end.getTime())) return { days: 0, penalty: 0, refund: 0, rate: 0 };

     const diffTime = Math.abs(end.getTime() - start.getTime());
     const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
     
     // REGLA DE MULTA
     // Si <= 5 dias: 15%
     // Si > 5 dias: 50%
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

       // Use MANUAL values that might have been edited
       const { newTotal, diff } = manualSwapValues;

       updatedReservations = updatedReservations.map(r => 
          r.id === managingRes.id ? { 
            ...r, 
            auto: targetVehicle.nombre,
            total: newTotal,
            obs: `${r.obs || ''} | [CAMBIO ${dateNow}]: ${managingRes.auto} -> ${targetVehicle.nombre}. Nuevo Total: R$ ${newTotal}. Dif: R$ ${diff}. Nota: ${customObs || 'Sin notas.'}`
          } : r
       );
       
       const msg = diff > 0 
        ? `Unidad cambiada. El cliente debe abonar la diferencia de R$ ${diff}.`
        : `Unidad cambiada. Saldo a favor del cliente: R$ ${Math.abs(diff)}.`;
        
       alert(msg);
    } 
    else if (manageMode === 'cancel') {
       // Use MANUAL values that might have been edited
       const { penalty, refund } = manualCancelValues;
       
       if(!confirm(`CONFIRMACIÓN DE RESCISIÓN MANUAL\n\nTotal Original: R$ ${managingRes.total}\n\nRetención (Multa Definida): R$ ${penalty}\nDevolución Cliente: R$ ${refund}\n\n¿Proceder con estos valores?`)) return;
       
       const obsText = ` | [RESCISIÓN ${dateNow}]: Contrato cancelado. Multa retenida: R$ ${penalty}. Devolución autorizada al cliente: R$ ${refund}. Nota: ${customObs || 'Ajuste manual aplicado.'}`;

       updatedReservations = updatedReservations.map(r => 
          r.id === managingRes.id ? { 
            ...r, 
            status: 'Cancelled',
            obs: (r.obs || '') + obsText
          } : r
       );
       alert(`Contrato rescindido. Se ha dejado constancia en el historial:\n\n"Devolución de R$ ${refund} pendiente de ejecución."`);
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
        setMantenimientos(mantenimientos.map(m => 
          m.id === maintenanceId 
            ? { ...m, images: [...(m.images || []), reader.result as string] }
            : m
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LOGIC: FINANZAS ---
  const stats = useMemo(() => {
    const filteredRes = reservations.filter(r => {
      const matchV = finanzasFilter.vehicle ? r.auto === finanzasFilter.vehicle : true;
      const matchD = (finanzasFilter.start && finanzasFilter.end) 
        ? (new Date(r.inicio) >= new Date(finanzasFilter.start) && new Date(r.inicio) <= new Date(finanzasFilter.end))
        : true;
      return matchV && matchD;
    });

    const filteredGastos = gastos.filter(g => {
      const matchV = finanzasFilter.vehicle ? g.vehicleId === finanzasFilter.vehicle : true;
      const matchD = (finanzasFilter.start && finanzasFilter.end)
        ? (new Date(g.fecha) >= new Date(finanzasFilter.start) && new Date(g.fecha) <= new Date(finanzasFilter.end))
        : true;
      return matchV && matchD;
    });

    const income = filteredRes.reduce((s, r) => s + (r.total || 0), 0);
    const expense = filteredGastos.reduce((s, g) => s + (g.monto || 0), 0) + mantenimientos.reduce((s, m) => s + m.monto, 0);
    
    // Monthly data for Area Chart
    const monthlyData = new Map();
    filteredRes.forEach(r => {
      if(!r.inicio) return;
      const month = r.inicio.substring(0, 7); // YYYY-MM
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

  // --- LOGIC: NOTIFICATIONS & ALERTS ---
  useEffect(() => {
    const alerts: string[] = [];
    flota.forEach(v => {
      // Mantenimiento Alerts
      if (v.maintenanceStatus === 'critical') {
         alerts.push(`${v.nombre}: MANTENIMIENTO VENCIDO`);
      } else if (v.maintenanceStatus === 'warning') {
         alerts.push(`${v.nombre}: Mantenimiento Próximo`);
      }
    });
    // Vencimientos Alerts
    vencimientos.forEach(v => {
       if (!v.pagado) {
          const due = new Date(v.vencimiento);
          const diff = (due.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
          if (diff <= 3) alerts.push(`${v.tipo} ${v.vehicleName}: Vence en ${Math.ceil(diff)} días.`);
       }
    });
    setNotifications(alerts);
  }, [flota, vencimientos]);

  // --- LOGIC: AI HANDLERS ---
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
      
      // Determine model based on grounding
      if (groundingMode === 'search') {
        modelName = 'gemini-3-flash-preview';
        tools = [{ googleSearch: {} }];
      } else if (groundingMode === 'maps') {
        modelName = 'gemini-2.5-flash';
        tools = [{ googleMaps: {} }];
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: userMsg,
        config: {
          tools: tools.length > 0 ? tools : undefined,
          systemInstruction: "Eres un asistente ejecutivo para 'JM Alquiler de Vehículos'. Responde de forma breve, profesional y estratégica.",
        }
      });

      let responseText = response.text || "No response text.";
      let sources: { uri: string; title: string }[] = [];

      // Extract Grounding Metadata
      if (groundingMode === 'search') {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((c: any) => {
            if (c.web?.uri) sources.push({ uri: c.web.uri, title: c.web.title || 'Fuente Externa' });
          });
        }
      } else if (groundingMode === 'maps') {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
         if (chunks) {
          chunks.forEach((c: any) => {
             if(c.web?.uri) sources.push({ uri: c.web.uri, title: "Google Maps"});
          });
        }
      }

      setChatMessages(prev => [...prev, { role: 'model', text: responseText, sources }]);

    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Error de conexión con Inteligencia Artificial. Verifique API Key.", isError: true }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!veoImage) {
      alert("Por favor cargue una imagen de referencia.");
      return;
    }
    setIsVeoGenerating(true);
    setGeneratedVideoUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const base64Image = veoImage.split(',')[1];
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: veoPrompt || "Cinematic shot of this car driving on a coastal road during sunset, 4k, highly detailed",
        image: {
           imageBytes: base64Image,
           mimeType: 'image/png' 
        },
        config: {
          numberOfVideos: 1,
          aspectRatio: veoAspectRatio,
          resolution: '720p'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
        const finalUrl = `${videoUri}&key=${process.env.API_KEY}`;
        setGeneratedVideoUrl(finalUrl);
      }

    } catch (error) {
      console.error(error);
      alert("Error generando video: " + error);
    } finally {
      setIsVeoGenerating(false);
    }
  };

  const handleVeoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVeoImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // FLOTA FUNCTIONS
  const handleSaveVehicle = () => {
     if(!newVehicle.nombre || !newVehicle.precio || !newVehicle.placa) {
        alert("Complete los campos obligatorios (*)");
        return;
     }

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
     setNewVehicle({
       nombre: '', precio: 0, placa: '', color: '', kilometrajeActual: 0,
       transmision: 'Automático', combustible: 'Nafta', asientos: 5, tipo: 'Compacto',
       img: '', specs: []
     });
     alert('Vehículo agregado a la flota exitosamente.');
  };

  const addSpec = () => {
    if (tempSpec && newVehicle.specs) {
       setNewVehicle({...newVehicle, specs: [...newVehicle.specs, tempSpec]});
       setTempSpec('');
    }
  };

  const handleAddExpiration = () => {
    if (!newExpiration.vehicleId || !newExpiration.vencimiento || !newExpiration.monto) {
       alert("Complete todos los campos del vencimiento");
       return;
    }
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

  const COLORS = ['#800000', '#D4AF37', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-8 animate-slideUp pb-40 max-w-full overflow-x-hidden relative">
      <NotificationCenter alerts={notifications} />

      {/* HEADER */}
      <div className="px-4 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-robust text-bordeaux-950 dark:text-white italic tracking-tighter leading-none">TERMINAL MASTER v3.8</h2>
          <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
            <ShieldCheck size={14}/> Centro de Inteligencia Operativa
          </p>
        </div>
        <div className="flex gap-2 relative">
           <button onClick={() => window.print()} className="p-4 bg-gray-950 text-white rounded-[1.5rem] shadow-2xl hover:scale-105 transition-transform"><Printer size={20}/></button>
           {notifications.length > 0 && (
             <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-bounce shadow-lg">{notifications.length}</span>
           )}
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex bg-white dark:bg-dark-elevated p-2 rounded-[3rem] border-2 dark:border-white/5 overflow-x-auto gap-2 scrollbar-hide shadow-xl">
        {[
          {id:'finanzas', icon: Landmark, label: 'Finanzas'},
          {id:'contratos', icon: FileText, label: 'Contratos'},
          {id:'flota', icon: Car, label: 'Gestión Flota'},
          {id:'taller', icon: Wrench, label: 'Taller'},
          {id:'checklists', icon: ClipboardList, label: 'Inspección'},
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

      {/* STATUS BAR FOR DATA SAVING VISIBILITY */}
      <div className="mx-4 px-6 py-3 bg-gray-100 dark:bg-dark-elevated rounded-2xl flex items-center justify-between border border-gray-200 dark:border-white/5 shadow-inner transition-all">
         <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shadow-sm transition-colors duration-500 ${isSyncing ? 'bg-gold animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
               <HardDrive size={12}/>
               {isSyncing ? 'Sincronizando con Nube...' : 'Datos Guardados (Memoria Local Segura)'}
            </span>
         </div>
         <div className="flex items-center gap-3 text-[8px] font-bold text-gray-400 uppercase">
            <span className="hidden md:inline bg-white dark:bg-white/10 px-2 py-1 rounded-lg">Última act: {new Date().toLocaleTimeString()}</span>
            {isSyncing ? <RefreshCw size={12} className="animate-spin text-gold"/> : <Save size={12} className="text-green-500"/>}
         </div>
      </div>

      {/* --- FINANZAS (ENHANCED) --- */}
      {activeTab === 'finanzas' && (
        <div className="space-y-8 animate-fadeIn px-2">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-gradient-to-br from-white to-emerald-50/50 dark:from-dark-card dark:to-emerald-900/10 p-8 rounded-[3rem] border-l-8 border-emerald-500 shadow-xl group hover:shadow-2xl transition-all relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><TrendingUp size={24}/></div>
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">INGRESOS</span>
                </div>
                <h3 className="text-4xl font-robust dark:text-white italic relative z-10">R$ {stats.income.toLocaleString()}</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 italic border-t border-gray-100 dark:border-white/5 pt-2 relative z-10">Gs. {(stats.income * exchangeRate).toLocaleString()}</p>
                <TrendingUp className="absolute -bottom-4 -right-4 text-emerald-500/10 w-32 h-32" />
             </div>
             
             <div className="bg-gradient-to-br from-white to-rose-50/50 dark:from-dark-card dark:to-rose-900/10 p-8 rounded-[3rem] border-l-8 border-rose-500 shadow-xl group hover:shadow-2xl transition-all relative overflow-hidden">
                 <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl"><TrendingDown size={24}/></div>
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">EGRESOS</span>
                </div>
                <h3 className="text-4xl font-robust dark:text-white italic relative z-10">R$ {stats.expense.toLocaleString()}</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 italic border-t border-gray-100 dark:border-white/5 pt-2 relative z-10">Gs. {(stats.expense * exchangeRate).toLocaleString()}</p>
                <TrendingDown className="absolute -bottom-4 -right-4 text-rose-500/10 w-32 h-32" />
             </div>

             <div className="bg-gradient-to-br from-bordeaux-950 to-bordeaux-900 p-8 rounded-[3rem] border-2 border-gold/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Landmark size={100} className="text-gold"/></div>
                <p className="text-[9px] font-black text-gold uppercase mb-2">Balance Neto</p>
                <h3 className="text-5xl font-robust text-white italic mt-4">R$ {stats.balance.toLocaleString()}</h3>
                <p className="text-sm font-bold text-gold/60 mt-2 italic">Gs. {(stats.balance * exchangeRate).toLocaleString()}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] shadow-xl h-[400px] border dark:border-white/5 relative">
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 flex items-center gap-2"><BarChart3 size={16}/> Flujo de Caja (Tendencia)</h4>
                <ResponsiveContainer width="100%" height="90%">
                   <AreaChart data={stats.areaData}>
                      <defs>
                        <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border:'none', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}} />
                      <Area type="monotone" dataKey="ing" stroke="#10b981" fillOpacity={1} fill="url(#colorIng)" />
                      <Area type="monotone" dataKey="gas" stroke="#ef4444" fillOpacity={1} fill="url(#colorGas)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
             <div className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] shadow-xl h-[400px] border dark:border-white/5">
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 flex items-center gap-2"><PieChartIcon size={16}/> Distribución de Costos</h4>
                <ResponsiveContainer width="100%" height="90%">
                   <PieChart>
                      <Pie data={stats.pieData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                         {stats.pieData.map((_, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {/* --- CONTRATOS --- */}
      {activeTab === 'contratos' && (
        <div className="space-y-6 px-2 animate-fadeIn relative">
           <button onClick={() => setShowManualBooking(!showManualBooking)} className="w-full py-6 bg-gold/10 border-4 border-dashed border-gold text-gold rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-gold/20 transition-all">
              <UserPlus size={24}/> Nuevo Contrato Directo (Bloquear Agenda)
           </button>

           {showManualBooking && (
             <form onSubmit={(e) => {
               e.preventDefault();
               // Formatear fechas a DD/MM/AAAA para consistencia con la nube y el calendario
               const startParts = manualRes.inicio.split('-');
               const endParts = manualRes.fin.split('-');
               const startFormatted = `${startParts[2]}/${startParts[1]}/${startParts[0]}`;
               const endFormatted = `${endParts[2]}/${endParts[1]}/${endParts[0]}`;

               const res: Reservation = {
                 id: `JM-MAN-${Date.now()}`, 
                 cliente: manualRes.cliente.toUpperCase(), 
                 email: 'manual@jmasociados.com', 
                 ci: 'MANUAL', 
                 documentType: 'CI', 
                 celular: '---', 
                 auto: manualRes.auto, 
                 inicio: startFormatted, // Guardar en formato paraguayo/hoja
                 fin: endFormatted, 
                 total: manualRes.total, 
                 status: 'Confirmed', // Importante para que salga en rojo
                 includeInCalendar: true
               };
               
               // USAR onAddReservation para que se guarde en la Nube y Local
               if (onAddReservation) {
                 onAddReservation(res);
                 setShowManualBooking(false);
                 setManualRes({ cliente: '', auto: '', inicio: '', fin: '', total: 0 });
                 alert("Reserva Manual Confirmada: Bloqueando Calendario y Sincronizando Nube...");
               } else {
                 setReservations([res, ...reservations]);
                 setShowManualBooking(false);
                 alert("Guardado localmente (Sin conexión a función principal).");
               }

             }} className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] border-2 border-gold shadow-2xl space-y-4">
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
                   <div className="relative">
                      <input type="number" placeholder="Total BRL" required value={manualRes.total} onChange={e => setManualRes({...manualRes, total: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                      {manualRes.total > 0 && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-green-600 uppercase">Automático</span>}
                   </div>
                </div>
                <button type="submit" className="w-full py-6 bordeaux-gradient text-white rounded-[2rem] font-black uppercase tracking-widest">Confirmar Bloqueo de Fechas</button>
             </form>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {reservations.map(r => (
               <div key={r.id} className="bg-white dark:bg-dark-card p-6 rounded-[2.5rem] border dark:border-white/5 flex justify-between items-center group hover:border-gold cursor-pointer transition-all shadow-md relative">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-bordeaux-50 rounded-2xl flex items-center justify-center text-bordeaux-800"><FileText size={20}/></div>
                     <div>
                        <p className="text-sm font-black dark:text-white uppercase italic leading-none">{r.cliente}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{r.auto} | {r.inicio}</p>
                        {r.obs && <p className="text-[8px] text-blue-500 font-bold mt-1 uppercase italic whitespace-pre-wrap">{r.obs}</p>}
                     </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                     <div>
                       <p className="text-lg font-robust dark:text-white">R$ {r.total}</p>
                       <span className={`px-3 py-0.5 rounded-full text-[7px] font-black uppercase ${r.status === 'Confirmed' ? 'bg-green-100 text-green-700' : r.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                     </div>
                     {/* Botón Ver Contrato */}
                     {(r.signature || r.status === 'Confirmed') && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); setViewingContract(r); }}
                           className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                           title="Ver Contrato"
                        >
                           <FileSignature size={16}/>
                        </button>
                     )}
                     {/* Manual Verification Button - Updated Label */}
                     {r.status !== 'Confirmed' && r.status !== 'Completed' && r.status !== 'Cancelled' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleVerifyPayment(r.id); }} 
                            className="p-3 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-colors flex items-center gap-2"
                            title="Validar Pago Manualmente"
                        >
                            <CheckCircle2 size={16}/> <span className="text-[8px] font-black uppercase hidden md:inline">Validar Pago</span>
                        </button>
                     )}
                     <button onClick={(e) => { e.stopPropagation(); setManagingRes(r); }} className="p-3 text-gray-300 hover:text-bordeaux-800 transition-colors"><Settings size={16}/></button>
                     <button onClick={(e) => { e.stopPropagation(); onDeleteReservation?.(r.id); }} className="p-3 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
               </div>
             ))}
           </div>

           {/* --- MODAL GESTION AVANZADA --- */}
           {managingRes && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-base/90 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-[3rem] p-8 shadow-2xl border-4 border-gold relative max-h-[90vh] overflow-y-auto scrollbar-hide">
                   <button onClick={() => setManagingRes(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-all"><X size={20}/></button>
                   
                   <div className="text-center mb-8">
                      <h3 className="text-2xl font-robust text-bordeaux-950 dark:text-white italic">Gestión Avanzada</h3>
                      <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Contrato: {managingRes.id}</p>
                   </div>

                   <div className="flex gap-2 bg-gray-100 dark:bg-dark-elevated p-1 rounded-2xl mb-6">
                      <button onClick={() => setManageMode('swap')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${manageMode === 'swap' ? 'bg-white shadow-md text-bordeaux-950' : 'text-gray-400'}`}>Cambio Unidad</button>
                      <button onClick={() => setManageMode('cancel')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${manageMode === 'cancel' ? 'bg-white shadow-md text-red-600' : 'text-gray-400'}`}>Rescisión</button>
                   </div>

                   {manageMode === 'swap' && (
                     <div className="space-y-4 animate-slideUp">
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                           <p className="text-[10px] text-blue-700 font-bold flex items-center gap-2"><Repeat size={14}/> El cambio mantiene las fechas. Puede ajustar los montos manualmente.</p>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-gray-400">Seleccionar Nueva Unidad</label>
                           <select value={swapVehicleId} onChange={e => setSwapVehicleId(e.target.value)} className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none">
                              <option value="">Seleccione...</option>
                              {flota.filter(v => v.nombre !== managingRes.auto).map(v => (
                                 <option key={v.id} value={v.id}>{v.nombre} ({v.placa})</option>
                              ))}
                           </select>
                        </div>
                        {swapVehicleId && (
                           <div className={`p-4 rounded-2xl border ${manualSwapValues.diff > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-1">
                                      <span className="text-[9px] font-black uppercase">Nuevo Total (R$)</span>
                                      <input 
                                         type="number" 
                                         value={manualSwapValues.newTotal} 
                                         onChange={e => {
                                             const val = Number(e.target.value);
                                             setManualSwapValues({ newTotal: val, diff: val - managingRes.total });
                                         }}
                                         className="w-full bg-white/50 rounded-xl px-2 py-1 font-bold border-b border-gray-300 outline-none"
                                      />
                                   </div>
                                   <div className="space-y-1 text-right">
                                      <span className="text-[9px] font-black uppercase">{manualSwapValues.diff > 0 ? 'A PAGAR' : 'DEVOLVER'} (R$)</span>
                                      <input 
                                         type="number" 
                                         value={manualSwapValues.diff} 
                                         onChange={e => {
                                             const val = Number(e.target.value);
                                             setManualSwapValues({ diff: val, newTotal: managingRes.total + val });
                                         }}
                                         className="w-full bg-white/50 rounded-xl px-2 py-1 font-black text-right border-b border-gray-300 outline-none"
                                      />
                                   </div>
                               </div>
                           </div>
                        )}
                     </div>
                   )}

                   {manageMode === 'cancel' && (
                     <div className="space-y-4 animate-slideUp">
                         <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center space-y-4">
                             <div className="flex justify-center items-center gap-2">
                                <Calculator size={14} className="text-red-400"/>
                                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Cálculo de Rescisión</span>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-gray-400">Multa (Retención)</label>
                                    <input 
                                       type="number" 
                                       value={manualCancelValues.penalty} 
                                       onChange={e => {
                                          const val = Number(e.target.value);
                                          setManualCancelValues({ penalty: val, refund: managingRes.total - val });
                                       }}
                                       className="w-full bg-white rounded-xl px-4 py-2 font-bold text-red-600 border border-red-100 text-lg"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-gray-400">Devolución Cliente</label>
                                    <input 
                                       type="number" 
                                       value={manualCancelValues.refund} 
                                       onChange={e => {
                                          const val = Number(e.target.value);
                                          setManualCancelValues({ refund: val, penalty: managingRes.total - val });
                                       }}
                                       className="w-full bg-white rounded-xl px-4 py-2 font-bold text-green-600 border border-green-100 text-lg"
                                    />
                                </div>
                             </div>
                         </div>
                         <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-2xl">
                             <span className="text-[10px] font-black uppercase text-gray-400">Total Original Pagado</span>
                             <span className="font-bold text-gray-700">R$ {managingRes.total}</span>
                         </div>
                     </div>
                   )}

                   {/* Custom Observation Field */}
                   <div className="mt-6 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1 flex items-center gap-2"><PenTool size={10}/> Motivo / Observación Adicional</label>
                      <textarea 
                         value={customObs}
                         onChange={e => setCustomObs(e.target.value)}
                         placeholder="Escriba aquí cualquier detalle adicional para el registro..."
                         className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl px-5 py-3 text-xs font-medium border-0 outline-none h-20 resize-none focus:ring-2 focus:ring-gold"
                      />
                   </div>

                   <button onClick={handleApplyChanges} className="w-full mt-6 py-5 bordeaux-gradient text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-transform">
                      {manageMode === 'swap' ? 'Confirmar Cambio' : 'Ejecutar Rescisión'}
                   </button>
                </div>
             </div>
           )}

           {/* --- MODAL VER CONTRATO --- */}
           {viewingContract && (
              <div className="fixed inset-0 z-[250] flex items-center justify-center bg-dark-base/90 backdrop-blur-sm p-4 animate-fadeIn">
                 <div className="relative bg-transparent w-full max-w-5xl h-[90vh] overflow-y-auto">
                    <button 
                       onClick={() => setViewingContract(null)} 
                       className="absolute top-4 right-4 z-50 p-4 bg-white text-black rounded-full shadow-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                       <X size={24}/>
                    </button>
                    {/* Renderizamos el componente de contrato directamente */}
                    {(() => {
                       const v = flota.find(f => f.nombre === viewingContract.auto) || flota[0];
                       // Calculamos días
                       const start = parseDate(viewingContract.inicio);
                       const end = parseDate(viewingContract.fin);
                       const diffTime = Math.abs(end.getTime() - start.getTime());
                       const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                       
                       return (
                          <ContractDocument 
                             vehicle={v}
                             data={viewingContract}
                             days={days}
                             totalPYG={viewingContract.total * exchangeRate}
                             signature={viewingContract.signature}
                          />
                       );
                    })()}
                 </div>
              </div>
           )}
        </div>
      )}

      {/* --- VENCIMIENTOS TAB (ALERTS REFINED & PAYMENTS) --- */}
      {activeTab === 'vencimientos' && (
        <div className="space-y-6 animate-fadeIn px-2">
           <div className="bg-white dark:bg-dark-card p-6 rounded-[3rem] border-2 border-gold/10 shadow-xl space-y-4">
              <h3 className="text-xl font-robust dark:text-white italic uppercase text-center flex items-center justify-center gap-2"><Bell className="text-gold"/> Monitor de Vencimientos</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                 <select value={newExpiration.vehicleId} onChange={e => setNewExpiration({...newExpiration, vehicleId: e.target.value})} className="col-span-2 bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-xs font-bold">
                    <option value="">Seleccionar Vehículo...</option>
                    {flota.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                 </select>
                 <select value={newExpiration.tipo} onChange={e => setNewExpiration({...newExpiration, tipo: e.target.value as any})} className="bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-xs font-bold">
                    <option value="Seguro">Seguro</option>
                    <option value="Patente">Patente</option>
                    <option value="Cuota">Cuota Financiación</option>
                    <option value="Inspección">Inspección</option>
                 </select>
                 <input type="date" value={newExpiration.vencimiento} onChange={e => setNewExpiration({...newExpiration, vencimiento: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-xs font-bold" />
                 <input type="number" placeholder="Monto" value={newExpiration.monto} onChange={e => setNewExpiration({...newExpiration, monto: Number(e.target.value)})} className="bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-xs font-bold" />
              </div>
              <button onClick={handleAddExpiration} className="w-full py-4 bg-bordeaux-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] transition-all">Agregar Vencimiento</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Combine Manual Expirations + Automated Service Alerts */}
              {(() => {
                 const allAlerts = [
                    ...vencimientos.map(v => ({...v, origin: 'manual'})),
                    ...flota.filter(f => f.maintenanceStatus !== 'ok').map(f => ({
                        id: `AUTO-SERV-${f.id}`,
                        vehicleId: f.id,
                        vehicleName: f.nombre,
                        tipo: 'Service Próximo',
                        vencimiento: new Date().toISOString().split('T')[0], // Priority now
                        monto: 0,
                        pagado: false,
                        origin: 'auto',
                        isCritical: f.maintenanceStatus === 'critical'
                    }))
                 ];

                 return allAlerts.sort((a,b) => new Date(a.vencimiento).getTime() - new Date(b.vencimiento).getTime()).map(v => {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const exp = new Date(v.vencimiento + 'T00:00:00');
                    const diffTime = exp.getTime() - today.getTime();
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    const isCritical = days <= 3 || (v as any).isCritical;
                    const isWarning = (days <= 15 && days > 3) || (v as any).origin === 'auto';
                    const isPaid = v.pagado;

                    return (
                        <div key={v.id} className={`p-8 rounded-[2.5rem] border-2 shadow-xl relative overflow-hidden transition-all group ${
                           isPaid ? 'bg-gray-50 border-gray-200 opacity-60 grayscale' :
                           isCritical ? 'bg-red-50 border-red-500 shadow-red-500/30' : 
                           isWarning ? 'bg-amber-50 border-amber-400 shadow-amber-500/20' : 
                           'bg-white dark:bg-dark-card border-gray-100 dark:border-white/5'
                        }`}>
                           {!isPaid && isCritical && <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none"></div>}
                           
                           <div className="flex justify-between items-start mb-6 relative z-10">
                              <div className="flex items-center gap-3">
                                 <div className={`p-3 rounded-2xl ${isPaid ? 'bg-gray-200 text-gray-500' : isCritical ? 'bg-red-100 text-red-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {isPaid ? <CheckCircle2 size={28}/> : isCritical ? <AlertCircle size={28} className="animate-bounce"/> : <AlertTriangle size={28}/>}
                                 </div>
                                 <div>
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{v.vehicleName}</h4>
                                    <h3 className={`text-xl font-robust italic ${isPaid ? 'text-gray-500 line-through' : isCritical ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-bordeaux-950 dark:text-white'}`}>{v.tipo}</h3>
                                 </div>
                              </div>
                              <div className="text-right">
                                 {isPaid ? (
                                    <span className="text-lg font-black text-green-600 uppercase">PAGADO</span>
                                 ) : (
                                    <>
                                       <span className={`text-5xl font-robust italic leading-none ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                                          {days}
                                       </span>
                                       <p className="text-[7px] font-black uppercase text-gray-400">Días Restantes</p>
                                    </>
                                 )}
                              </div>
                           </div>
                           
                           <div className="space-y-3 relative z-10 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-black/5">
                              <div className="flex justify-between items-center text-xs font-bold">
                                 <span className="text-gray-500 flex items-center gap-2"><CalendarClock size={12}/> Vencimiento</span>
                                 <span className="text-bordeaux-950 dark:text-white">{v.vencimiento}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold">
                                 <span className="text-gray-500 flex items-center gap-2"><HandCoins size={12}/> Monto</span>
                                 <span className="text-bordeaux-950 dark:text-white">R$ {v.monto}</span>
                              </div>
                           </div>

                           <div className="flex gap-2 mt-4 relative z-10">
                              {(v as any).origin === 'manual' && (
                                 <button 
                                    onClick={() => setVencimientos(vencimientos.map(x => x.id === v.id ? {...x, pagado: !x.pagado} : x))} 
                                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isPaid ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                 >
                                    {isPaid ? 'Reabrir' : 'Marcar Pagado'}
                                 </button>
                              )}
                              {(v as any).origin === 'manual' && (
                                 <button onClick={() => setVencimientos(vencimientos.filter(x => x.id !== v.id))} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                              )}
                           </div>
                        </div>
                    );
                 });
              })()}
           </div>
        </div>
      )}

      {/* --- TALLER PROFESSIONAL (WITH EDITING & PHOTOS) --- */}
      {activeTab === 'taller' && (
        <div className="space-y-8 px-2 animate-fadeIn">
           {flota.map(v => {
             const logs = mantenimientos.filter(m => m.vehicleId === v.id);
             
             // Estado calculado en App.tsx pero revalidamos para la visualización aquí si es necesario
             const alertStatus = v.maintenanceStatus || 'ok';
             const alertMsg = alertStatus === 'critical' ? 'VENCIDO - CRÍTICO' : alertStatus === 'warning' ? 'ATENCIÓN REQUERIDA' : 'ESTADO ÓPTIMO';

             return (
               <div key={v.id} className={`bg-white dark:bg-dark-card p-8 rounded-[3.5rem] border-2 shadow-xl space-y-6 relative overflow-hidden transition-all group ${
                 alertStatus === 'critical' ? 'border-red-500 shadow-red-500/30' : 
                 alertStatus === 'warning' ? 'border-gold shadow-gold/20' : 'border-gray-100 dark:border-white/5'
               }`}>
                  
                  {/* Status Indicator Stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-2 ${
                     alertStatus === 'critical' ? 'bg-red-600 animate-pulse' : alertStatus === 'warning' ? 'bg-gold' : 'bg-emerald-500'
                  }`}></div>

                  <div className="flex flex-col md:flex-row items-center gap-8 border-b dark:border-white/5 pb-6">
                     <div className="w-full md:w-48 h-32 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 relative group">
                        <img src={v.img} className="w-full h-full object-contain p-2 transition-transform group-hover:scale-110"/>
                     </div>
                     <div className="flex-1 text-center md:text-left space-y-3">
                        <div>
                           <h4 className="text-2xl font-robust dark:text-white uppercase italic">{v.nombre}</h4>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{v.placa}</p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                           <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 ${
                              alertStatus === 'critical' ? 'bg-red-600' : alertStatus === 'warning' ? 'bg-gold' : 'bg-emerald-500'
                           }`}>
                              {alertStatus === 'critical' && <AlertTriangle size={12} className="animate-bounce"/>}
                              {alertStatus === 'warning' && <AlertCircle size={12}/>}
                              {alertMsg}
                           </div>
                           <div className="px-4 py-2 bg-gray-100 dark:bg-dark-elevated rounded-xl text-[9px] font-black text-bordeaux-800 uppercase tracking-widest">
                              KM Actual: {v.kilometrajeActual}
                           </div>
                        </div>
                     </div>
                     <button onClick={() => {
                       const newM: MaintenanceRecord = { 
                          id: `M-${Date.now()}`, 
                          vehicleId: v.id, 
                          vehicleName: v.nombre, 
                          fecha: new Date().toISOString().split('T')[0], 
                          kilometraje: v.kilometrajeActual, 
                          descripcion: 'Mantenimiento Preventivo', 
                          monto: 0,
                          tipo: 'Preventivo',
                          vencimientoKM: v.kilometrajeActual + 5000,
                          vencimientoFecha: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0],
                          realizado: true,
                          images: []
                       };
                       setMantenimientos([...mantenimientos, newM]);
                       setExpandedMaintenance(prev => ({...prev, [v.id]: true}));
                     }} className="p-4 bg-bordeaux-950 text-white rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                        <Plus size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Nuevo Registro</span>
                     </button>
                  </div>

                  {/* Collapsible History Section */}
                  <div className="space-y-4">
                     <button 
                        onClick={() => setExpandedMaintenance(prev => ({...prev, [v.id]: !prev[v.id]}))}
                        className="w-full flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 hover:text-bordeaux-800 transition-colors"
                     >
                        <span className="flex items-center gap-2"><Wrench size={12}/> Historial Técnico ({logs.length})</span>
                        {expandedMaintenance[v.id] ? 'Ocultar' : 'Ver Detalles'}
                     </button>
                    
                    {expandedMaintenance[v.id] && logs.map(log => (
                      <div key={log.id} className="bg-gray-50 dark:bg-dark-base p-6 rounded-[2.5rem] border border-gray-200 dark:border-white/5 space-y-4 hover:border-gold/30 transition-all animate-slideUp">
                         <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                               <p className="text-[8px] font-black text-gray-400 uppercase">Descripción del Servicio</p>
                               <input type="text" value={log.descripcion} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, descripcion: e.target.value} : m))} className="w-full bg-white dark:bg-dark-elevated rounded-xl px-4 py-2 border-0 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-gold" />
                            </div>
                            <div className="w-full md:w-32 space-y-2">
                               <p className="text-[8px] font-black text-gray-400 uppercase">Costo (BRL)</p>
                               <input type="number" value={log.monto} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, monto: Number(e.target.value)} : m))} className="w-full bg-white dark:bg-dark-elevated rounded-xl px-4 py-2 border-0 text-sm font-black text-bordeaux-800 text-right outline-none focus:ring-2 focus:ring-gold" />
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-dark-elevated p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="space-y-1">
                               <p className="text-[7px] font-black text-gray-400 uppercase">Realizado (Fecha)</p>
                               <input type="date" value={log.fecha} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, fecha: e.target.value} : m))} className="bg-transparent text-[10px] font-bold w-full" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[7px] font-black text-gray-400 uppercase">Realizado (KM)</p>
                               <input type="number" value={log.kilometraje} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, kilometraje: Number(e.target.value)} : m))} className="bg-transparent text-[10px] font-bold w-full" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[7px] font-black text-rose-500 uppercase">Próx Vencimiento (Fecha)</p>
                               <input type="date" value={log.vencimientoFecha} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, vencimientoFecha: e.target.value} : m))} className="bg-transparent text-[10px] font-bold w-full text-rose-600" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[7px] font-black text-rose-500 uppercase">Próx Vencimiento (KM)</p>
                               <input type="number" value={log.vencimientoKM} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, vencimientoKM: Number(e.target.value)} : m))} className="bg-transparent text-[10px] font-bold w-full text-rose-600" />
                            </div>
                         </div>

                         {/* Photo Upload Area */}
                         <div>
                            <div className="flex gap-2 items-center mb-2">
                               <Camera size={14} className="text-gray-400"/>
                               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Evidencia Fotográfica</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                               {(log.images || []).map((img, idx) => (
                                  <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 relative group shrink-0">
                                     <img src={img} className="w-full h-full object-cover" />
                                     <button onClick={() => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, images: m.images?.filter((_, i) => i !== idx)} : m))} className="absolute inset-0 bg-red-500/50 hidden group-hover:flex items-center justify-center text-white"><X size={12}/></button>
                                  </div>
                               ))}
                               <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shrink-0">
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMaintenancePhotoUpload(e, log.id)} />
                                  <Plus size={16} className="text-gray-400"/>
                               </label>
                            </div>
                         </div>

                         <div className="flex justify-end">
                            <button onClick={() => setMantenimientos(mantenimientos.filter(x => x.id !== log.id))} className="text-[9px] font-black text-gray-300 hover:text-red-500 uppercase tracking-widest flex items-center gap-1"><Trash2 size={12}/> Eliminar Registro</button>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {/* --- FLOTA TAB --- */}
      {activeTab === 'flota' && (
        <div className="space-y-6 animate-fadeIn px-2">
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
                <div className="grid grid-cols-3 gap-4">
                   <select value={newVehicle.transmision} onChange={e => setNewVehicle({...newVehicle, transmision: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none">
                      <option value="Automático">Automático</option>
                      <option value="Manual">Manual</option>
                   </select>
                   <select value={newVehicle.combustible} onChange={e => setNewVehicle({...newVehicle, combustible: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none">
                      <option value="Nafta">Nafta</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Híbrido">Híbrido</option>
                      <option value="Eléctrico">Eléctrico</option>
                   </select>
                   <input type="number" placeholder="Asientos" value={newVehicle.asientos} onChange={e => setNewVehicle({...newVehicle, asientos: Number(e.target.value)})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none" />
                </div>
                <div>
                   <div className="flex gap-2 mb-2">
                      <input type="text" placeholder="Especificación (ej: Techo Solar)" value={tempSpec} onChange={e => setTempSpec(e.target.value)} className="flex-1 bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0 outline-none" />
                      <button onClick={addSpec} className="p-4 bg-gray-200 rounded-2xl hover:bg-gold hover:text-white transition-colors"><Plus size={20}/></button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {newVehicle.specs?.map((s, i) => (
                         <span key={i} className="bg-gray-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-gray-500">{s}</span>
                      ))}
                   </div>
                </div>
                <button onClick={handleSaveVehicle} className="w-full py-5 bordeaux-gradient text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Guardar Vehículo</button>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flota.map(v => (
                 <div key={v.id} className="bg-white dark:bg-dark-card p-6 rounded-[2.5rem] border dark:border-white/5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                    <img src={v.img} className="w-20 h-20 object-contain" />
                    <div className="flex-1">
                       <h4 className="font-robust dark:text-white uppercase italic">{v.nombre}</h4>
                       <p className="text-[9px] font-black text-gold uppercase tracking-widest">{v.placa} | {v.color}</p>
                       <div className="flex gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${v.estado === 'Disponible' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v.estado}</span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[8px] font-bold uppercase">{v.kilometrajeActual} KM</span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* --- CHECKLISTS TAB --- */}
      {activeTab === 'checklists' && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-50 animate-fadeIn">
           <ClipboardList size={60} className="text-gray-300"/>
           <div>
              <h3 className="text-2xl font-robust text-gray-400 italic">Módulo de Inspección</h3>
              <p className="text-sm font-bold text-gray-300">Próximamente disponible en v4.0</p>
           </div>
        </div>
      )}

      {/* --- AI STUDIO TAB --- */}
      {activeTab === 'ai_studio' && (
        <div className="space-y-6 animate-fadeIn px-2">
           <div className="flex gap-2 bg-gray-100 dark:bg-dark-elevated p-1 rounded-2xl mb-4">
              <button onClick={() => setAiTab('chat')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiTab === 'chat' ? 'bg-white shadow-md text-bordeaux-950' : 'text-gray-400'}`}>Asistente Operativo</button>
              <button onClick={() => setAiTab('veo')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiTab === 'veo' ? 'bg-white shadow-md text-bordeaux-950' : 'text-gray-400'}`}>Estudio Creativo (VEO)</button>
           </div>

           {aiTab === 'chat' && (
              <div className="bg-white dark:bg-dark-card rounded-[3rem] shadow-xl border dark:border-white/5 overflow-hidden h-[600px] flex flex-col">
                 <div className="p-6 bg-bordeaux-950 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <Bot size={24} className="text-gold"/>
                       <div>
                          <h3 className="font-robust italic">Gemini 3 Pro</h3>
                          <p className="text-[8px] font-black text-gold uppercase tracking-widest">JM Intelligence</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setGroundingMode('none')} className={`p-2 rounded-lg ${groundingMode === 'none' ? 'bg-white/20' : ''}`} title="Sin Grounding"><Sparkles size={16}/></button>
                       <button onClick={() => setGroundingMode('search')} className={`p-2 rounded-lg ${groundingMode === 'search' ? 'bg-white/20' : ''}`} title="Google Search"><Globe size={16}/></button>
                       <button onClick={() => setGroundingMode('maps')} className={`p-2 rounded-lg ${groundingMode === 'maps' ? 'bg-white/20' : ''}`} title="Google Maps"><MapPin size={16}/></button>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-dark-base">
                    {chatMessages.map((msg, idx) => (
                       <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-bordeaux-900 text-white rounded-br-none' : 'bg-white dark:bg-dark-elevated dark:text-gray-200 border border-gray-100 dark:border-white/5 rounded-bl-none shadow-sm'}`}>
                             <p className="whitespace-pre-wrap">{msg.text}</p>
                             {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 space-y-1">
                                   <p className="text-[9px] font-black uppercase text-gray-400">Fuentes:</p>
                                   {msg.sources.map((s, i) => (
                                      <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-500 hover:underline truncate">{s.title || s.uri}</a>
                                   ))}
                                </div>
                             )}
                          </div>
                       </div>
                    ))}
                    {isChatLoading && (
                       <div className="flex justify-start">
                          <div className="bg-white dark:bg-dark-elevated p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                             <Loader2 size={16} className="animate-spin text-gold"/>
                             <span className="text-xs text-gray-400 animate-pulse">Pensando...</span>
                          </div>
                       </div>
                    )}
                 </div>

                 <div className="p-4 bg-white dark:bg-dark-elevated border-t dark:border-white/5">
                    <div className="flex gap-2">
                       <input 
                          type="text" 
                          value={chatInput} 
                          onChange={e => setChatInput(e.target.value)} 
                          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Escriba su consulta..." 
                          className="flex-1 bg-gray-50 dark:bg-dark-base rounded-xl px-4 py-3 text-sm font-medium border-0 outline-none focus:ring-2 focus:ring-gold"
                       />
                       <button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()} className="p-3 bg-bordeaux-950 text-white rounded-xl disabled:opacity-50 hover:bg-black transition-all">
                          <Send size={20}/>
                       </button>
                    </div>
                 </div>
              </div>
           )}

           {aiTab === 'veo' && (
              <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] border-2 border-gold shadow-2xl space-y-6">
                 <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg mb-4">
                       <Video size={32}/>
                    </div>
                    <h3 className="text-2xl font-robust italic dark:text-white">Generador de Video (VEO)</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marketing Content Creator</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Prompt Creativo</label>
                          <textarea 
                             value={veoPrompt} 
                             onChange={e => setVeoPrompt(e.target.value)} 
                             placeholder="Describe el video que deseas generar (ej: Vehículo deportivo recorriendo la costanera al atardecer, cinematico, 4k)..."
                             className="w-full bg-gray-50 dark:bg-dark-base rounded-2xl p-4 text-sm font-medium h-32 resize-none border-0 outline-none focus:ring-2 focus:ring-purple-500"
                          />
                       </div>
                       <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Imagen de Referencia</label>
                          <label className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-base rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border border-dashed border-gray-300">
                             <input type="file" className="hidden" accept="image/*" onChange={handleVeoImageUpload} />
                             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm"><ImageIcon size={20}/></div>
                             <div className="flex-1">
                                <p className="text-xs font-bold dark:text-white">Cargar Imagen Base</p>
                                <p className="text-[9px] text-gray-400">JPG, PNG (Max 5MB)</p>
                             </div>
                             {veoImage && <div className="w-12 h-12 rounded-lg overflow-hidden border border-purple-500"><img src={veoImage} className="w-full h-full object-cover"/></div>}
                          </label>
                       </div>
                       <div className="flex gap-4">
                          <label className="flex-1 p-3 bg-gray-50 dark:bg-dark-base rounded-xl flex items-center gap-2 cursor-pointer border border-transparent has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50">
                             <input type="radio" name="ar" checked={veoAspectRatio === '16:9'} onChange={() => setVeoAspectRatio('16:9')} className="hidden"/>
                             <div className="w-8 h-4 border-2 border-gray-400 rounded-sm"></div>
                             <span className="text-[10px] font-black uppercase">Horizontal (16:9)</span>
                          </label>
                          <label className="flex-1 p-3 bg-gray-50 dark:bg-dark-base rounded-xl flex items-center gap-2 cursor-pointer border border-transparent has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50">
                             <input type="radio" name="ar" checked={veoAspectRatio === '9:16'} onChange={() => setVeoAspectRatio('9:16')} className="hidden"/>
                             <div className="w-4 h-8 border-2 border-gray-400 rounded-sm"></div>
                             <span className="text-[10px] font-black uppercase">Vertical (9:16)</span>
                          </label>
                       </div>
                       <button onClick={handleGenerateVideo} disabled={isVeoGenerating || !veoImage} className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                          {isVeoGenerating ? <Loader2 size={20} className="animate-spin"/> : <Play size={20}/>}
                          {isVeoGenerating ? 'Generando Video...' : 'Generar Video AI'}
                       </button>
                    </div>

                    <div className="bg-black/90 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden min-h-[300px]">
                       {generatedVideoUrl ? (
                          <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                       ) : (
                          <div className="text-center space-y-4 opacity-50">
                             <Video size={48} className="mx-auto text-white"/>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vista Previa</p>
                          </div>
                       )}
                       {isVeoGenerating && (
                          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-4 z-10">
                             <Loader2 size={40} className="text-purple-500 animate-spin"/>
                             <p className="text-xs font-black text-white uppercase tracking-widest animate-pulse">Renderizando Escena...</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}

    </div>
  );
};

export default AdminPanel;