
import React from 'react';
import { 
  Download, 
  Video, 
  Zap, 
  FileText, 
  Headphones, 
  Lock, 
  X,
  UserCircle,
  Calendar,
  History,
  CheckSquare,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface OnboardingProps {
  onClose: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onClose }) => {
  const cards = [
    {
      title: "Instale como Aplicativo (PWA)",
      text: "Clique no ícone de instalação na barra do seu navegador. O EASY MEETING funcionará como um app nativo, com ícone exclusivo e carregamento instantâneo.",
      icon: React.createElement(Download, { className: "w-6 h-6 text-white" })
    },
    {
      title: "Como Gravar (Meet, Zoom, Teams)",
      text: "Clique em 'Nova Gravação' e selecione a aba da reunião. Lembre-se de marcar 'Compartilhar áudio do sistema' para capturar a voz de todos.",
      icon: React.createElement(Video, { className: "w-6 h-6 text-white" })
    },
    {
      title: "SINCRONIA TOTAL COM SUA AGENDA",
      text: "Conecte seu Google Calendar para visualizar seus compromissos. Acesse links do Meet, Zoom ou Teams e inicie gravações com um clique, sem precisar caçar convites no seu e-mail.",
      icon: React.createElement(Calendar, { className: "w-6 h-6 text-white" })
    },
    {
      title: "Identificação de Oradores",
      text: "Diferente de gravadores comuns, o app sabe separar quem disse o quê. Saiba quem disse o quê sem precisar dar play.",
      icon: React.createElement(UserCircle, { className: "w-6 h-6 text-white" })
    },
    {
      title: "Ações Rápidas (Quick Actions)",
      text: "Follow-up e Planos de Ação prontos em segundos. O trabalho pós-reunião já fica 90% pronto instantaneamente.",
      icon: React.createElement(Zap, { className: "w-6 h-6 text-white" })
    },
    {
      title: "IA Estrategista em Tempo Real",
      text: "Sua IA consultora ao vivo durante a chamada. Pergunte como responder a objeções enquanto o cliente fala.",
      icon: React.createElement(Sparkles, { className: "w-6 h-6 text-white" })
    },
    {
      title: "Checklist Interativo de Decisões",
      text: "Transformamos os 'Bullet Points' em algo vivo. Transforme decisões em tarefas concluídas que persistem no sistema.",
      icon: React.createElement(CheckSquare, { className: "w-6 h-6 text-white" })
    },
    {
      title: "MEMÓRIA ESTRATÉGICA PERSISTENTE",
      text: "Toda consultoria feita com a IA fica salva em cada reunião. Volte dias depois para rever os insights ou continue a conversa de onde parou.",
      icon: React.createElement(History, { className: "w-6 h-6 text-white" })
    },
    {
      title: "Resumos e Insights Instantâneos",
      text: "Após o término, a IA gera automaticamente um resumo executivo e bullet points estratégicos para você.",
      icon: React.createElement(FileText, { className: "w-6 h-6 text-white" })
    },
    {
      title: "Assistente em Tempo Real",
      text: "Use o painel lateral durante a chamada para consultar a IA. Ideal para suporte em vendas e negociações complexas.",
      icon: React.createElement(MessageSquare, { className: "w-6 h-6 text-white" })
    },
    {
      title: "Dica de Áudio (Fones de Ouvido)",
      text: "Pode usar fones tranquilamente! O app captura o áudio que você ouve e o que fala sem interferências.",
      icon: React.createElement(Headphones, { className: "w-6 h-6 text-white" })
    },
    {
      title: "Privacidade e Segurança Local",
      text: "Seus vídeos são salvos localmente no seu navegador. Privacidade total: nada sai do seu dispositivo sem seu comando.",
      icon: React.createElement(Lock, { className: "w-6 h-6 text-white" })
    }
  ];

  return React.createElement('div', { 
    className: "relative bg-white/5 border border-white/10 rounded-[32px] p-8 mb-10 overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-700" 
  },
    React.createElement('div', { 
      className: "absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-brand-green via-brand-blue to-brand-green opacity-50" 
    }),
    React.createElement('div', { 
      className: "flex justify-between items-start mb-8" 
    },
      React.createElement('div', null,
        React.createElement('h2', { 
          className: "text-sm font-bold uppercase tracking-[0.3em] text-brand-green mb-2" 
        }, "Comece Aqui"),
        React.createElement('p', { 
          className: "text-2xl font-bold text-white tracking-tight" 
        }, 
          "O seu Guia Rápido ",
          React.createElement('span', {
            className: "bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent"
          }, "EASY MEETING")
        )
      ),
      React.createElement('button', { 
        onClick: onClose,
        className: "p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"
      }, React.createElement(X, { className: "w-6 h-6" }))
    ),
    React.createElement('div', { 
      className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
    },
      cards.map((card, idx) => (
        React.createElement('div', { 
          key: idx, 
          className: "bg-black/20 border border-white/5 p-5 rounded-2xl hover:border-brand-blue/30 transition-all group/card flex flex-col h-full" 
        },
          React.createElement('div', { 
            className: "w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover/card:bg-brand-blue/10 transition-colors shrink-0" 
          },
            card.icon
          ),
          React.createElement('h3', { 
            className: "text-white font-bold mb-2 text-xs uppercase tracking-wide h-8 flex items-center" 
          }, card.title),
          React.createElement('p', { 
            className: "text-gray-400 text-[11px] leading-relaxed" 
          }, card.text)
        )
      ))
    )
  );
};

export default Onboarding;
