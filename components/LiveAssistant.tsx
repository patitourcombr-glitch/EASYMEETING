
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Mic, MicOff, MessageSquare } from 'lucide-react';
import { getLiveStrategy } from '../services/geminiService';

interface LiveAssistantProps {
  isRecording: boolean;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ isRecording }) => {
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState<{q: string, a: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [responses, transcript]);

  // Configuração da Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + ' ' + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Inicia/Para a escuta baseado no estado de gravação do app
  useEffect(() => {
    if (isRecording && recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Erro ao iniciar reconhecimento:", e);
      }
    } else if (!isRecording && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isRecording]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userQ = prompt;
    setPrompt('');
    setLoading(true);

    try {
      const currentContext = transcript.slice(-1000); // Pega os últimos 1000 caracteres para contexto
      const answer = await getLiveStrategy(currentContext, userQ);
      setResponses(prev => [...prev, { q: userQ, a: answer || 'Não consegui gerar uma estratégia agora.' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-bg/90 backdrop-blur-xl border-l border-white/10 w-85 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand-green w-5 h-5" />
          <h2 className="font-bold text-brand-white text-sm uppercase tracking-wider">Estrategista</h2>
        </div>
        <button 
          onClick={toggleListening}
          className={`p-2 rounded-full transition-all ${isListening ? 'bg-brand-green/20 text-brand-green' : 'bg-white/5 text-gray-500'}`}
          title={isListening ? "Ouvindo reunião..." : "Ativar microfone para contexto"}
        >
          {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Visualizador de Transcrição em Tempo Real */}
        {isListening && (
          <div className="p-3 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl mb-4">
            <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest block mb-1">Transcrição ao vivo</span>
            <p className="text-[11px] text-gray-400 line-clamp-3 italic">
              {transcript || "Aguardando áudio..."}
            </p>
          </div>
        )}

        {responses.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-40">
            <MessageSquare className="w-8 h-8 text-gray-600" />
            <p className="text-xs text-gray-500 px-6">
              A IA está ouvindo a reunião. Pergunte como lidar com objeções ou peça insights agora.
            </p>
          </div>
        )}

        {responses.map((item, idx) => (
          <div key={idx} className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white/5 p-3 rounded-2xl rounded-tr-none text-xs text-brand-blue border border-white/5 self-end ml-8">
              <span className="font-black uppercase opacity-60 block mb-1 text-[8px]">Você</span>
              {item.q}
            </div>
            <div className="bg-brand-green/10 p-4 rounded-2xl rounded-tl-none text-sm text-brand-white border border-brand-green/20 mr-8">
              <span className="font-black uppercase text-brand-green block mb-1 text-[9px] tracking-widest">Sugestão IA</span>
              {item.a}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex items-center gap-2 text-[10px] text-brand-green font-bold uppercase tracking-widest animate-pulse ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Pensando...
          </div>
        )}
      </div>

      <form onSubmit={handleAsk} className="p-4 border-t border-white/10 bg-black/40">
        <div className="relative group">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Peça uma estratégia..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 pr-12 text-sm focus:outline-none focus:border-brand-blue group-hover:bg-white/10 transition-all"
          />
          <button 
            type="submit"
            disabled={!prompt.trim() || loading}
            className="absolute right-2 top-1.5 bg-brand-blue text-brand-bg p-2 rounded-xl hover:bg-white transition-all disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[8px] text-gray-600 mt-2 text-center uppercase tracking-tighter">
          Pressione Enter para enviar para a Inteligência
        </p>
      </form>
    </div>
  );
};

export default LiveAssistant;
