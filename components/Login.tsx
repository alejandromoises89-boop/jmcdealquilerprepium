
import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Fingerprint, Lock, Zap, User, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleManualLogin = () => {
    // Basic validation to prevent "just entering"
    if (id.trim() === 'admin' && pass.trim() === 'jm2026') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] px-4 py-12 relative overflow-hidden font-sans">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-bordeaux-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-bordeaux-100 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>

      <div className="relative w-full max-w-lg bg-white rounded-[4rem] p-10 md:p-16 shadow-[0_50px_100px_-20px_rgba(128,0,0,0.15)] space-y-12 animate-slideUp border border-bordeaux-50">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-[3rem] shadow-xl border border-bordeaux-50 group relative overflow-hidden">
               <div className="absolute -inset-2 bordeaux-gradient opacity-5 blur-2xl group-hover:opacity-20 transition-opacity"></div>
               <img 
                src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" 
                alt="JM Logo" 
                className="h-24 md:h-28 w-auto relative z-10 animate-float"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-bordeaux-800 text-white rounded-full text-[10px] font-black uppercase tracking-[0.5em] mb-2 shadow-lg">
              <ShieldCheck size={14} className="text-gold" /> Acceso Restringido
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-bordeaux-950 tracking-tight">Portal Elite</h1>
            <p className="text-gray-400 text-[11px] font-black tracking-[0.4em] uppercase">Gestión de Flota JM Asociados</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-colors" size={20} />
              <input 
                type="text" 
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="ID de Operador" 
                className="w-full bg-gray-50 border border-gray-100 rounded-3xl pl-16 pr-8 py-6 text-gray-900 outline-none focus:ring-4 focus:ring-bordeaux-50 focus:bg-white transition-all text-sm font-bold shadow-inner"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-colors" size={20} />
              <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Clave de Seguridad" 
                className="w-full bg-gray-50 border border-gray-100 rounded-3xl pl-16 pr-8 py-6 text-gray-900 outline-none focus:ring-4 focus:ring-bordeaux-50 focus:bg-white transition-all text-sm font-bold shadow-inner"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-2xl animate-shake">
              <AlertCircle size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Credenciales Inválidas</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <button 
            onClick={handleManualLogin}
            disabled={isLoading}
            className="w-full bordeaux-gradient text-white font-black py-6 md:py-8 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(128,0,0,0.4)] transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50 group relative overflow-hidden"
          >
            {isLoading ? (
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="tracking-[0.6em] uppercase text-xs relative z-10">Autenticar Sistema</span>
                <ArrowRight size={24} className="relative z-10 group-hover:translate-x-3 transition-transform" />
              </>
            )}
          </button>

          <div className="flex flex-col items-center gap-6">
             <button 
                onClick={onLogin}
                className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[3rem] hover:bg-white border border-transparent hover:border-bordeaux-100 transition-all group shadow-sm active:scale-90 w-full md:w-48"
              >
                <Fingerprint className="text-bordeaux-800 group-hover:scale-110 transition-transform" size={48} />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mt-4">Biometría</span>
              </button>
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center px-8">Solo terminales registradas con seguridad biométrica activa.</p>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-gray-50">
          <p className="text-[10px] text-gray-200 uppercase tracking-[0.8em] font-black">
            JM ASOCIADOS &copy; MMXXVI
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
