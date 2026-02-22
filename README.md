
# EASY MEETING - AI Meeting Assistant

Este é um assistente de reuniões inteligente estilo PWA que grava, resume e gera insights de reuniões no Meet, Zoom e Teams.

## 🚀 Como fazer o Deploy

1. **GitHub:** Suba todos os arquivos para um novo repositório.
2. **Vercel:**
   - Conecte seu repositório.
   - Nas **Environment Variables**, adicione:
     - `API_KEY`: Sua chave da API do Google Gemini (obtenha em [ai.google.dev](https://ai.google.dev)).
3. **Google Agenda:**
   - Para que a integração com o calendário funcione em produção, você deve ir ao [Google Cloud Console](https://console.cloud.google.com/), criar um projeto e configurar o **OAuth 2.0 Client ID** com a origem autorizada do seu domínio da Vercel.

## ✨ Funcionalidades
- Gravação de Tela e Áudio (Meet, Zoom, Teams).
- Resumos automáticos com Gemini 3 Flash.
- Chat com IA para perguntas pós-reunião.
- Estrategista em Tempo Real.
- PWA Instalável.
- Armazenamento Local Seguro (IndexedDB).

Desenvolvido com 💚 por EASY BYZ CREATOR.
