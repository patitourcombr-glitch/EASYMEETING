
import React, { useState, useRef, useEffect } from 'react';
import { Video, StopCircle, Mic, Monitor, Headphones, Zap, ShieldCheck } from 'lucide-react';

interface RecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

type RecordMode = 'full' | 'audio' | 'mic';

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordMode, setRecordMode] = useState<RecordMode>('full');
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      
      let combinedStream: MediaStream;
      let mimeType: string;

      if (recordMode === 'mic') {
        // Modo Voz (Celular): Apenas Microfone
        combinedStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mimeType = 'audio/webm;codecs=opus';
      } else {
        // Captura a tela/aba (necessário para o áudio do sistema/reunião)
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Captura o microfone do usuário
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        
        let tracks: MediaStreamTrack[] = [];
        
        if (recordMode === 'full') {
          // Modo Completo: Vídeo + Áudio do sistema + Microfone
          tracks = [...displayStream.getTracks()];
          if (micStream) {
            tracks.push(...micStream.getAudioTracks());
          }
          mimeType = 'video/webm;codecs=vp8,opus';
        } else {
          // Modo Inteligente: Apenas Áudio (Sistema + Microfone)
          displayStream.getVideoTracks().forEach(t => t.stop());
          tracks = [...displayStream.getAudioTracks()];
          if (micStream) {
            tracks.push(...micStream.getAudioTracks());
          }
          mimeType = 'audio/webm;codecs=opus';
        }
        combinedStream = new MediaStream(tracks);
      }

      const recorder = new MediaRecorder(combinedStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalMimeType = recordMode === 'full' ? 'video/webm' : 'audio/webm';
        const fullBlob = new Blob(chunksRef.current, { type: finalMimeType });
        
        onRecordingComplete(fullBlob, duration);
        
        // Limpeza de tracks
        combinedStream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      alert("Permissão necessária para capturar áudio ou tela.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#112936]/90 backdrop-blur-2xl p-10 rounded-[48px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col items-center gap-8 max-w-xl w-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green via-brand-blue to-brand-green opacity-30" />
      
      <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center relative">
        {isRecording ? (
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse" />
            <StopCircle className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
        ) : (
          recordMode === 'full' ? 
            <Video className="w-12 h-12 text-brand-blue" /> : 
            recordMode === 'audio' ?
            <Headphones className="w-12 h-12 text-brand-green" /> :
            <Mic className="w-12 h-12 text-brand-blue" />
        )}
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-black text-white mb-3 italic tracking-tight">
          {isRecording ? 'GRAVANDO AGORA' : 'MODO DE CAPTURA'}
        </h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
          {isRecording 
            ? `Sua reunião está sendo processada no modo ${recordMode === 'full' ? 'Completo' : 'Inteligente'}.` 
            : 'Escolha como deseja salvar sua reunião para otimizar espaço e performance.'}
        </p>
      </div>

      {!isRecording && (
        <div className="grid grid-cols-3 gap-3 w-full">
          <button 
            onClick={() => setRecordMode('full')}
            className={`p-4 rounded-[24px] border transition-all flex flex-col items-center gap-2 group ${recordMode === 'full' ? 'bg-brand-blue/10 border-brand-blue shadow-lg shadow-brand-blue/10' : 'bg-white/5 border-white/10 opacity-40 hover:opacity-100'}`}
          >
            <Video className={`w-5 h-5 ${recordMode === 'full' ? 'text-brand-blue' : 'text-gray-400'}`} />
            <div className="text-center">
              <p className="text-[8px] font-black uppercase tracking-widest text-white">Vídeo</p>
              <p className="text-[7px] text-gray-500 mt-1 uppercase">Desktop</p>
            </div>
          </button>

          <button 
            onClick={() => setRecordMode('audio')}
            className={`p-4 rounded-[24px] border transition-all flex flex-col items-center gap-2 group ${recordMode === 'audio' ? 'bg-brand-green/10 border-brand-green shadow-lg shadow-brand-green/10' : 'bg-white/5 border-white/10 opacity-40 hover:opacity-100'}`}
          >
            <div className="relative">
              <Headphones className={`w-5 h-5 ${recordMode === 'audio' ? 'text-brand-green' : 'text-gray-400'}`} />
              <Zap className="absolute -top-1 -right-1 w-2 h-2 text-brand-green fill-brand-green animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black uppercase tracking-widest text-white">Áudio</p>
              <p className="text-[7px] text-gray-500 mt-1 uppercase">Desktop</p>
            </div>
          </button>

          <button 
            onClick={() => setRecordMode('mic')}
            className={`p-4 rounded-[24px] border transition-all flex flex-col items-center gap-2 group ${recordMode === 'mic' ? 'bg-brand-blue/10 border-brand-blue shadow-lg shadow-brand-blue/10' : 'bg-white/5 border-white/10 opacity-40 hover:opacity-100'}`}
          >
            <Mic className={`w-5 h-5 ${recordMode === 'mic' ? 'text-brand-blue' : 'text-gray-400'}`} />
            <div className="text-center">
              <p className="text-[8px] font-black uppercase tracking-widest text-white">Voz</p>
              <p className="text-[7px] text-gray-500 mt-1 uppercase">Celular</p>
            </div>
          </button>
        </div>
      )}

      {isRecording && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl font-black text-white tracking-tighter tabular-nums flex items-baseline gap-2">
            {formatTime(duration)}
            <span className="text-xs text-brand-blue animate-pulse font-bold tracking-[0.3em]">REC</span>
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
            <Mic className="w-3 h-3 text-brand-green" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Áudio capturado em tempo real</span>
          </div>
        </div>
      )}

      <div className="flex gap-4 w-full">
        {!isRecording ? (
          <>
            <button 
              onClick={startRecording}
              className={`flex-1 ${recordMode === 'full' ? 'bg-brand-blue' : 'bg-brand-green'} text-brand-bg font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs`}
            >
              <Monitor className="w-5 h-5" /> Iniciar Gravação
            </button>
            <button 
              onClick={onCancel}
              className="px-8 border border-white/10 hover:bg-white/5 rounded-3xl transition-colors font-bold text-xs uppercase text-gray-500 hover:text-white"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button 
            onClick={stopRecording}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
          >
            <StopCircle className="w-5 h-5" /> Parar e Processar
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-[8px] text-gray-600 uppercase tracking-widest mt-2">
        <ShieldCheck className="w-3 h-3" /> 
        Consentimento obrigatório por lei
      </div>
    </div>
  );
};

export default Recorder;
