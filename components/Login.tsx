
import React, { useState } from 'react';
import { Loader2, ShieldCheck, Key, ExternalLink, HelpCircle, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Footer from './Footer';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('easy_api_key') || '');
  const [error, setError] = useState<string | null>(null);

  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      // Realizamos uma chamada mínima para testar a validade da chave
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'ping',
      });
      return true;
    } catch (err: any) {
      console.error("Erro na validação da chave:", err);
      return false;
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError("Por favor, insira sua chave API.");
      return;
    }

    setIsVerifying(true);
    
    const isValid = await validateApiKey(trimmedKey);

    if (isValid) {
      localStorage.setItem('easy_api_key', trimmedKey);
      setIsVerifying(false);
      onLogin();
    } else {
      setIsVerifying(false);
      setError("Chave API inválida ou sem permissão. Verifique os dados e tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A1E29] relative overflow-hidden font-sans selection:bg-[#00CFFF]/30">
      {/* Background Glow */}
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#00CFFF]/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="flex flex-col items-center text-center max-w-sm w-full animate-in fade-in zoom-in-95 duration-1000">
          
          {/* Novo Ícone do Topo (Imagem solicitada) */}
          <div className="mb-6 animate-float">
            <img 
              src="https://i.ibb.co/SXnGVRYq/patitour-2026-01-29-T084412-065.png" 
              alt="EASY Logo Icon" 
              className="w-24 h-auto object-contain opacity-100 drop-shadow-[0_0_20px_rgba(0,230,168,0.3)]"
            />
          </div>

          <div className="mb-2">
            <h1 className="text-6xl font-black tracking-tighter leading-none flex flex-col italic">
              <span className="text-white drop-shadow-md">EASY</span>
              <span className="bg-gradient-to-r from-[#00E6A8] to-[#00CFFF] bg-clip-text text-transparent drop-shadow-sm">
                MEETING
              </span>
            </h1>
          </div>
          
          <p className="text-[#00CFFF]/60 text-[10px] uppercase tracking-[0.4em] font-bold mb-12">
            STUDIO INTELIGENTE DE REUNIÕES
          </p>

          {/* Card Principal */}
          <div className="w-full bg-[#112936]/60 border border-white/5 rounded-[48px] p-8 md:p-10 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[48px] pointer-events-none" />
            
            <form onSubmit={handleLogin} className="relative z-10 space-y-6">
              <div>
                <h2 className="text-brand-green text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  CHAVE DE ACESSO (GEMINI API)
                </h2>
                
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2">
                    <Key className={`w-4 h-4 transition-colors ${apiKey ? 'text-brand-green' : 'text-gray-500'}`} />
                  </div>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Cole sua chave aqui..."
                    className={`w-full bg-black/40 border rounded-3xl py-4 px-12 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:bg-black/60 transition-all ${error ? 'border-red-500/50' : 'border-white/10 focus:border-brand-blue/50'}`}
                  />
                </div>
                {error && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-[10px] font-bold bg-red-500/10 p-2 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={isVerifying || !apiKey.trim()}
                className="w-full bg-brand-green hover:bg-[#00FFBA] disabled:bg-brand-green/20 disabled:text-[#0A1E29]/40 text-[#0A1E29] font-black py-5 px-8 rounded-3xl text-sm tracking-[0.1em] transition-all shadow-[0_15px_40px_rgba(0,230,168,0.25)] active:scale-95 uppercase flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>VERIFICANDO CHAVE...</span>
                  </>
                ) : (
                  "ENTRAR NO PORTAL"
                )}
              </button>
            </form>
          </div>

          {/* Sub Card */}
          <div className="w-full bg-[#112936]/40 border border-white/5 rounded-[32px] p-8 space-y-6">
            <p className="text-gray-400 text-[11px] leading-relaxed">
              O acesso exige a chave de API para desbloquear a <br/>
              <span className="text-brand-green font-bold uppercase">Inteligência Artificial</span>, garantindo resumos ilimitados sem custos extras.
            </p>

            <div className="pt-2">
              <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Ainda não tem uma chave?</p>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-white/10 rounded-2xl text-[10px] font-black text-brand-blue uppercase tracking-widest hover:bg-brand-blue/5 transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                Obter minha chave gratuita <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest opacity-60">
            <ShieldCheck className="w-3 h-3 text-brand-green" /> 
            Privacidade 100% Local
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
