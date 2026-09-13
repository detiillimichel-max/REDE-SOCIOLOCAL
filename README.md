# 📱 Social Feed PWA

Um **Progressive Web App (PWA)** privado e leve que transforma suas fotos e vídeos locais em um feed no estilo rede social. Todas as mídias são processadas diretamente no seu navegador, sem a necessidade de enviar arquivos para servidores externos.

---

## 🚀 Recursos

- **Privacidade Total:** Mídias carregadas via API local (`URL.createObjectURL`), sem uploads para a nuvem.
- **Feed Interativo:** Suporte para fotos e vídeos (com controles e reprodução).
- **Instalável (PWA):** Pode ser adicionado à tela inicial do celular ou desktop.
- **Suporte Offline:** Registrado com Service Worker para abrir e carregar a interface mesmo sem internet.
- **Design Responsivo:** Interface em modo escuro otimizada para navegação vertical estilo feed.

---

## 📁 Estrutura de Arquivos

```text
meu-pwa-mídia/
│
├── index.html          # Interface principal do aplicativo
├── manifest.json       # Configurações do PWA (ícones, nome, tema)
├── sw.js               # Service Worker para suporte offline
├── css/
│   └── styles.css      # Estilização do feed
└── js/
    └── app.js          # Lógica de leitura de arquivos e criação de posts
