
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  Search, 
  User, 
  Play, 
  Download, 
  MessageSquare,
  Sparkles,
  ArrowLeft,
  FileText,
  Video,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Power,
  HelpCircle,
  Trash2,
  Share2,
  Mail,
  MessageCircle,
  X as CloseIcon,
  AlignLeft,
  Zap,
  Check,
  UserCircle,
  Send,
  ClipboardCheck,
  FileJson,
  Loader2,
  Headphones,
  Activity
} from 'lucide-react';
import { AppView, Meeting, ChatMessage, CalendarEvent } from './types';
import Recorder from './components/Recorder';
import Footer from './components/Footer';
import Login from './components/Login';
import LiveAssistant from './components/LiveAssistant';
import Onboarding from './components/Onboarding';
import { summarizeMeetingFromAudio, chatWithMeeting } from './services/geminiService';
import { 
  saveVideo, 
  getVideo, 
  deleteVideo, 
  saveChat, 
  getChat, 
  deleteChat,
  saveMeetingMetadata,
  getAllMeetings,
  deleteMeetingMetadata
} from './services/dbService';
import { initGoogleAuth, getAccessToken, fetchUpcomingEvents, extractMeetingLink } from './services/calendarService';

const App: React.FC = () => {
  // Restore initial state to LOGIN view as requested
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [isVideoMimeType, setIsVideoMimeType] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailNotice, setShowEmailNotice] = useState(false);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isRecordingNow, setIsRecordingNow] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const onboardingHidden = localStorage.getItem('easy_onboarding_hidden');
    return onboardingHidden !== 'true';
  });
  const [googleToken, setGoogleToken] = useState<string | null>(localStorage.getItem('easy_google_token'));
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Estados para as Abas e Busca
  const [activeDetailTab, setActiveDetailTab] = useState<'video' | 'transcript' | 'chat'>('video');
  const [transcriptSearch, setTranscriptSearch] = useState('');

  // Estados para o Menu de Compartilhamento
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [meetingToShare, setMeetingToShare] = useState<Meeting | null>(null);

  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const cloudMeetings = await getAllMeetings();
        if (cloudMeetings.length > 0) {
          setMeetings(cloudMeetings);
        } else {
          const savedMeetings = localStorage.getItem('easy_meetings');
          if (savedMeetings) setMeetings(JSON.parse(savedMeetings));
        }
      } catch (err) {
        const savedMeetings = localStorage.getItem('easy_meetings');
        if (savedMeetings) setMeetings(JSON.parse(savedMeetings));
      }
    };
    
    loadInitialData();
    initGoogleAuth();
    
    // Auto-login if key exists
    if (localStorage.getItem('easy_api_key')) {
      setView(AppView.DASHBOARD);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (selectedVideoUrl) URL.revokeObjectURL(selectedVideoUrl);
    };
  }, [selectedVideoUrl]);

  const loadCalendarEvents = async () => {
    if (!googleToken) return;
    setIsLoadingCalendar(true);
    try {
      const events = await fetchUpcomingEvents(googleToken);
      setCalendarEvents(events);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setGoogleToken(null);
      localStorage.removeItem('easy_google_token');
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  useEffect(() => {
    if (googleToken && view === AppView.CALENDAR) {
      loadCalendarEvents();
    }
  }, [googleToken, view]);

  const saveMeetingMetadataList = async (updatedList: Meeting[], newMeeting?: Meeting) => {
    setMeetings(updatedList);
    localStorage.setItem('easy_meetings', JSON.stringify(updatedList));
    
    // Sincroniza com Firebase
    if (newMeeting) {
      await saveMeetingMetadata(newMeeting);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    setIsProcessing(true);
    setIsRecordingNow(false);
    setView(AppView.DASHBOARD);

    const meetingId = Date.now().toString();
    
    try {
      const videoUrl = await saveVideo(meetingId, blob);
      const base64Data = await blobToBase64(blob);
      const aiData = await summarizeMeetingFromAudio(base64Data, blob.type);
      
      const newMeeting: Meeting = {
        id: meetingId,
        title: `Reunião ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
        date: new Date().toLocaleDateString(),
        duration: `${Math.floor(duration/60)}m ${duration%60}s`,
        videoUrl,
        summary: aiData.summary,
        bullets: aiData.bullets,
        completedBullets: [],
        transcript: aiData.transcript || ""
      };

      saveMeetingMetadataList([newMeeting, ...meetings], newMeeting);
      setShowEmailNotice(true);
      setTimeout(() => setShowEmailNotice(false), 5000);

    } catch (err) {
      console.error("Erro ao processar reunião:", err);
      alert("Erro ao processar a reunião com a IA.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMeeting = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta gravação permanentemente?")) return;

    try {
      await deleteVideo(id);
      await deleteChat(id);
      await deleteMeetingMetadata(id);
      const updated = meetings.filter(m => m.id !== id);
      saveMeetingMetadataList(updated);
    } catch (err) {
      console.error("Erro ao excluir reunião:", err);
    }
  };

  const handleOpenShareMenu = (m: Meeting) => {
    setMeetingToShare(m);
    setIsShareModalOpen(true);
  };

  const executeShare = async (type: 'whatsapp' | 'gmail' | 'email' | 'native') => {
    if (!meetingToShare) return;
    const shareText = `*RELATÓRIO DE REUNIÃO - EASY MEETING*\n\n` +
      `📌 *Título:* ${meetingToShare.title}\n` +
      `📅 *Data:* ${meetingToShare.date} | ⏱ *Duração:* ${meetingToShare.duration}\n\n` +
      (meetingToShare.videoUrl ? `🔗 *Link da Gravação:* ${meetingToShare.videoUrl}\n\n` : '') +
      `📝 *RESUMO EXECUTIVO:*\n${meetingToShare.summary}\n\n` +
      `✅ *PONTOS DE DECISÃO:*\n${meetingToShare.bullets.map((b, i) => {
        const isChecked = meetingToShare.completedBullets?.includes(i);
        return `${isChecked ? ' [CONCLUÍDO] ' : ' • '}${b}`;
      }).join('\n')}\n\n` +
      `_Enviado via Easy Meeting AI Assistant_`;
    const encodedText = encodeURIComponent(shareText);
    const encodedSubject = encodeURIComponent(`Relatório: ${meetingToShare.title}`);
    switch (type) {
      case 'whatsapp': window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank'); break;
      case 'gmail': window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedText}`, '_blank'); break;
      case 'email': window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedText}`; break;
      case 'native':
        if (navigator.share) {
          try {
            const videoUrl = await getVideo(meetingToShare.id);
            const filesToShare: File[] = [];
            if (videoUrl) {
              const response = await fetch(videoUrl);
              const videoBlob = await response.blob();
              const extension = videoBlob.type.includes('video') ? 'webm' : 'weba';
              filesToShare.push(new File([videoBlob], `${meetingToShare.title.replace(/\s+/g, '_')}.${extension}`, { type: videoBlob.type }));
            }
            await navigator.share({ title: meetingToShare.title, text: shareText, ...(filesToShare.length ? { files: filesToShare } : {}) });
          } catch (err) { console.error(err); }
        } else {
          await navigator.clipboard.writeText(shareText);
          alert("Resumo copiado!");
        }
        break;
    }
    setIsShareModalOpen(false);
  };

  const handleSelectMeeting = async (m: Meeting) => {
    setSelectedMeeting(m);
    setView(AppView.MEETING_DETAILS);
    setActiveDetailTab('video');
    try {
      const savedChat = await getChat(m.id);
      setChatHistory(savedChat || []);
    } catch (err) {
      setChatHistory([]);
    }
    try {
      const videoUrl = await getVideo(m.id);
      if (videoUrl) {
        // No Firebase, o vídeo é uma URL direta
        setIsVideoMimeType(true); // Assume video ou checa via metadados se necessário
        setSelectedVideoUrl(videoUrl);
      } else {
        setSelectedVideoUrl(null);
      }
    } catch (err) {
      setSelectedVideoUrl(null);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msgText = customMsg || chatInput;
    if (!msgText.trim() || !selectedMeeting || isAiTyping) return;

    const userMsg: ChatMessage = { role: 'user', content: msgText, timestamp: new Date().toLocaleTimeString() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput('');
    setIsAiTyping(true);
    await saveChat(selectedMeeting.id, newHistory);

    try {
      const context = `Título: ${selectedMeeting.title}. Sumário: ${selectedMeeting.summary}. Detalhes: ${selectedMeeting.bullets.join('. ')}. Transcrição parcial: ${selectedMeeting.transcript?.slice(0, 1000)}`;
      const aiResponse = await chatWithMeeting(context, userMsg.content);
      const assistantMsg: ChatMessage = { role: 'assistant', content: aiResponse || "Não consegui processar sua dúvida no momento.", timestamp: new Date().toLocaleTimeString() };
      const finalHistory = [...newHistory, assistantMsg];
      setChatHistory(finalHistory);
      await saveChat(selectedMeeting.id, finalHistory);
    } catch (err) { 
      console.error(err);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleQuickAction = (type: 'email' | 'plan' | 'objections') => {
    if (!selectedMeeting) return;
    setActiveDetailTab('chat');
    
    let promptText = "";
    switch (type) {
      case 'email':
        promptText = "Escreva um rascunho de e-mail de follow-up profissional para enviar aos participantes desta reunião. Inclua os principais pontos discutidos e os próximos passos de forma clara e cordial.";
        break;
      case 'plan':
        promptText = "Crie um plano de execução (Action Plan) detalhado baseado nas decisões desta reunião. Separe por tarefas, sugerindo prioridade e quem poderia ser o responsável com base no contexto.";
        break;
      case 'objections':
        promptText = "Identifique possíveis objeções que um cliente ou stakeholder poderia ter com base no que foi discutido e sugira como a nossa equipe pode rebater esses pontos estrategicamente.";
        break;
    }
    
    handleSendMessage(undefined, promptText);
  };

  const toggleBullet = (index: number) => {
    if (!selectedMeeting) return;
    
    const currentCompleted = selectedMeeting.completedBullets || [];
    const isCompleted = currentCompleted.includes(index);
    
    const newCompleted = isCompleted 
      ? currentCompleted.filter(i => i !== index)
      : [...currentCompleted, index];
      
    const updatedMeeting = { ...selectedMeeting, completedBullets: newCompleted };
    setSelectedMeeting(updatedMeeting);
    
    // Atualiza na lista geral e localStorage
    const updatedMeetings = meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m);
    saveMeetingMetadataList(updatedMeetings);
  };

  const seekToTime = (timestampStr: string) => {
    setActiveDetailTab('video');
    setTimeout(() => {
      if (!videoPlayerRef.current) return;
      const match = timestampStr.match(/\[?(\d{1,2}:)?(\d{1,2}):(\d{2})\]?/);
      if (!match) return;
      let seconds = 0;
      const parts = match[0].replace(/[\[\]]/g, '').split(':').map(Number);
      if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
      videoPlayerRef.current.currentTime = seconds;
      videoPlayerRef.current.play();
    }, 100);
  };

  const renderBulletPoint = (text: string, index: number) => {
    const isChecked = selectedMeeting?.completedBullets?.includes(index);
    const timestampMatch = text.match(/^\[?(\d{1,2}:)?\d{1,2}:\d{2}\]?/);
    const timestamp = timestampMatch ? timestampMatch[0] : null;
    const cleanText = timestamp ? text.replace(timestamp, '').trim() : text;
    
    return (
      <li key={index} className={`flex gap-4 p-4 rounded-2xl border transition-all group ${isChecked ? 'bg-brand-green/5 border-brand-green/20 opacity-60' : 'bg-[#112936]/40 border-white/5 hover:border-brand-blue/30'}`}>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => toggleBullet(index)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${isChecked ? 'bg-brand-green border-brand-green text-brand-bg' : 'bg-white/5 border-white/20 text-transparent group-hover:border-brand-blue'}`}
            >
              <Check className="w-4 h-4" />
            </button>
            {timestamp && (
              <button onClick={() => seekToTime(timestamp)} className="text-[10px] font-black text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md hover:bg-brand-green hover:text-brand-bg transition-all flex items-center gap-1">
                <Play className="w-2 h-2 fill-current" /> {timestamp.replace(/[\[\]]/g, '')}
              </button>
            )}
          </div>
          <p className={`leading-relaxed font-medium text-xs ${isChecked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{cleanText}</p>
        </div>
      </li>
    );
  };

  const renderTranscriptLine = (line: string, idx: number) => {
    if (transcriptSearch && !line.toLowerCase().includes(transcriptSearch.toLowerCase())) return null;
    const speakerMatch = line.match(/^([^:]+):/);
    if (speakerMatch) {
      const speakerName = speakerMatch[1];
      const content = line.replace(`${speakerName}:`, '').trim();
      return (
        <div key={idx} className="mb-6 group/line">
          <div className="flex items-center gap-2 mb-1.5">
            <UserCircle className="w-4 h-4 text-brand-blue/60" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue">{speakerName}</span>
          </div>
          <p className="pl-6 border-l border-white/5 text-gray-300 group-hover/line:text-white transition-colors">
            {content}
          </p>
        </div>
      );
    }
    return (
      <p key={idx} className="mb-6 text-gray-400 pl-6 border-l border-white/5 italic">
        {line}
      </p>
    );
  };

  const handleConnectCalendar = async () => {
    setIsLoadingCalendar(true);
    try {
      const token = await getAccessToken() as string;
      setGoogleToken(token);
      localStorage.setItem('easy_google_token', token);
      setView(AppView.CALENDAR);
    } catch (err) { alert("Falha na autenticação."); }
    finally { setIsLoadingCalendar(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('easy_google_token');
    localStorage.removeItem('easy_api_key');
    setGoogleToken(null);
    setView(AppView.LOGIN);
  };

  if (view === AppView.LOGIN) return <Login onLogin={() => setView(AppView.DASHBOARD)} />;

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-white selection:bg-brand-blue/30">
      <header className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
          <img src="https://i.ibb.co/gLmX13qF/patitour-2026-01-28-T100659-889.png" alt="Icon" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-bold tracking-tight italic"><span className="text-white">EASY</span> <span className="bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">MEETING</span></h1>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <button onClick={() => setView(AppView.DASHBOARD)} className={view === AppView.DASHBOARD ? 'text-white font-bold' : 'hover:text-brand-green transition-colors'}>Minhas Reuniões</button>
          <button onClick={() => googleToken ? setView(AppView.CALENDAR) : handleConnectCalendar()} className={view === AppView.CALENDAR ? 'text-white font-bold' : 'hover:text-brand-green transition-colors'}>Calendário</button>
        </nav>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400"><Search className="w-5 h-5" /></button>
          <div className="relative group">
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden hover:border-brand-blue transition-all group-hover:bg-brand-blue/20"><User className="w-5 h-5 text-brand-blue" /></button>
            <div className="absolute right-0 top-12 w-56 bg-[#112936] border border-white/10 rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl z-[60]">
              <div className="px-4 py-3 border-b border-white/5 mb-2"><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Configurações</p></div>
              <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all group/logout">
                <div className="flex items-center gap-3"><Power className="w-4 h-4" /><span className="font-bold">Encerrar Sessão</span></div>
                <ChevronRight className="w-3 h-3 opacity-30" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Compartilhamento Personalizado */}
      {isShareModalOpen && meetingToShare && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-brand-bg/90 backdrop-blur-md animate-in fade-in" onClick={() => setIsShareModalOpen(false)} />
          <div className="bg-[#112936] border border-white/10 rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 relative z-[101]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div><h3 className="text-lg font-black uppercase tracking-widest">Compartilhar</h3><p className="text-[10px] text-brand-blue font-bold tracking-widest uppercase mt-1">Selecione o destino</p></div>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><CloseIcon className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-2">
              <button onClick={() => executeShare('whatsapp')} className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-brand-green/10 group transition-all"><div className="w-12 h-12 bg-brand-green/20 rounded-2xl flex items-center justify-center text-brand-green group-hover:scale-110"><MessageCircle className="w-6 h-6" /></div><div className="text-left"><p className="font-bold text-sm">WhatsApp</p><p className="text-[10px] text-gray-500">Enviar para conversa ou grupo</p></div></button>
              <button onClick={() => executeShare('gmail')} className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-red-500/10 group transition-all"><div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110"><Mail className="w-6 h-6" /></div><div className="text-left"><p className="font-bold text-sm">Gmail</p><p className="text-[10px] text-gray-500">Compor novo e-mail no Google</p></div></button>
              <button onClick={() => executeShare('email')} className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-brand-blue/10 group transition-all"><div className="w-12 h-12 bg-brand-blue/20 rounded-2xl flex items-center justify-center text-brand-blue group-hover:scale-110"><Mail className="w-6 h-6" /></div><div className="text-left"><p className="font-bold text-sm">E-mail Padrão</p><p className="text-[10px] text-gray-500">Usar app de e-mail do dispositivo</p></div></button>
              <div className="pt-4 mt-2 border-t border-white/5"><button onClick={() => executeShare('native')} className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-white/5 group transition-all"><div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:scale-110"><Share2 className="w-6 h-6" /></div><div className="text-left"><p className="font-bold text-sm">Outras Opções</p><p className="text-[10px] text-gray-500">Copiar link ou usar menu do sistema</p></div></button></div>
            </div>
          </div>
        </div>
      )}

      {showEmailNotice && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-brand-green text-brand-bg px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 font-bold">
          <CheckCircle className="w-5 h-5" /> Relatório enviado com sucesso!
        </div>
      )}

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
        {view === AppView.DASHBOARD && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div><h2 className="text-3xl font-bold text-white italic uppercase leading-none">Bem vindo ao <span className="text-brand-blue">EASY MEETING</span></h2><p className="mt-2 font-bold bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent italic tracking-wider">A SUA BIBLIOTECA INTELIGENTE DE REUNIÕES.</p></div>
              <div className="flex gap-3">
                {!showOnboarding && <button onClick={() => setShowOnboarding(true)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-brand-green"><HelpCircle className="w-6 h-6" /></button>}
                <button onClick={() => { setView(AppView.RECORDING); setIsRecordingNow(true); }} className="bg-brand-green hover:bg-brand-green/90 text-brand-bg px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl active:scale-95"><Plus className="w-5 h-5" /> Nova Gravação</button>
              </div>
            </div>
            {showOnboarding && <Onboarding onClose={() => { setShowOnboarding(false); localStorage.setItem('easy_onboarding_hidden', 'true'); }} />}
            {isProcessing && (
              <div className="bg-brand-blue/10 border border-brand-blue/20 p-6 rounded-3xl flex items-center gap-6 animate-pulse">
                <div className="relative"><div className="w-12 h-12 rounded-full border-4 border-brand-blue/30" /><div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" /></div>
                <div><p className="text-brand-blue font-bold uppercase tracking-[0.2em] text-xs">Processamento Inteligente</p><p className="text-gray-300 text-sm mt-1">Gerando o resumo perfeito...</p></div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.length === 0 && !isProcessing && (
                <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[48px] bg-white/[0.02]"><div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6"><Video className="w-10 h-10 text-gray-600" /></div><h3 className="text-xl font-bold text-gray-300">Sua galeria está vazia</h3></div>
              )}
              {meetings.map(m => (
                <div key={m.id} onClick={() => handleSelectMeeting(m)} className="group bg-[#112936]/40 border border-white/5 p-6 rounded-[32px] hover:bg-[#112936]/80 hover:border-brand-blue/30 transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-green opacity-0 group-hover:opacity-100" />
                  <button onClick={(e) => handleDeleteMeeting(e, m.id)} className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-20"><Trash2 className="w-4 h-4" /></button>
                  <div className="flex justify-between items-start mb-4"><div className="flex items-center gap-2 bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><Clock className="w-3 h-3" /> {m.duration}</div><div className="text-gray-500 text-[10px] font-bold uppercase tracking-tighter mr-8">{m.date}</div></div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-brand-blue line-clamp-1 italic">{m.title}</h3>
                  <p className="text-gray-400 text-xs line-clamp-2 mb-6 leading-relaxed">{m.summary}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-brand-blue/20 border border-brand-bg flex items-center justify-center text-[10px] font-bold text-brand-blue">IA</div>
                      <div className="w-7 h-7 rounded-full bg-brand-green/20 border border-brand-bg flex items-center justify-center text-[10px] font-bold text-brand-green">✓</div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 group-hover:text-brand-blue">Detalhes <ChevronRight className="w-4 h-4" /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === AppView.RECORDING && (
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-stretch h-[600px]">
              <div className="flex-1 flex items-center justify-center"><Recorder onRecordingComplete={handleRecordingComplete} onCancel={() => { setView(AppView.DASHBOARD); setIsRecordingNow(false); }} /></div>
              <div className="hidden lg:block"><LiveAssistant isRecording={isRecordingNow} /></div>
            </div>
          </div>
        )}

        {view === AppView.MEETING_DETAILS && selectedMeeting && (
          <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <button onClick={() => setView(AppView.DASHBOARD)} className="flex items-center gap-2 text-gray-500 hover:text-white transition-all group font-bold uppercase text-[10px] tracking-widest">
                  <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
                </button>
                <h2 className="text-3xl font-black italic tracking-tight">{selectedMeeting.title}</h2>
              </div>
              <div className="flex gap-3">
                <a href={selectedVideoUrl || '#'} download={`${selectedMeeting.title.replace(/\s+/g, '_')}.${isVideoMimeType ? 'webm' : 'weba'}`} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-brand-blue hover:bg-white/10 active:scale-95"><Download className="w-5 h-5" /></a>
                <button onClick={() => handleOpenShareMenu(selectedMeeting)} className="p-4 bg-brand-green text-brand-bg rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#00FFBA] shadow-xl active:scale-95 flex items-center gap-2"><Share2 className="w-4 h-4" /> Compartilhar</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LADO ESQUERDO: Resumo, Notas e Ações Rápidas (40% aprox) */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-[#112936]/40 border border-white/10 rounded-[40px] p-8 shadow-xl">
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-brand-green font-black uppercase tracking-widest text-[11px]">
                      <Sparkles className="w-4 h-4" /> Resumo Executivo
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed italic bg-black/20 p-6 rounded-3xl">
                      {selectedMeeting.summary}
                    </p>
                  </section>
                  <section className="space-y-6 mt-10">
                    <div className="flex items-center gap-2 text-brand-blue font-black uppercase tracking-widest text-[11px]">
                      <FileText className="w-4 h-4" /> Itens de Ação & Decisões
                    </div>
                    <ul className="space-y-4">
                      {selectedMeeting.bullets.map((b, i) => renderBulletPoint(b, i))}
                    </ul>
                  </section>

                  {/* Ações Rápidas */}
                  <section className="space-y-6 mt-10 pt-10 border-t border-white/5">
                    <div className="flex items-center gap-2 text-brand-white font-black uppercase tracking-widest text-[11px]">
                      <Zap className="w-4 h-4 text-brand-green" /> Ações Rápidas da IA
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => handleQuickAction('email')}
                        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-blue/10 hover:border-brand-blue/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-blue/20 rounded-xl flex items-center justify-center text-brand-blue"><Mail className="w-5 h-5" /></div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-white">Follow-up Email Drafter</p>
                            <p className="text-[10px] text-gray-500">Crie o e-mail de agradecimento e próximos passos</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-blue transition-colors" />
                      </button>

                      <button 
                        onClick={() => handleQuickAction('plan')}
                        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-green/10 hover:border-brand-green/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-green/20 rounded-xl flex items-center justify-center text-brand-green"><ClipboardCheck className="w-5 h-5" /></div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-white">Action Plan Generator</p>
                            <p className="text-[10px] text-gray-500">Transforme decisões em um plano de tarefas</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-green transition-colors" />
                      </button>

                      <button 
                        onClick={() => handleQuickAction('objections')}
                        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500"><FileJson className="w-5 h-5" /></div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-white">Sales Objection Handler</p>
                            <p className="text-[10px] text-gray-500">Antecipe objeções e prepare respostas</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              {/* LADO DIREITO: Abas de Vídeo/Áudio, Transcrição e Consultoria (60% aprox) */}
              <div className="lg:col-span-7 bg-[#112936]/60 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[750px] sticky top-28">
                {/* Cabeçalho das Abas */}
                <div className="flex items-center bg-black/40 p-2 gap-1">
                  <button 
                    onClick={() => setActiveDetailTab('video')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest ${activeDetailTab === 'video' ? 'bg-brand-blue text-brand-bg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    {isVideoMimeType ? <Video className="w-4 h-4" /> : <Headphones className="w-4 h-4" />} {isVideoMimeType ? 'Vídeo' : 'Áudio'}
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('transcript')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest ${activeDetailTab === 'transcript' ? 'bg-brand-green text-brand-bg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    <AlignLeft className="w-4 h-4" /> Transcrição
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('chat')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest ${activeDetailTab === 'chat' ? 'bg-brand-blue text-brand-bg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    <Zap className="w-4 h-4" /> Consultoria IA
                  </button>
                </div>

                <div className="flex-1 overflow-hidden relative">
                  {/* Conteúdo Aba: VÍDEO/ÁUDIO */}
                  {activeDetailTab === 'video' && (
                    <div className="h-full flex items-center justify-center bg-black p-4">
                      {selectedVideoUrl ? (
                        isVideoMimeType ? (
                          <video ref={videoPlayerRef} src={selectedVideoUrl} controls className="max-w-full max-h-full rounded-2xl" />
                        ) : (
                          <div className="flex flex-col items-center gap-6 p-12 text-center">
                            <div className="w-40 h-40 rounded-full bg-brand-green/10 flex items-center justify-center relative">
                              <div className="absolute inset-0 border-4 border-brand-green/20 rounded-full animate-ping opacity-20" />
                              <Headphones className="w-20 h-20 text-brand-green" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2 italic">Gravação Inteligente</h3>
                              <p className="text-gray-500 text-xs font-bold uppercase">Apenas Áudio • Espaço Otimizado</p>
                            </div>
                            <div className="flex items-center gap-3 bg-brand-green/5 border border-brand-green/10 px-6 py-3 rounded-full">
                               <Activity className="w-4 h-4 text-brand-green animate-pulse" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-brand-green">Ouvindo Vozes da Reunião</span>
                            </div>
                            <audio ref={videoPlayerRef as any} src={selectedVideoUrl} controls className="w-full max-w-sm mt-4 opacity-80" />
                          </div>
                        )
                      ) : (
                        <div className="text-center text-gray-500"><Play className="w-12 h-12 mx-auto mb-4 opacity-20" /> Carregando mídia...</div>
                      )}
                    </div>
                  )}

                  {/* Conteúdo Aba: TRANSCRIÇÃO */}
                  {activeDetailTab === 'transcript' && (
                    <div className="h-full flex flex-col">
                      <div className="p-4 border-b border-white/5 bg-black/20">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                          <input 
                            type="text" 
                            placeholder="Buscar na transcrição..." 
                            value={transcriptSearch}
                            onChange={(e) => setTranscriptSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-brand-green transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 text-gray-300 text-sm leading-[1.8] custom-scrollbar">
                        {selectedMeeting.transcript ? (
                          selectedMeeting.transcript.split('\n').map((line, idx) => renderTranscriptLine(line, idx))
                        ) : (
                          <div className="text-center text-gray-600 py-20 italic">A transcrição integral não está disponível para esta gravação.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Conteúdo Aba: CHAT/CONSULTORIA */}
                  {activeDetailTab === 'chat' && (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {chatHistory.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <Sparkles className="w-10 h-10 text-brand-blue mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest">IA Estrategista Ativa</p>
                          </div>
                        )}
                        {chatHistory.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[85%] p-4 rounded-3xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-brand-blue text-brand-bg font-bold rounded-tr-none shadow-lg' : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5 shadow-inner'}`}>{msg.content}</div>
                            <span className="text-[8px] font-black text-gray-600 mt-2 uppercase tracking-tighter">{msg.timestamp}</span>
                          </div>
                        ))}
                        {isAiTyping && (
                          <div className="flex flex-col items-start animate-pulse">
                            <div className="bg-white/5 p-4 rounded-3xl rounded-tl-none border border-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" /> Pensando estrategicamente...
                            </div>
                          </div>
                        )}
                      </div>
                      <form onSubmit={handleSendMessage} className="p-6 bg-black/40 border-t border-white/10">
                        <div className="relative group">
                          <input 
                            type="text" 
                            value={chatInput} 
                            onChange={(e) => setChatInput(e.target.value)} 
                            placeholder="Pergunte algo sobre a reunião..." 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-14 text-xs focus:outline-none focus:border-brand-green group-hover:bg-white/10 transition-all" 
                          />
                          <button 
                            type="submit" 
                            disabled={!chatInput.trim() || isAiTyping} 
                            className="absolute right-2 top-2 bg-brand-green text-brand-bg p-2.5 rounded-xl hover:bg-[#00FFBA] transition-all disabled:opacity-20 shadow-lg shadow-brand-green/20"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === AppView.CALENDAR && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setView(AppView.DASHBOARD)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></button>
                <div><h2 className="text-3xl font-bold text-white italic uppercase leading-none">Minha <span className="text-brand-green">Agenda</span></h2><p className="mt-2 font-bold bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent italic tracking-wider">REUNIÕES PROGRAMADAS NO GOOGLE CALENDAR.</p></div>
              </div>
              <button onClick={loadCalendarEvents} disabled={isLoadingCalendar} className="bg-brand-blue/10 border border-brand-blue/20 text-brand-blue px-6 py-3 rounded-2xl font-bold flex items-center gap-2"><RefreshCw className={`w-5 h-5 ${isLoadingCalendar ? 'animate-spin' : ''}`} /> Atualizar Agenda</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calendarEvents.map(event => (
                <div key={event.id} className="bg-[#112936]/40 border border-white/5 p-6 rounded-[32px] hover:border-brand-blue/30 transition-all group">
                  <div className="flex justify-between items-start mb-4"><div className="text-brand-green text-[10px] font-black uppercase tracking-widest bg-brand-green/10 px-3 py-1 rounded-full">Confirmado</div><div className="text-gray-500 text-[10px] font-bold uppercase">{event.start.dateTime ? new Date(event.start.dateTime).toLocaleDateString() : event.start.date}</div></div>
                  <h3 className="text-lg font-bold mb-2 italic group-hover:text-brand-blue line-clamp-2">{event.summary}</h3>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    {extractMeetingLink(event) ? (<a href={extractMeetingLink(event)!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-green hover:underline"><ExternalLink className="w-4 h-4" /> Entrar Agora</a>) : (<span className="text-[10px] font-black uppercase text-gray-600">Sem link direto</span>)}
                    <button onClick={() => { setView(AppView.RECORDING); setIsRecordingNow(true); }} className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg hover:bg-brand-blue hover:text-brand-bg"><Video className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
