(() => {
  'use strict';

  // Módulo dedicado aos eventos de engajamento.
  // Não altera player, galeria ou armazenamento.

  function emitir(nome, detalhe) {
    document.dispatchEvent(new CustomEvent(nome, { detail: detalhe || {} }));
  }

  async function compartilhar(button) {
    const url = button.dataset.shareUrl || window.location.href;
    const title = button.dataset.shareTitle || document.title;
    const text = button.dataset.shareText || title;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        emitir('engajamento:compartilhado', { url, title, text });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        emitir('engajamento:link-copiado', { url, title, text });
        return;
      }

      window.prompt('Copie o link para compartilhar:', url);
    } catch (error) {
      if (error && error.name !== 'AbortError') {
        console.error('Falha ao compartilhar:', error);
      }
    }
  }

  function abrirComentarios(button) {
    emitir('comentarios:abrir', {
      id: button.dataset.mediaId || '',
      element: button.closest('.post-card') || null
    });
  }

  function inicializar() {
    // Lucide: transforma data-lucide em ícones SVG.
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-engajamento]');
      if (!button) return;

      const action = button.dataset.engajamento;
      const mediaId = button.dataset.mediaId || '';

      if (action === 'curtir') {
        emitir('engajamento:curtir', { id: mediaId, element: button.closest('.post-card') || null });
      }

      if (action === 'nao-curtir') {
        emitir('engajamento:nao-curtir', { id: mediaId, element: button.closest('.post-card') || null });
      }

      if (action === 'comentarios') {
        abrirComentarios(button);
      }

      if (action === 'compartilhar') {
        compartilhar(button);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar, { once: true });
  } else {
    inicializar();
  }
})();
