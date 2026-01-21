
import React, { useState } from 'react';
import { 
  ShieldCheck, ArrowRight, Lock, Mail, Apple, 
  AlertCircle, ScanFace, User, CreditCard, 
  ChevronLeft, Fingerprint, Eye, EyeOff,
  RefreshCw, Globe, Smartphone, MapPin, 
  Search, CheckCircle2
} from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(false);
  const [isBiometricActive, setIsBiometricActive] = useState(false);

  const [regData, setRegData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    ci: '',
    tel: '',
    direccion: '',
    nacionalidad: '',
    pass: '',
    confirmPass: ''
  });

  const handleManualLogin = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Ingrese un formato de correo válido.");
      return;
    }

    if ((email.toLowerCase() === 'admin@jmasociados.com' && pass === 'jm2026') || 
        (email.toLowerCase() === 'cliente@jmasociados.com' && pass === '123456')) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  const handleGoogleLogin = () => {
    alert("Iniciando conexión segura con Google API...");
    setTimeout(onLogin, 1500);
  };

  const handleBiometric = () => {
    setIsBiometricActive(true);
    setTimeout(() => {
      setIsBiometricActive(false);
      onLogin();
    }, 2000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.pass !== regData.confirmPass) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    alert("Perfil corporativo creado. Validando identidad...");
    setTimeout(onLogin, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[1200px] h-[1200px] bg-bordeaux-950 rounded-full blur-[200px] opacity-60 animate-pulse-slow"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[900px] h-[900px] bg-gold/5 rounded-full blur-[150px] opacity-30 animate-pulse-slow"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="flex justify-center mb-10 md:mb-16 animate-float">
          <div className="bg-white p-6 md:p-8 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(128,0,0,0.5)] border border-bordeaux-100 relative group overflow-hidden">
             <div className="absolute inset-0 gold-shine opacity-10"></div>
             <img src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" alt="Logo" className="h-20 md:h-28 w-auto relative z-10" />
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-[60px] rounded-[3.5rem] md:rounded-[5rem] p-8 md:p-20 shadow-[0_120px_250px_-60px_rgba(0,0,0,0.7)] border border-white/20 animate-slideUp overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 gold-shine opacity-40"></div>

          {view === 'login' && (
            <div className="space-y-10 md:space-y-14">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-bordeaux-50 rounded-full text-bordeaux-900 text-[10px] font-black uppercase tracking-[0.5em]">
                  <ShieldCheck size={14} className="text-gold" /> Cloud Security Elite
                </div>
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-bordeaux-950 tracking-tight">Acceso Privado</h1>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-all" size={22} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo Electrónico" className="w-full bg-gray-50 border-0 rounded-[2.5rem] pl-20 pr-8 py-7 font-bold outline-none focus:ring-4 focus:ring-bordeaux-50 transition-all shadow-inner" />
                </div>
                
                <div className="relative group">
                  <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-all" size={22} />
                  <input type={showPass ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Contraseña de Seguridad" className="w-full bg-gray-50 border-0 rounded-[2.5rem] pl-20 pr-16 py-7 font-bold outline-none focus:ring-4 focus:ring-bordeaux-50 transition-all shadow-inner" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300 hover:text-bordeaux-800 transition-colors">
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="flex justify-end px-6">
                  <button onClick={() => setView('forgot')} className="text-[10px] font-black text-bordeaux-800 uppercase tracking-widest hover:text-gold transition-colors">Olvidé mi contraseña</button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-5 bg-red-50 text-red-600 p-6 rounded-[2.5rem] animate-shake border border-red-100">
                  <AlertCircle size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Credenciales Inválidas</span>
                </div>
              )}

              <div className="space-y-6">
                <button onClick={handleManualLogin} disabled={isLoading} className="w-full bordeaux-gradient text-white py-7 rounded-[3rem] font-black text-xs uppercase tracking-[0.8em] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 relative group overflow-hidden">
                  <div className="absolute inset-0 gold-shine opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  {isLoading ? <RefreshCw className="animate-spin" /> : <>Ingresar <ArrowRight size={20} /></>}
                </button>

                <div className="relative flex items-center gap-6 py-4">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Otras opciones</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-4 p-5 bg-white border border-gray-100 rounded-[2.5rem] hover:shadow-xl transition-all font-bold text-sm text-gray-700">
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" /> Google
                  </button>
                  <button onClick={handleBiometric} className="flex items-center justify-center gap-4 p-5 bg-white border border-gray-100 rounded-[2.5rem] hover:shadow-xl transition-all font-bold text-sm text-gray-700">
                    <ScanFace size={20} className="text-bordeaux-800" /> Face ID
                  </button>
                </div>
              </div>

              <div className="text-center pt-10 border-t border-gray-50">
                <p className="text-sm text-gray-400 font-medium">¿Nuevo en JM? <button onClick={() => setView('register')} className="text-bordeaux-800 font-black uppercase tracking-widest ml-2 hover:text-gold transition-colors">Crear Cuenta</button></p>
              </div>
            </div>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-8 animate-fadeIn">
               <div className="flex items-center justify-between">
                <button type="button" onClick={() => setView('login')} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-bordeaux-800 transition-all"><ChevronLeft size={24} /></button>
                <div className="text-right">
                  <h2 className="text-2xl font-serif font-bold text-bordeaux-950">Nuevo Registro</h2>
                  <p className="text-[10px] font-black text-gold uppercase tracking-widest">Identidad Corporativa</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input required placeholder="Nombres" value={regData.nombre} onChange={e => setRegData({...regData, nombre: e.target.value})} className="bg-gray-50 border-0 rounded-2xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" />
                <input required placeholder="Apellidos" value={regData.apellido} onChange={e => setRegData({...regData, apellido: e.target.value})} className="bg-gray-50 border-0 rounded-2xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" />
                <input required type="email" placeholder="Email Corporativo" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="md:col-span-2 bg-gray-50 border-0 rounded-2xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" />
                <input required placeholder="CI / Documento" value={regData.ci} onChange={e => setRegData({...regData, ci: e.target.value})} className="bg-gray-50 border-0 rounded-2xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" />
                <input required placeholder="WhatsApp" value={regData.tel} onChange={e => setRegData({...regData, tel: e.target.value})} className="bg-gray-50 border-0 rounded-2xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" />
                <input required type="password" placeholder="Contraseña" value={regData.pass} onChange={e => setRegData({...regData, pass: e.target.value})} className="bg-gray-50 border-0 rounded-2xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" />
                <input required type="password" placeholder="Confirmar" value={regData.confirmPass} onChange={e => setRegData({...regData, confirmPass: e.target.value})} className="bg-gray-50 border-0 rounded-2xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" />
              </div>

              <button type="submit" className="w-full bordeaux-gradient text-white py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.6em] shadow-2xl hover:scale-[1.02] transition-all">Formalizar Registro</button>
            </form>
          )}

          {view === 'forgot' && (
            <div className="space-y-10 animate-fadeIn text-center py-10">
              <button onClick={() => setView('login')} className="absolute left-10 top-10 p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-bordeaux-800 transition-all"><ChevronLeft size={24} /></button>
              <div className="w-20 h-20 bg-bordeaux-50 rounded-[2rem] flex items-center justify-center mx-auto text-bordeaux-800 mb-8"><Lock size={36} /></div>
              <h2 className="text-3xl font-serif font-bold text-bordeaux-950">Recuperación</h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">Ingrese su email para recibir un enlace de restablecimiento de alta seguridad.</p>
              <input type="email" placeholder="Email registrado" className="w-full max-w-sm bg-gray-50 border-0 rounded-2xl px-8 py-6 font-bold outline-none focus:ring-2 focus:ring-bordeaux-800 text-center" />
              <button className="w-full max-w-sm bg-bordeaux-950 text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.5em] shadow-xl">Generar Ticket</button>
            </div>
          )}
        </div>
      </div>

      {isBiometricActive && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="flex flex-col items-center gap-10">
            <ScanFace size={100} className="text-white animate-pulse" />
            <p className="text-white font-black uppercase tracking-[0.8em] text-sm">Validando Rostro JM...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
