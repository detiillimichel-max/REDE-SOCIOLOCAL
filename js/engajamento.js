(() => {
  'use strict';

  // Módulo exclusivo dos eventos de engajamento.
  // Não altera os eventos de galeria, câmera ou reprodução de mídia.

  let inicializado = false;

  function emitir(nome, detalhe = {}) {
    document.dispatchEvent(new CustomEvent(nome, { detail: detalhe }));
  }

  function obterCard(button) {
    return button.closest('.post-card');
  }

  function marcarEstado(button) {
    const card = obterCard(button);
    if (!card) return;
    card.querySelectorAll('[data-engajamento="curtir"], [data-engajamento="nao-curtir"]')
      .forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
  }

  function abrirGavetaComentarios(button) {
    const card = obterCard(button);
    let drawer = document.getElementById('comments-drawer');

    if (!drawer) {
      drawer = document.createElement('section');
      drawer.id = 'comments-drawer';
      drawer.className = 'comments-drawer';
      drawer.setAttribute('aria-label', 'Comentários');
      drawer.innerHTML = `
        <div class="comments-drawer-header">
          <strong>Comentários</strong>
          <button type="button" class="comments-close" aria-label="Fechar comentários">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="comments-drawer-body">
          <p>Os comentários desta publicação aparecerão aqui.</p>
          <textarea class="comments-input" placeholder="Escreva um comentário..." rows="3"></textarea>
          <button type="button" class="comments-send">Enviar comentário</button>
        </div>
      `;
      document.body.appendChild(drawer);

      drawer.querySelector('.comments-close').addEventListener('click', () => {
        drawer.classList.remove('is-open');
      });

      drawer.querySelector('.comments-send').addEventListener('click', () => {
        const input = drawer.querySelector('.comments-input');
        const texto = input.value.trim();
        if (!texto) return;
        emitir('comentarios:enviar', { texto, element: card });
        input.value = '';
        drawer.querySelector('.comments-drawer-body p').textContent = 'Comentário preparado para envio.';
      });
    }

    drawer.dataset.mediaId = button.dataset.mediaId || '';
    drawer.classList.add('is-open');

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: drawer });
    }

    emitir('comentarios:abrir', {
      id: button.dataset.mediaId || '',
      element: card,
      drawer
    });
  }

  async function compartilhar(button) {
    const title = button.dataset.shareTitle || document.title;
    const text = button.dataset.shareText || title;
    const url = window.location.href;

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, text, url });
        emitir('engajamento:compartilhado', { url, title, text });
        return;
      }

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(url);
        emitir('engajamento:link-copiado', { url, title, text });
        return;
      }

      window.prompt('Copie o link para compartilhar:', url);
    } catch (error) {
      if (!error || error.name !== 'AbortError') {
        console.error('Falha ao compartilhar:', error);
      }
    }
  }

  function inicializar() {
    if (inicializado) return;
    inicializado = true;

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest('button[data-engajamento]');
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const action = button.dataset.engajamento;
      const id = button.dataset.mediaId || '';
      const element = obterCard(button);

      if (action === 'curtir') {
        marcarEstado(button);
        emitir('engajamento:curtir', { id, element });
      } else if (action === 'nao-curtir') {
        marcarEstado(button);
        emitir('engajamento:nao-curtir', { id, element });
      } else if (action === 'comentarios') {
        abrirGavetaComentarios(button);
      } else if (action === 'compartilhar') {
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
