
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  ShieldCheck, ArrowRight, Lock, Mail, 
  RefreshCw, Eye, EyeOff, 
  Fingerprint, ScanFace, ShieldAlert,
  Check, UserPlus, Sparkles, Smartphone,
  KeyRound
} from 'lucide-react';

interface LoginProps {
  onLogin: (userData: User, remember: boolean) => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading: externalLoading }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'biometric' | 'authenticating'>('login');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loginData, setLoginData] = useState({ email: '', pass: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', pass: '', ci: '' });

  useEffect(() => {
    setError(null);
  }, [view]);

  const handleManualLogin = async () => {
    setError(null);
    const email = loginData.email.toLowerCase().trim();
    const pin = loginData.pass.trim();

    if (email === 'admin@jmasociados.com' && pin === 'jm2026') {
      setLoading(true);
      setView('authenticating');
      await new Promise(r => setTimeout(r, 2000));
      onLogin({
        name: "Guilherme Fazzi",
        email: email,
        picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        isAdmin: true
      }, rememberMe);
    } else {
      setError("ACCESO DENEGADO: Credenciales no válidas para el protocolo JM.");
    }
  };

  const handleBiometricAuth = async () => {
    setView('biometric');
    await new Promise(r => setTimeout(r, 2500));
    onLogin({
      name: "Socio Platinum",
      email: "socio@jmasociados.com",
      picture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      isAdmin: false
    }, true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8 relative overflow-hidden font-sans">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-bordeaux-50 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-gray-50 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-lg z-10 space-y-8 animate-fadeIn">
        <div className="flex flex-col items-center">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 mb-4 hover:scale-105 transition-transform duration-500">
            <img src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" alt="JM Logo" className="h-16 md:h-20 w-auto object-contain" />
          </div>
          <p className="text-bordeaux-800 text-[10px] font-black uppercase tracking-[0.6em]">Security & Luxury Protocol</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[3.5rem] p-8 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-white/50 relative">
          
          {view === 'authenticating' ? (
            <div className="py-20 flex flex-col items-center space-y-6 text-center">
               <RefreshCw className="text-bordeaux-800 animate-spin" size={60} />
               <p className="text-xl font-serif font-bold text-bordeaux-950 italic">Validando Identidad...</p>
            </div>
          ) : view === 'biometric' ? (
            <div className="py-16 flex flex-col items-center space-y-10">
               <div className="w-48 h-48 bg-bordeaux-50 rounded-[3rem] flex items-center justify-center text-bordeaux-800 relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bordeaux-500/20 to-transparent animate-scan"></div>
                  <ScanFace size={90} strokeWidth={1} className="animate-pulse" />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Iniciando Apple FaceID</p>
            </div>
          ) : view === 'login' ? (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-serif font-bold text-bordeaux-950 italic">Acceso <span className="text-gold">Socio</span></h1>
                <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Ingrese al Terminal de Gestión</p>
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={handleBiometricAuth} className="flex items-center justify-center gap-3 bg-bordeaux-950 text-white py-4 rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95">
                    <Fingerprint size={20} className="text-gold" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Biometría</span>
                 </button>
                 <button className="flex items-center justify-center gap-3 bg-gray-50 border border-gray-100 py-4 rounded-2xl hover:bg-white transition-all shadow-sm active:scale-95">
                    <Smartphone size={20} className="text-bordeaux-800" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Apple ID</span>
                 </button>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                   <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-colors" size={18} />
                   <input 
                      type="email" 
                      placeholder="Identificador de Socio" 
                      value={loginData.email} 
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})} 
                      className="w-full bg-gray-50/50 border-0 rounded-[2rem] pl-16 pr-6 py-5 font-bold text-sm outline-none focus:ring-4 focus:ring-bordeaux-50 transition-all shadow-inner" 
                   />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-colors" size={18} />
                  <input 
                    type={showPass ? "text" : "password"} 
                    placeholder="PIN Maestro" 
                    value={loginData.pass} 
                    onChange={(e) => setLoginData({...loginData, pass: e.target.value})} 
                    className="w-full bg-gray-50/50 border-0 rounded-[2rem] pl-16 pr-20 py-5 font-bold text-sm outline-none focus:ring-4 focus:ring-bordeaux-50 transition-all shadow-inner" 
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-bordeaux-800 transition-all">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-bordeaux-800 border-bordeaux-800' : 'border-gray-200'}`}>
                       {rememberMe && <Check size={12} className="text-white" strokeWidth={4} />}
                    </div>
                    <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recordar</span>
                 </label>
                 <button onClick={() => setView('forgot')} className="text-[10px] font-black text-bordeaux-800 uppercase tracking-widest">¿Olvidó PIN?</button>
              </div>

              {error && <p className="text-[10px] text-center font-bold text-red-500 uppercase tracking-widest animate-pulse">{error}</p>}

              <button onClick={handleManualLogin} className="w-full bordeaux-gradient text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.6em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                 Autenticar <ArrowRight size={18} />
              </button>
              
              <button onClick={() => setView('register')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-bordeaux-800 transition-colors">
                ¿No es socio? <span className="text-bordeaux-800">Registrar Nuevo Perfil</span>
              </button>
            </div>
          ) : view === 'register' ? (
            <div className="space-y-6">
               <div className="text-center space-y-2">
                <h1 className="text-2xl font-serif font-bold text-bordeaux-950 italic">Registro <span className="text-gold">Platinum</span></h1>
                <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Cree su perfil corporativo</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 <input type="text" placeholder="Nombre Completo" className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-bold border-0 shadow-inner" />
                 <input type="email" placeholder="Email Corporativo" className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-bold border-0 shadow-inner" />
                 <input type="text" placeholder="Cédula / RG" className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-bold border-0 shadow-inner" />
                 <input type="password" placeholder="Definir PIN Maestro" className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-bold border-0 shadow-inner" />
              </div>
              <button onClick={() => setView('login')} className="w-full bordeaux-gradient text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl">Registrar y Validar</button>
              <button onClick={() => setView('login')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">Volver al Terminal</button>
            </div>
          ) : (
            <div className="py-12 text-center space-y-8 animate-fadeIn">
               <div className="w-20 h-20 bg-bordeaux-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-bordeaux-800">
                  {/* Fixed missing KeyRound icon import from lucide-react */}
                  <KeyRound size={40} strokeWidth={1} />
               </div>
               <div className="space-y-2">
                  <h2 className="text-2xl font-serif font-bold text-bordeaux-950 italic">Recuperación</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-8">Solicite un nuevo PIN al soporte JM Asociados</p>
               </div>
               <button onClick={() => setView('login')} className="text-[10px] font-black text-bordeaux-800 uppercase tracking-widest border-b-2 border-bordeaux-100 pb-1">Regresar</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default Login;
