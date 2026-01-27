
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Vehicle, Reservation, Gasto, MaintenanceRecord, ExpirationRecord, ChecklistLog, InspectionItem } from '../types';
import { 
  Landmark, FileText, Wrench, Search, Plus, Trash2, Printer, 
  CheckCircle2, AlertTriangle, UserPlus, Download, TrendingUp, TrendingDown,
  ArrowRight, PieChart as PieChartIcon, BarChart3, ClipboardList, 
  Car, MessageCircle, FileSpreadsheet, ShieldCheck, 
  Edit3, X, Settings, User, CreditCard, Check, AlertCircle, Bell,
  Sparkles, Bot, Video, MapPin, Globe, Loader2, Play, Image as ImageIcon
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { GoogleGenAI } from "@google/genai";

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
  vencimientos = [], setVencimientos
}) => {
  const [activeTab, setActiveTab] = useState<'finanzas' | 'contratos' | 'taller' | 'checklists' | 'ai_studio'>('finanzas');
  const [finanzasFilter, setFinanzasFilter] = useState({ start: '', end: '', vehicle: '' });
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualRes, setManualRes] = useState({ cliente: '', auto: '', inicio: '', fin: '', total: 0 });
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNewChecklist, setShowNewChecklist] = useState<string | null>(null);

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
      const logs = mantenimientos.filter(m => m.vehicleId === v.id);
      const lastService = logs.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
      
      if (lastService) {
        if (lastService.vencimientoKM && v.kilometrajeActual >= lastService.vencimientoKM) {
          alerts.push(`${v.nombre}: Mantenimiento Vencido por KM.`);
        } else if (lastService.vencimientoKM && (lastService.vencimientoKM - v.kilometrajeActual <= 500)) {
           alerts.push(`${v.nombre}: Mantenimiento Próximo (${lastService.vencimientoKM - v.kilometrajeActual} KM).`);
        }

        if (lastService.vencimientoFecha) {
          const today = new Date();
          const dueDate = new Date(lastService.vencimientoFecha);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          if (diffDays <= 0) {
            alerts.push(`${v.nombre}: Mantenimiento Vencido por Fecha.`);
          } else if (diffDays <= 7) {
            alerts.push(`${v.nombre}: Vence en ${diffDays} días.`);
          }
        }
      }
    });
    setNotifications(alerts);
  }, [flota, mantenimientos]);

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
          {id:'taller', icon: Wrench, label: 'Taller'},
          {id:'checklists', icon: ClipboardList, label: 'Inspección'},
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
        <div className="space-y-6 px-2 animate-fadeIn">
           <button onClick={() => setShowManualBooking(!showManualBooking)} className="w-full py-6 bg-gold/10 border-4 border-dashed border-gold text-gold rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-gold/20 transition-all">
              <UserPlus size={24}/> Nuevo Contrato Directo (Bloquear Agenda)
           </button>

           {showManualBooking && (
             <form onSubmit={(e) => {
               e.preventDefault();
               const res: Reservation = {
                 id: `JM-MAN-${Date.now()}`, cliente: manualRes.cliente.toUpperCase(), email: 'manual@jmasociados.com', ci: 'MANUAL', documentType: 'CI', celular: '---', auto: manualRes.auto, inicio: manualRes.inicio, fin: manualRes.fin, total: manualRes.total, status: 'Confirmed', includeInCalendar: true
               };
               setReservations([res, ...reservations]);
               setShowManualBooking(false);
               alert("Fechas bloqueadas en el calendario.");
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
                   <input type="number" placeholder="Total BRL" required value={manualRes.total} onChange={e => setManualRes({...manualRes, total: Number(e.target.value)})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                </div>
                <button type="submit" className="w-full py-6 bordeaux-gradient text-white rounded-[2rem] font-black uppercase tracking-widest">Confirmar Bloqueo de Fechas</button>
             </form>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {reservations.map(r => (
               <div key={r.id} className="bg-white dark:bg-dark-card p-6 rounded-[2.5rem] border dark:border-white/5 flex justify-between items-center group hover:border-gold cursor-pointer transition-all shadow-md">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-bordeaux-50 rounded-2xl flex items-center justify-center text-bordeaux-800"><FileText size={20}/></div>
                     <div>
                        <p className="text-sm font-black dark:text-white uppercase italic leading-none">{r.cliente}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{r.auto} | {r.inicio}</p>
                     </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                     <div>
                       <p className="text-lg font-robust dark:text-white">R$ {r.total}</p>
                       <span className={`px-3 py-0.5 rounded-full text-[7px] font-black uppercase ${r.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); onDeleteReservation?.(r.id); }} className="p-3 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* --- TALLER PROFESSIONAL (WITH INTEGRATED ALERTS) --- */}
      {activeTab === 'taller' && (
        <div className="space-y-8 px-2 animate-fadeIn">
           {flota.map(v => {
             const logs = mantenimientos.filter(m => m.vehicleId === v.id);
             // Verificar estado de alerta para este vehículo
             const lastService = logs.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
             
             let alertStatus = 'OK';
             let alertMsg = 'Estado Óptimo';
             let daysLeft = 99;
             let kmLeft = 99999;

             if (lastService) {
                if (lastService.vencimientoKM) kmLeft = lastService.vencimientoKM - v.kilometrajeActual;
                if (lastService.vencimientoFecha) {
                   daysLeft = Math.ceil((new Date(lastService.vencimientoFecha).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                }

                if (kmLeft <= 0 || daysLeft <= 0) {
                   alertStatus = 'CRITICAL';
                   alertMsg = 'VENCIDO - REQUIERE ATENCIÓN';
                } else if (kmLeft <= 500 || daysLeft <= 15) {
                   alertStatus = 'WARNING';
                   alertMsg = 'MANTENIMIENTO PRÓXIMO';
                }
             }

             return (
               <div key={v.id} className={`bg-white dark:bg-dark-card p-8 rounded-[3.5rem] border-2 shadow-xl space-y-6 relative overflow-hidden transition-all group ${
                 alertStatus === 'CRITICAL' ? 'border-red-500 shadow-red-500/10' : 
                 alertStatus === 'WARNING' ? 'border-gold shadow-gold/10' : 'border-gray-100 dark:border-white/5'
               }`}>
                  
                  {/* Status Indicator Stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-2 ${
                     alertStatus === 'CRITICAL' ? 'bg-red-500' : alertStatus === 'WARNING' ? 'bg-gold' : 'bg-emerald-500'
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
                              alertStatus === 'CRITICAL' ? 'bg-red-500' : alertStatus === 'WARNING' ? 'bg-gold' : 'bg-emerald-500'
                           }`}>
                              {alertStatus === 'CRITICAL' && <AlertTriangle size={12}/>}
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
                          descripcion: 'Nuevo Mantenimiento', 
                          monto: 0,
                          tipo: 'Preventivo',
                          vencimientoKM: v.kilometrajeActual + 5000,
                          vencimientoFecha: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0],
                          realizado: true
                       };
                       setMantenimientos([...mantenimientos, newM]);
                     }} className="p-4 bg-bordeaux-950 text-white rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                        <Plus size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Nuevo Registro</span>
                     </button>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Wrench size={12}/> Historial Técnico</p>
                    {logs.map(log => (
                      <div key={log.id} className="bg-gray-50 dark:bg-dark-base p-6 rounded-[2.5rem] border border-gray-200 dark:border-white/5 space-y-4 hover:border-gold/30 transition-all">
                         <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                               <p className="text-[8px] font-black text-gray-400 uppercase">Descripción</p>
                               <input type="text" value={log.descripcion} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, descripcion: e.target.value} : m))} className="w-full bg-transparent border-b border-gray-300 text-sm font-bold dark:text-white outline-none focus:border-gold" />
                            </div>
                            <div className="w-full md:w-32 space-y-2">
                               <p className="text-[8px] font-black text-gray-400 uppercase">Costo (BRL)</p>
                               <input type="number" value={log.monto} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, monto: Number(e.target.value)} : m))} className="w-full bg-transparent border-b border-gray-300 text-sm font-black text-bordeaux-800 text-right outline-none focus:border-gold" />
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
                               <p className="text-[7px] font-black text-rose-500 uppercase">Vence (Fecha)</p>
                               <input type="date" value={log.vencimientoFecha} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, vencimientoFecha: e.target.value} : m))} className="bg-transparent text-[10px] font-bold w-full text-rose-600" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[7px] font-black text-rose-500 uppercase">Vence (KM)</p>
                               <input type="number" value={log.vencimientoKM} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, vencimientoKM: Number(e.target.value)} : m))} className="bg-transparent text-[10px] font-bold w-full text-rose-600" />
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

      {/* --- INSPECCIÓN PROFESIONAL --- */}
      {activeTab === 'checklists' && (
        <div className="space-y-6 px-2 animate-fadeIn">
           {flota.map(v => (
             <div key={v.id} className="bg-white dark:bg-dark-card p-8 rounded-[3.5rem] border dark:border-white/5 shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden"><img src={v.img} className="w-full h-full object-contain"/></div>
                      <h4 className="text-xl font-robust dark:text-white uppercase italic">{v.nombre}</h4>
                   </div>
                   <button onClick={() => setShowNewChecklist(v.id)} className="p-3 bg-bordeaux-950 text-gold rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                     <Plus size={18}/> <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">Nueva Inspección</span>
                   </button>
                </div>

                {/* Lista de Inspecciones */}
                <div className="space-y-3">
                   {(v.checklists || []).length === 0 && <p className="text-center text-[10px] text-gray-300 font-bold uppercase py-4">Sin inspecciones registradas</p>}
                   {(v.checklists || []).map((c) => (
                     <div key={c.id} className="bg-gray-50 dark:bg-dark-base p-6 rounded-[2rem] border dark:border-white/5 relative group hover:border-gold/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white ${c.tipo === 'Check-In' ? 'bg-emerald-500' : 'bg-blue-500'}`}>{c.tipo}</span>
                              <p className="text-[10px] font-bold text-gray-500 mt-2">{c.fecha} • {c.responsable} • {c.kilometraje} KM</p>
                           </div>
                           <button onClick={() => {
                              if(confirm('¿Borrar inspección permanentemente?')) {
                                 const updatedFlota = flota.map(veh => veh.id === v.id ? {...veh, checklists: veh.checklists?.filter(ck => ck.id !== c.id)} : veh);
                                 setFlota(updatedFlota);
                              }
                           }} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                        
                        {/* Resumen Visual */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                           {['Exterior', 'Interior', 'Mecánica', 'Docs'].map((cat, i) => {
                              const items = i === 0 ? c.exterior : i === 1 ? c.interior : i === 2 ? c.mecanica : c.documentacion;
                              const issues = (items || []).filter(x => x.status === 'bad').length;
                              return (
                                 <div key={i} className={`p-2 rounded-xl text-center border ${issues > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                    <p className="text-[7px] font-black uppercase">{cat}</p>
                                    <p className="text-[9px] font-bold">{issues > 0 ? `${issues} Alertas` : 'OK'}</p>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           ))}

           {/* Modal Nueva Inspección */}
           {showNewChecklist && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-base/90 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-dark-card w-full max-w-2xl h-[90vh] rounded-[3rem] p-8 overflow-y-auto shadow-2xl border-4 border-gold relative animate-slideUp">
                   <button onClick={() => setShowNewChecklist(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-all"><X size={20}/></button>
                   <h3 className="text-2xl font-serif font-bold text-bordeaux-950 mb-6 text-center">Inspección Profesional</h3>
                   <InspectionForm 
                      vehicleId={showNewChecklist}
                      flota={flota}
                      setFlota={setFlota}
                      onClose={() => setShowNewChecklist(null)}
                   />
                </div>
             </div>
           )}
        </div>
      )}

      {/* --- AI STUDIO (GEMINI 3 PRO / VEO 3.1) --- */}
      {activeTab === 'ai_studio' && (
        <div className="space-y-6 animate-fadeIn px-2 h-[700px] flex flex-col">
           {/* Sub-Navigation for AI */}
           <div className="flex justify-center gap-4 mb-4">
              <button onClick={() => setAiTab('chat')} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${aiTab === 'chat' ? 'bg-bordeaux-950 text-white shadow-lg' : 'bg-white text-gray-400'}`}>
                 <Bot size={14} className="inline mr-2"/> Asistente JM
              </button>
              <button onClick={() => setAiTab('veo')} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${aiTab === 'veo' ? 'bg-bordeaux-950 text-white shadow-lg' : 'bg-white text-gray-400'}`}>
                 <Video size={14} className="inline mr-2"/> Veo Studio
              </button>
           </div>

           <div className="flex-1 bg-white dark:bg-dark-card rounded-[3rem] border border-gold/10 shadow-2xl overflow-hidden relative">
              {/* CHAT INTERFACE */}
              {aiTab === 'chat' && (
                <div className="h-full flex flex-col">
                   {/* Tool Toggles */}
                   <div className="p-4 bg-gray-50/50 dark:bg-dark-elevated border-b dark:border-white/5 flex justify-center gap-3">
                      <button onClick={() => setGroundingMode(groundingMode === 'search' ? 'none' : 'search')} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border flex items-center gap-2 transition-all ${groundingMode === 'search' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-400 border-gray-100'}`}>
                         <Globe size={12}/> Google Search
                      </button>
                      <button onClick={() => setGroundingMode(groundingMode === 'maps' ? 'none' : 'maps')} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border flex items-center gap-2 transition-all ${groundingMode === 'maps' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-400 border-gray-100'}`}>
                         <MapPin size={12}/> Google Maps
                      </button>
                   </div>

                   {/* Messages Area */}
                   <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {chatMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full opacity-30">
                           <Bot size={60} className="mb-4 text-bordeaux-800"/>
                           <p className="text-[10px] font-black uppercase tracking-widest">Inicie conversación con Gemini 3 Pro</p>
                        </div>
                      )}
                      {chatMessages.map((msg, idx) => (
                         <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-bordeaux-950 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-dark-elevated dark:text-gray-200 rounded-tl-none'}`}>
                               <p className="leading-relaxed">{msg.text}</p>
                               {msg.sources && msg.sources.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                                     <p className="text-[8px] font-black opacity-50 uppercase mb-2">Fuentes Consultadas:</p>
                                     <div className="flex flex-wrap gap-2">
                                        {msg.sources.map((src, i) => (
                                           <a key={i} href={src.uri} target="_blank" className="bg-white dark:bg-black/20 px-3 py-1 rounded-lg text-[9px] text-blue-500 hover:text-blue-600 truncate max-w-[200px] flex items-center gap-1">
                                              <Globe size={10}/> {src.title}
                                           </a>
                                        ))}
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>
                      ))}
                      {isChatLoading && (
                         <div className="flex justify-start">
                            <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none"><Loader2 className="animate-spin text-gray-400" size={16}/></div>
                         </div>
                      )}
                   </div>

                   {/* Input Area */}
                   <div className="p-4 bg-white dark:bg-dark-card border-t dark:border-white/5 flex gap-3">
                      <input 
                         value={chatInput}
                         onChange={e => setChatInput(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                         placeholder="Pregunte a Gemini 3 Pro (ej: Estrategias de precios, buscar noticias...)"
                         className="flex-1 bg-gray-50 dark:bg-dark-elevated rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-gold font-medium"
                      />
                      <button onClick={handleSendMessage} className="p-4 bg-bordeaux-950 text-white rounded-2xl hover:scale-105 transition-transform"><ArrowRight size={20}/></button>
                   </div>
                </div>
              )}

              {/* VEO STUDIO INTERFACE */}
              {aiTab === 'veo' && (
                <div className="h-full flex flex-col p-8 overflow-y-auto">
                   <div className="flex flex-col md:flex-row gap-8 h-full">
                      <div className="flex-1 space-y-6">
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 flex items-center gap-2"><ImageIcon size={12}/> 1. Imagen Base</label>
                            <label className="w-full h-48 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-colors overflow-hidden relative group">
                               <input type="file" accept="image/*" onChange={handleVeoImageUpload} className="hidden" />
                               {veoImage ? (
                                  <img src={veoImage} className="w-full h-full object-cover" />
                               ) : (
                                  <>
                                     <div className="p-4 bg-gray-100 rounded-full mb-3 group-hover:scale-110 transition-transform"><Plus size={24} className="text-gray-400"/></div>
                                     <span className="text-[8px] font-black uppercase text-gray-300 tracking-widest">Arrastre o Click para subir</span>
                                  </>
                               )}
                            </label>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-gray-400 ml-2 flex items-center gap-2"><Bot size={12}/> 2. Prompt de Animación</label>
                            <textarea 
                               value={veoPrompt} 
                               onChange={e => setVeoPrompt(e.target.value)}
                               placeholder="Describa el movimiento deseado (ej: El auto acelera en una autopista futurista con luces de neón...)"
                               className="w-full h-32 bg-gray-50 dark:bg-dark-elevated rounded-2xl p-5 text-sm resize-none outline-none focus:ring-2 focus:ring-gold font-medium"
                            />
                         </div>
                         <div className="flex gap-4">
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase text-gray-300 ml-1">Formato</label>
                               <select value={veoAspectRatio} onChange={e => setVeoAspectRatio(e.target.value as any)} className="bg-gray-50 dark:bg-dark-elevated px-6 py-4 rounded-2xl text-xs font-bold border-0 outline-none">
                                  <option value="16:9">Horizontal (16:9)</option>
                                  <option value="9:16">Vertical (9:16)</option>
                               </select>
                            </div>
                            <button onClick={handleGenerateVideo} disabled={isVeoGenerating || !veoImage} className="flex-1 bordeaux-gradient mt-auto text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] disabled:opacity-50 transition-all shadow-xl h-[52px]">
                               {isVeoGenerating ? <Loader2 className="animate-spin" size={16}/> : <Play size={16} fill="white"/>} 
                               {isVeoGenerating ? 'Renderizando...' : 'Generar Video con Veo'}
                            </button>
                         </div>
                      </div>
                      
                      <div className="flex-1 bg-black rounded-[2.5rem] flex items-center justify-center relative overflow-hidden shadow-2xl border-4 border-gray-900">
                         {generatedVideoUrl ? (
                            <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                         ) : (
                            <div className="text-center opacity-30">
                               <Video size={60} className="mx-auto text-white mb-4"/>
                               <p className="text-[9px] font-black text-white uppercase tracking-[0.5em]">Vista Previa</p>
                            </div>
                         )}
                         {isVeoGenerating && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-10 backdrop-blur-sm">
                               <Loader2 size={50} className="animate-spin mb-6 text-gold"/>
                               <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Procesando con Veo 3.1...</p>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

// Subcomponente Formulario Inspección
const InspectionForm: React.FC<{ vehicleId: string, flota: Vehicle[], setFlota: (f: Vehicle[]) => void, onClose: () => void }> = ({ vehicleId, flota, setFlota, onClose }) => {
   const vehicle = flota.find(v => v.id === vehicleId);
   const [data, setData] = useState<ChecklistLog>({
      id: `C-${Date.now()}`,
      tipo: 'Check-In',
      fecha: new Date().toISOString().split('T')[0],
      responsable: '',
      kilometraje: vehicle?.kilometrajeActual || 0,
      combustible: 'Full',
      exterior: [
         { label: 'Paragolpes Delantero', status: 'ok' },
         { label: 'Paragolpes Trasero', status: 'ok' },
         { label: 'Puertas Laterales', status: 'ok' },
         { label: 'Capó y Techo', status: 'ok' },
         { label: 'Cristales/Espejos', status: 'ok' }
      ],
      interior: [
         { label: 'Tapizado', status: 'ok' },
         { label: 'Tablero/Instrumentos', status: 'ok' },
         { label: 'Limpieza General', status: 'ok' }
      ],
      mecanica: [
         { label: 'Luces', status: 'ok' },
         { label: 'Neumáticos', status: 'ok' },
         { label: 'Niveles (Agua/Aceite)', status: 'ok' }
      ],
      documentacion: [
         { label: 'Cédula Verde', status: 'ok' },
         { label: 'Habilitación', status: 'ok' },
         { label: 'Seguro al Día', status: 'ok' }
      ],
      observacionesGlobales: '',
      firmado: false
   });

   const toggleItem = (category: 'exterior' | 'interior' | 'mecanica' | 'documentacion', idx: number) => {
      const items = [...data[category]];
      items[idx].status = items[idx].status === 'ok' ? 'bad' : 'ok';
      setData({...data, [category]: items});
   };

   const handleSubmit = () => {
      const updatedFlota = flota.map(v => v.id === vehicleId ? {...v, checklists: [data, ...(v.checklists || [])]} : v);
      setFlota(updatedFlota);
      onClose();
   };

   return (
      <div className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-gray-400">Tipo Movimiento</label>
               <select value={data.tipo} onChange={e => setData({...data, tipo: e.target.value as any})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold border-0">
                  <option value="Check-In">Entrada (Check-In)</option>
                  <option value="Check-Out">Salida (Check-Out)</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-gray-400">Responsable</label>
               <input type="text" value={data.responsable} onChange={e => setData({...data, responsable: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold border-0" placeholder="Nombre..." />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-gray-400">Kilometraje</label>
               <input type="number" value={data.kilometraje} onChange={e => setData({...data, kilometraje: Number(e.target.value)})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold border-0" />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-gray-400">Combustible</label>
               <select value={data.combustible} onChange={e => setData({...data, combustible: e.target.value as any})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold border-0">
                  <option value="Full">Lleno (Full)</option>
                  <option value="3/4">3/4 Tanque</option>
                  <option value="1/2">1/2 Tanque</option>
                  <option value="1/4">1/4 Tanque</option>
                  <option value="1/8">Reserva</option>
               </select>
            </div>
         </div>

         {/* Categorías Dinámicas */}
         {['exterior', 'interior', 'mecanica', 'documentacion'].map((cat) => (
            <div key={cat} className="bg-gray-50 p-4 rounded-2xl">
               <h5 className="text-[10px] font-black uppercase text-bordeaux-800 mb-3 tracking-widest border-b border-gray-200 pb-1">{cat}</h5>
               <div className="space-y-2">
                  {(data[cat as keyof ChecklistLog] as InspectionItem[]).map((item, idx) => (
                     <div key={idx} onClick={() => toggleItem(cat as any, idx)} className="flex justify-between items-center p-2 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50">
                        <span className="text-[10px] font-bold uppercase">{item.label}</span>
                        <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-colors ${item.status === 'ok' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                           {item.status === 'ok' ? 'APROBADO' : 'OBSERVADO'}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         ))}

         <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-gray-400">Observaciones Generales</label>
            <textarea value={data.observacionesGlobales} onChange={e => setData({...data, observacionesGlobales: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-medium border-0 min-h-[80px]" placeholder="Detalles adicionales..." />
         </div>

         <button onClick={handleSubmit} className="w-full py-4 bg-bordeaux-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform">
            Guardar Inspección
         </button>
      </div>
   );
};

export default AdminPanel;
