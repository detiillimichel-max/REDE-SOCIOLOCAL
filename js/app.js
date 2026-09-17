(() => {
  'use strict';

  function iniciarAplicacao() {
    const feedContainer = document.getElementById('feed-container');
    const emptyState = document.getElementById('empty-state');

    if (!feedContainer) {
      console.error('Feed de mídia não encontrado.');
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

        atualizarEmptyState(feedContainer, emptyState);

        files.forEach((file) => {
          if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
          adicionarMidiaLocal(file, feedContainer, emptyState);
        });

        input.value = '';
      });
    });

    carregarFeedExistente(feedContainer, emptyState);
  }

  // ============================================================
  // Carregamento do feed já persistido no Neon (GET /api/media-list)
  // ============================================================

  async function carregarFeedExistente(feedContainer, emptyState) {
    try {
      const response = await fetch('/api/media-list', {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        console.error('Não foi possível carregar o feed existente:', data?.error);
        return;
      }

      const itens = Array.isArray(data.media) ? data.media : [];

      itens.forEach((media) => {
        const card = criarCardServidor(media);
        feedContainer.appendChild(card);
      });

      atualizarEmptyState(feedContainer, emptyState);
    } catch (error) {
      console.error('Falha ao buscar /api/media-list:', error);
    }
  }

  function criarCardServidor(media) {
    const isVideo = String(media.media_type || '').includes('video');
    const src = media.storage_url || media.thumbnail_url || '';

    const card = montarEstruturaCard({
      titulo: media.title || 'Sem título',
      isVideo,
      src,
      mediaId: media.id
    });

    const status = card.querySelector('.post-upload-status');
    status.textContent = 'Publicado e registrado no Neon.';
    status.classList.add('is-success');

    return card;
  }

  // ============================================================
  // Envio de nova mídia (galeria/câmera) com fila local no IndexedDB
  // ============================================================

  function adicionarMidiaLocal(file, feedContainer, emptyState) {
    const mediaUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    const card = montarEstruturaCard({
      titulo: file.name,
      isVideo,
      src: mediaUrl,
      mediaId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
    });

    feedContainer.appendChild(card);

    const status = card.querySelector('.post-upload-status');
    const mediaElement = card.querySelector('.post-media');

    processarEnvio(file, card, status, mediaElement, mediaUrl, feedContainer, emptyState);
  }

  async function processarEnvio(file, card, status, mediaElement, mediaUrl, feedContainer, emptyState) {
    let idLocal = null;
    const temFilaLocal = Boolean(window.REDE_SOCIOLOCAL_MEDIA_DB);

    if (temFilaLocal) {
      try {
        idLocal = await window.REDE_SOCIOLOCAL_MEDIA_DB.salvar(file);
      } catch (error) {
        console.error('Não foi possível guardar a mídia na fila local:', error);
        status.textContent = error?.message || 'Não foi possível guardar a mídia localmente.';
        status.classList.add('is-error');
        // Mesmo sem a fila local, tentamos seguir com o envio direto.
      }
    }

    if (!window.REDEMediaCloud || typeof window.REDEMediaCloud.uploadAndRegister !== 'function') {
      status.textContent = 'Pré-visualização local. Módulo de envio indisponível.';
      status.classList.add('is-error');
      if (idLocal) {
        await marcarStatusLocal(idLocal, 'failed');
      }
      return;
    }

    status.textContent = 'Enviando para o armazenamento...';
    status.classList.add('is-uploading');

    if (idLocal) {
      await marcarStatusLocal(idLocal, 'processing');
    }

    try {
      const media = await window.REDEMediaCloud.uploadAndRegister(file);

      if (media?.storage_url) {
        mediaElement.src = media.storage_url;
      }

      card.querySelectorAll('[data-engajamento]').forEach((button) => {
        button.dataset.mediaId = media.id;
      });

      status.textContent = 'Publicado e registrado no Neon.';
      status.classList.remove('is-uploading');
      status.classList.add('is-success');
      URL.revokeObjectURL(mediaUrl);

      if (idLocal) {
        await marcarStatusLocal(idLocal, 'ready');
      }
    } catch (error) {
      console.error('Falha ao enviar mídia:', error);
      status.textContent = `Falha no envio: ${error.message || 'tente novamente.'}`;
      status.classList.remove('is-uploading');
      status.classList.add('is-error');

      if (idLocal) {
        await marcarStatusLocal(idLocal, 'failed');
      }
    }

    atualizarEmptyState(feedContainer, emptyState);
  }

  async function marcarStatusLocal(idLocal, status) {
    if (!window.REDE_SOCIOLOCAL_MEDIA_DB || typeof window.REDE_SOCIOLOCAL_MEDIA_DB.atualizar !== 'function') {
      return;
    }

    try {
      await window.REDE_SOCIOLOCAL_MEDIA_DB.atualizar(idLocal, { status });
    } catch (error) {
      console.warn('Não foi possível atualizar o status local da mídia:', error);
    }
  }

  // ============================================================
  // Estrutura de card compartilhada (feed do servidor e uploads novos)
  // ============================================================

  function montarEstruturaCard({ titulo, isVideo, src, mediaId }) {
    const card = document.createElement('article');
    card.className = 'post-card';

    const header = document.createElement('div');
    header.className = 'post-header';
    header.textContent = titulo;

    const mediaElement = document.createElement(isVideo ? 'video' : 'img');
    mediaElement.className = 'post-media';
    mediaElement.src = src;

    if (isVideo) {
      mediaElement.controls = true;
      mediaElement.loop = true;
      mediaElement.playsInline = true;
      mediaElement.preload = 'metadata';
    } else {
      mediaElement.alt = titulo;
      mediaElement.loading = 'lazy';
    }

    const status = document.createElement('small');
    status.className = 'post-upload-status';
    status.textContent = 'Preparando envio...';

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
      <button type="button" class="action-btn" data-engajamento="compartilhar" data-media-id="${mediaId}" aria-label="Compartilhar">
        <i data-lucide="share-2"></i>
      </button>
    `;

    card.append(header, mediaElement, status, actions);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: actions });
    }

    return card;
  }

  function atualizarEmptyState(feedContainer, emptyState) {
    if (!emptyState) return;
    const temCards = feedContainer.querySelector('.post-card') !== null;
    emptyState.hidden = temCards;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarAplicacao, { once: true });
  } else {
    iniciarAplicacao();
  }
})();

