
import React, { useState } from 'react';
import { User } from '../types';
import { 
  Lock, Mail, RefreshCw, Eye, EyeOff, 
  Fingerprint, Smartphone, ChevronRight
} from 'lucide-react';

interface LoginProps {
  onLogin: (userData: User, remember: boolean) => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
  const [view, setView] = useState<'login' | 'authenticating'>('login');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ email: '', pass: '' });

  const handleManualLogin = async () => {
    setError(null);
    const email = loginData.email.toLowerCase().trim();
    const pin = loginData.pass.trim();

    // Credenciales de acceso maestro JM 2026
    if (email === 'admin@jmasociados.com' && pin === 'jm2026') {
      setView('authenticating');
      await new Promise(r => setTimeout(r, 1500));
      onLogin({
        name: "Guilherme Fazzi",
        email: email,
        picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        isAdmin: true
      }, true);
    } else {
      setError("ACCESO DENEGADO: Protocolo fallido.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] dark:bg-dark-base px-4 font-sans overflow-hidden">
      <div className="relative w-full max-w-[420px] animate-slideUp">
        <div className="bg-white dark:bg-dark-card rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-white/5 overflow-hidden">
          
          {/* Header Platinum: Bordeaux con Candado Dorado */}
          <div className="bordeaux-gradient pt-16 pb-12 px-10 text-center relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl">
                 <Lock size={32} className="text-gold" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-3xl font-robust text-white italic tracking-tighter leading-none uppercase">Acceso <span className="text-gold">JM</span></h1>
                <p className="text-[9px] font-black text-gold/60 uppercase tracking-[0.5em] mt-3 italic">Socio de Alta Gama</p>
              </div>
            </div>
          </div>

          <div className="p-10 md:p-12 space-y-8">
            {view === 'authenticating' ? (
              <div className="py-20 flex flex-col items-center space-y-6 text-center">
                 <RefreshCw className="text-bordeaux-800 animate-spin" size={64} strokeWidth={1} />
                 <p className="text-sm font-robust text-bordeaux-950 dark:text-white italic uppercase tracking-widest">Sincronizando Protocolo 2026...</p>
              </div>
            ) : (
              <>
                <div className="space-y-5">
                  <div className="relative group">
                    <input 
                      type="email" 
                      placeholder="Correo o Número de Teléfono" 
                      value={loginData.email} 
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})} 
                      className="w-full bg-gray-50 dark:bg-dark-base border-2 border-transparent rounded-[2rem] pl-16 pr-6 py-5 font-bold text-sm outline-none focus:border-gold/30 transition-all shadow-inner" 
                    />
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  </div>

                  <div className="relative group">
                    <input 
                      type={showPass ? "text" : "password"} 
                      placeholder="Contraseña" 
                      value={loginData.pass} 
                      onChange={(e) => setLoginData({...loginData, pass: e.target.value})} 
                      className="w-full bg-gray-50 dark:bg-dark-base border-2 border-transparent rounded-[2rem] pl-16 pr-16 py-5 font-bold text-sm outline-none focus:border-gold/30 transition-all shadow-inner" 
                    />
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <button className="w-full text-center text-[9px] font-black text-gray-400 uppercase tracking-widest pt-2">¿Olvidó su contraseña?</button>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl flex items-center gap-3 animate-slideUp">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{error}</p>
                  </div>
                )}

                <button 
                  onClick={handleManualLogin} 
                  className="group w-full bordeaux-gradient text-white py-6 rounded-full font-robust text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  Entrar <ChevronRight size={20} />
                </button>

                <div className="grid grid-cols-2 gap-4">
                   <button className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-dark-elevated border border-gray-100 dark:border-white/5 py-4 rounded-[2rem] hover:border-gold/30 transition-all group">
                      <Fingerprint size={22} className="text-gray-300 group-hover:text-gold transition-colors" />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Biometría</span>
                   </button>
                   <button className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-dark-elevated border border-gray-100 dark:border-white/5 py-4 rounded-[2rem] hover:border-gold/30 transition-all group">
                      <Smartphone size={22} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Google / Apple</span>
                   </button>
                </div>
              </>
            )}
          </div>
        </div>
        <p className="mt-10 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] italic">© 2026 JM Asociados Corporate</p>
      </div>
    </div>
  );
};

export default Login;
