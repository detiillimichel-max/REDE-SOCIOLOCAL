(() => {
  'use strict';

  function iniciarAplicacao() {
    const feedContainer = document.getElementById('feed-container');
    const emptyState = document.getElementById('empty-state');

    if (!feedContainer) {
      console.error('Feed de midia nao encontrado.');
      return;
    }

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

        input.value = '';
      });
    });
  }

  function createPostCard(file, src) {
    const card = document.createElement('article');
    card.className = 'post-card';

    const isVideo = file.type.startsWith('video/');
    const mediaId = `local-${crypto?.randomUUID ? crypto.randomUUID() : Date.now()}`;
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

    const actions = document.createElement('aside');
    actions.className = 'post-actions';
    actions.setAttribute('aria-label', 'Ações de engajamento');
    actions.innerHTML = `
      <button type="button" class="action-btn" data-engajamento="curtir" data-media-id="${mediaId}" aria-label="Curtir">
        <i data-lucide="thumbs-up"></i>
      </button>
      <button type="button" class="action-btn" data-engajamento="nao-curtir" data-media-id="${mediaId}" aria-label="Não curtir">
        <i data-lucide="thumbs-down"></i>
      </button>
      <button type="button" class="action-btn" data-engajamento="comentarios" data-media-id="${mediaId}" aria-label="Comentários">
        <i data-lucide="message-square"></i>
      </button>
      <button
        type="button"
        class="action-btn"
        data-engajamento="compartilhar"
        data-media-id="${mediaId}"
        data-share-title="${file.name.replace(/"/g, '&quot;')}"
        data-share-text="Compartilhar ${file.name.replace(/"/g, '&quot;')}"
        data-share-url="${src}"
        aria-label="Compartilhar"
      >
        <i data-lucide="share-2"></i>
      </button>
    `;

    card.append(header, mediaElement, actions);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: actions });
    }

    return card;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarAplicacao, { once: true });
  } else {
    iniciarAplicacao();
  }
})();
