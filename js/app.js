(() => {
  'use strict';

  function iniciarAplicacao() {
    const feedContainer = document.getElementById('feed-container');
    const emptyState = document.getElementById('empty-state');

    if (!feedContainer) {
      console.error('Feed de midia nao encontrado.');
      return;
    }

    // Inicializa os icones da biblioteca Lucide, quando disponivel.
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    const buttonInputPairs = [
      ['gallery-photo-button', 'gallery-photo-input'],
      ['gallery-video-button', 'gallery-video-input'],
      ['camera-photo-button', 'camera-photo-input'],
      ['camera-video-button', 'camera-video-input']
    ];

    buttonInputPairs.forEach(([buttonId, inputId]) => {
      const button = document.getElementById(buttonId);
      const input = document.getElementById(inputId);

      if (!button || !input) {
        console.error(`Elemento ausente: ${buttonId} ou ${inputId}`);
        return;
      }

      // Evita duplicar eventos se o script for carregado novamente.
      if (button.dataset.mediaReady === 'true') return;
      button.dataset.mediaReady = 'true';

      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        input.click();
      });

      input.addEventListener('change', (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        if (emptyState) emptyState.hidden = true;

        files.forEach((file) => {
          if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
          const mediaUrl = URL.createObjectURL(file);
          feedContainer.appendChild(createPostCard(file, mediaUrl));
        });

        // Permite escolher novamente o mesmo arquivo.
        input.value = '';
      });
    });
  }

  function createPostCard(file, src) {
    const card = document.createElement('article');
    card.className = 'post-card';

    const isVideo = file.type.startsWith('video/');
    const header = document.createElement('div');
    header.className = 'post-header';
    header.textContent = file.name;

    const mediaElement = document.createElement(isVideo ? 'video' : 'img');
    mediaElement.className = 'post-media';
    mediaElement.src = src;

    if (isVideo) {
      mediaElement.controls = true;
      mediaElement.loop = true;
      mediaElement.playsInline = true;
      mediaElement.preload = 'metadata';
    } else {
      mediaElement.alt = file.name;
      mediaElement.loading = 'lazy';
    }

    const actions = document.createElement('div');
    actions.className = 'post-actions';
    actions.innerHTML = `
      <button type="button" class="action-btn" aria-label="Curtir">♡</button>
      <button type="button" class="action-btn" aria-label="Comentar">◌</button>
      <button type="button" class="action-btn" aria-label="Compartilhar">↗</button>
    `;

    card.append(header, mediaElement, actions);
    return card;
  }

  // O script esta no final do HTML, mas esta protecao tambem funciona se for movido.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarAplicacao, { once: true });
  } else {
    iniciarAplicacao();
  }
})();
