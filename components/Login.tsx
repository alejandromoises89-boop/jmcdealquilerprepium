
import React, { useState } from 'react';
import { User } from '../types';
import { 
  ShieldCheck, ArrowRight, Lock, Mail, Apple, 
  AlertCircle, ScanFace, 
  ChevronLeft, RefreshCw, Eye, EyeOff, UserPlus, Fingerprint, MapPin, Smartphone, CreditCard
} from 'lucide-react';

interface LoginProps {
  onLogin: (userData: User) => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'recovery_sent'>('login');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBiometricActive, setIsBiometricActive] = useState(false);

  // Form States
  const [loginData, setLoginData] = useState({ email: '', pass: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    ci: '',
    phone: '',
    address: '',
    pass: '',
    confirmPass: ''
  });
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleManualLogin = () => {
    setError(null);
    
    if (!validateEmail(loginData.email)) {
      setError("Formato de correo electrónico inválido.");
      return;
    }

    if (loginData.pass.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (loginData.email.toLowerCase() === 'admin@jmasociados.com' && loginData.pass === 'jm2026') {
      onLogin({
        name: "Guilherme Fazzi",
        email: "guilherme@jmasociados.com",
        picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        isAdmin: true
      });
    } else if (loginData.email.toLowerCase() === 'cliente@jmasociados.com' && loginData.pass === '123456') {
      onLogin({
        name: "Cliente VIP",
        email: "cliente@vip.com",
        picture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        isAdmin: false
      });
    } else {
      setError("Credenciales inválidas. Por favor intente de nuevo.");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(registerData.email)) {
      setError("Formato de correo electrónico inválido.");
      return;
    }

    if (registerData.pass.length < 6) {
      setError("La contraseña debe ser más robusta (mín. 6 carac.).");
      return;
    }

    if (registerData.pass !== registerData.confirmPass) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    
    onLogin({
      name: registerData.name,
      email: registerData.email,
      picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
      isAdmin: false
    });
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(recoveryEmail)) {
      setError("Email inválido para recuperación.");
      return;
    }
    setView('recovery_sent');
  };

  const handleBiometric = () => {
    setIsBiometricActive(true);
    setTimeout(() => {
      setIsBiometricActive(false);
      onLogin({
        name: "Guilherme Fazzi",
        email: "guilherme@jmasociados.com",
        picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        isAdmin: true
      });
    }, 2500);
  };

  const handleGoogleLogin = () => {
    onLogin({
      name: "Usuario Google VIP",
      email: "google@user.com",
      picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
      isAdmin: false
    });
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

        <div className="bg-white/95 backdrop-blur-[60px] rounded-[3.5rem] md:rounded-[5rem] p-8 md:p-14 lg:p-20 shadow-[0_120px_250px_-60px_rgba(0,0,0,0.7)] border border-white/20 animate-slideUp overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 gold-shine opacity-40"></div>

          {view === 'login' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-bordeaux-50 rounded-full text-bordeaux-900 text-[10px] font-black uppercase tracking-[0.5em]">
                  <ShieldCheck size={14} className="text-gold" /> Cloud Security Elite
                </div>
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-bordeaux-950 tracking-tight">Acceso Privado</h1>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-all" size={22} />
                  <input 
                    type="email" 
                    value={loginData.email} 
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    placeholder="Correo Electrónico" 
                    className="w-full bg-gray-50 border-0 rounded-[2.5rem] pl-20 pr-8 py-7 font-bold outline-none focus:ring-4 focus:ring-bordeaux-50 transition-all shadow-inner" 
                  />
                </div>
                
                <div className="relative group">
                  <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-all" size={22} />
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={loginData.pass} 
                    onChange={(e) => setLoginData({...loginData, pass: e.target.value})}
                    placeholder="Contraseña" 
                    className="w-full bg-gray-50 border-0 rounded-[2.5rem] pl-20 pr-16 py-7 font-bold outline-none focus:ring-4 focus:ring-bordeaux-50 transition-all shadow-inner" 
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300 hover:text-bordeaux-800 transition-colors">
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <button 
                  onClick={() => setView('forgot')}
                  className="text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-bordeaux-800 transition-colors ml-4"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-5 bg-red-50 text-red-600 p-6 rounded-[2.5rem] animate-shake border border-red-100">
                  <AlertCircle size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                </div>
              )}

              <div className="space-y-6">
                <button onClick={handleManualLogin} disabled={isLoading} className="w-full bordeaux-gradient text-white py-7 rounded-[3rem] font-black text-xs uppercase tracking-[0.8em] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 relative group overflow-hidden">
                  <div className="absolute inset-0 gold-shine opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  {isLoading ? <RefreshCw className="animate-spin" /> : <>Ingresar <ArrowRight size={20} /></>}
                </button>

                <div className="relative flex items-center gap-6 py-4">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">O</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-4 p-5 bg-white border border-gray-100 rounded-[2.5rem] hover:shadow-xl transition-all font-bold text-sm text-gray-700">
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" /> Google
                  </button>
                  <button onClick={handleBiometric} className="flex items-center justify-center gap-4 p-5 bg-white border border-gray-100 rounded-[2.5rem] hover:shadow-xl transition-all font-bold text-sm text-gray-700">
                    <Fingerprint size={20} className="text-bordeaux-800" /> Biometría
                  </button>
                </div>

                <div className="text-center pt-6">
                  <button 
                    onClick={() => setView('register')}
                    className="text-[11px] font-black text-gold uppercase tracking-[0.3em] hover:text-bordeaux-800 transition-all flex items-center justify-center gap-3 mx-auto"
                  >
                    ¿No tiene cuenta? <span className="bg-bordeaux-50 px-4 py-2 rounded-full border border-bordeaux-100">Registrarse Aquí</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className="space-y-8 animate-fadeIn">
               <button onClick={() => setView('login')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-bordeaux-800 transition-all">
                  <ChevronLeft size={16} /> Volver al Login
               </button>
               
               <div className="space-y-2">
                  <h2 className="text-3xl font-serif font-bold text-bordeaux-950">Registro de Cliente VIP</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Suministre sus datos para validación de perfil</p>
               </div>

               <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                       <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                       <input 
                        required
                        type="text" 
                        placeholder="Nombre Completo" 
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        className="w-full bg-gray-50 border-0 rounded-2xl pl-16 pr-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" 
                       />
                    </div>
                    <div className="relative group">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                       <input 
                        required
                        type="email" 
                        placeholder="Correo Electrónico" 
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        className="w-full bg-gray-50 border-0 rounded-2xl pl-16 pr-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" 
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                       <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                       <input 
                        required
                        type="text" 
                        placeholder="Cédula / RG / Pasaporte" 
                        value={registerData.ci}
                        onChange={(e) => setRegisterData({...registerData, ci: e.target.value})}
                        className="w-full bg-gray-50 border-0 rounded-2xl pl-16 pr-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" 
                       />
                    </div>
                    <div className="relative group">
                       <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                       <input 
                        required
                        type="tel" 
                        placeholder="WhatsApp / Teléfono" 
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        className="w-full bg-gray-50 border-0 rounded-2xl pl-16 pr-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" 
                       />
                    </div>
                  </div>

                  <div className="relative group">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="Dirección Residencial" 
                      value={registerData.address}
                      onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-2xl pl-16 pr-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      required
                      type="password" 
                      placeholder="Contraseña" 
                      value={registerData.pass}
                      onChange={(e) => setRegisterData({...registerData, pass: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" 
                    />
                    <input 
                      required
                      type="password" 
                      placeholder="Confirmar Contraseña" 
                      value={registerData.confirmPass}
                      onChange={(e) => setRegisterData({...registerData, confirmPass: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-5 font-bold text-sm outline-none focus:ring-2 focus:ring-bordeaux-800" 
                    />
                  </div>

                  {error && <p className="text-red-600 text-[10px] font-black uppercase text-center">{error}</p>}

                  <button type="submit" className="w-full bordeaux-gradient text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.5em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                    Crear Cuenta VIP
                  </button>
               </form>
            </div>
          )}

          {view === 'forgot' && (
            <div className="space-y-10 animate-fadeIn text-center">
               <button onClick={() => setView('login')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-bordeaux-800 transition-all mx-auto">
                  <ChevronLeft size={16} /> Volver al Login
               </button>

               <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto text-gold mb-6 shadow-inner">
                  <Lock size={32} />
               </div>

               <div className="space-y-3">
                  <h2 className="text-3xl font-serif font-bold text-bordeaux-950">Recuperar Cuenta</h2>
                  <p className="text-sm text-gray-500 font-medium">Le enviaremos un código de seguridad para reestablecer su acceso premium.</p>
               </div>

               <form onSubmit={handleRecovery} className="space-y-6">
                  <div className="relative group max-w-md mx-auto">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input 
                      required
                      type="email" 
                      placeholder="Su Correo Registrado" 
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full bg-gray-50 border-0 rounded-3xl pl-16 pr-6 py-6 font-bold outline-none focus:ring-4 focus:ring-bordeaux-50" 
                    />
                  </div>

                  <button type="submit" className="w-full bordeaux-gradient text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.5em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all max-w-md mx-auto flex items-center justify-center gap-4">
                    Enviar Código <ArrowRight size={18} />
                  </button>
               </form>
            </div>
          )}

          {view === 'recovery_sent' && (
            <div className="space-y-10 animate-scaleIn text-center py-10">
               <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6 shadow-xl border-4 border-white">
                  <ShieldCheck size={48} />
               </div>
               <div className="space-y-4">
                  <h2 className="text-3xl font-serif font-bold text-bordeaux-950">Correo Enviado</h2>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
                    Hemos enviado instrucciones detalladas a <b>{recoveryEmail}</b> para que pueda recuperar su clave de forma segura.
                  </p>
               </div>
               <button 
                onClick={() => setView('login')}
                className="px-10 py-5 bg-bordeaux-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gold transition-all"
               >
                 Entendido, Ir al Login
               </button>
            </div>
          )}
        </div>
      </div>

      {isBiometricActive && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="flex flex-col items-center gap-12 text-center p-10">
            <div className="relative">
               <ScanFace size={140} className="text-white animate-pulse" />
               <div className="absolute inset-0 border-4 border-gold/30 rounded-full animate-ping"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[140px] h-1 bg-gold/50 absolute animate-scan-line"></div>
               </div>
            </div>
            <div className="space-y-4">
               <p className="text-white font-black uppercase tracking-[1em] text-sm animate-pulse">Escaneando...</p>
               <p className="text-gold/60 text-[10px] font-bold uppercase tracking-[0.4em]">Protocolo de Identidad JM Asociados</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default Login;
