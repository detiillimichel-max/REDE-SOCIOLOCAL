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
    carregarComentarios(drawer.dataset.mediaId, drawer, card);

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


  const USER_ID_TEMPORARIO = '00000000-0000-4000-8000-000000000001';

  function exibirErroNoCard(element, mensagem) {
    const card = element instanceof Element ? element.closest('.post-card') || element : null;
    if (!card) return;

    let erro = card.querySelector('.engajamento-api-error');
    if (!erro) {
      erro = document.createElement('div');
      erro.className = 'engajamento-api-error';
      erro.setAttribute('role', 'alert');
      card.appendChild(erro);
    }
    erro.textContent = mensagem;
  }

  async function enviarCurtida(event) {
    const mediaId = event.detail?.id || event.detail?.media_id || '';
    const element = event.detail?.element;

    if (!mediaId) {
      exibirErroNoCard(element, 'Não foi possível identificar esta publicação.');
      return;
    }

    try {
      const response = await fetch('/api/media-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          media_id: mediaId,
          user_id: USER_ID_TEMPORARIO,
          interaction_type: 'like'
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Não foi possível atualizar a curtida.');
      }

      const card = element instanceof Element ? element.closest('.post-card') || element : null;
      if (card) {
        const button = card.querySelector('button[data-engajamento="curtir"]');
        if (button) button.classList.toggle('is-active', data.liked === true);
      }
    } catch (error) {
      console.error('Erro ao persistir curtida:', error);
      exibirErroNoCard(element, error?.message || 'Erro de rede ao salvar a curtida.');
    }
  }

  function renderizarComentarios(drawer, comentarios) {
    const body = drawer?.querySelector('.comments-drawer-body');
    if (!body) return;

    const input = body.querySelector('.comments-input');
    const sendButton = body.querySelector('.comments-send');
    const listaAnterior = body.querySelector('.comments-list');
    if (listaAnterior) listaAnterior.remove();

    const lista = document.createElement('div');
    lista.className = 'comments-list';

    if (!comentarios.length) {
      const vazio = document.createElement('p');
      vazio.textContent = 'Nenhum comentário ainda.';
      lista.appendChild(vazio);
    } else {
      comentarios.forEach((comentario) => {
        const item = document.createElement('article');
        item.className = 'comment-item';

        const texto = document.createElement('p');
        texto.textContent = comentario.content || '';

        const data = document.createElement('small');
        if (comentario.created_at) {
          data.textContent = new Date(comentario.created_at).toLocaleString('pt-BR');
        }

        item.append(texto, data);
        lista.appendChild(item);
      });
    }

    body.insertBefore(lista, input || sendButton || null);
  }

  async function carregarComentarios(mediaId, drawer, element) {
    if (!mediaId || !drawer) return;

    try {
      const response = await fetch(
        `/api/media-comments?media_id=${encodeURIComponent(mediaId)}`,
        { method: 'GET', headers: { Accept: 'application/json' } }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Não foi possível carregar os comentários.');
      }

      renderizarComentarios(drawer, Array.isArray(data.comments) ? data.comments : []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      exibirErroNoCard(element, error?.message || 'Erro de rede ao carregar comentários.');
    }
  }

  async function enviarComentario(event) {
    const texto = event.detail?.texto?.trim() || '';
    const element = event.detail?.element;
    const drawer = document.getElementById('comments-drawer');
    const mediaId = drawer?.dataset.mediaId || event.detail?.media_id || '';

    if (!mediaId || !texto) {
      exibirErroNoCard(element, 'Não foi possível enviar este comentário.');
      return;
    }

    try {
      const response = await fetch('/api/media-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          media_id: mediaId,
          author_id: USER_ID_TEMPORARIO,
          content: texto
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Não foi possível enviar o comentário.');
      }

      await carregarComentarios(mediaId, drawer, element);
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      exibirErroNoCard(element, error?.message || 'Erro de rede ao enviar comentário.');
    }
  }

  function inicializar() {
    if (inicializado) return;
    inicializado = true;

    document.addEventListener('engajamento:curtir', enviarCurtida);
    document.addEventListener('comentarios:enviar', enviarComentario);

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
