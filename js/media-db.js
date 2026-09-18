(() => {
  'use strict';

  const DB_NAME = 'rede-sociolocal-media';
  const DB_VERSION = 1;
  const STORE_NAME = 'pending-media';
  const STORAGE_WARNING_RATIO = 0.80;

  // Singleton: mantém uma única Promise/Database connection durante a vida da página.
  let bancoPromise = null;

  function abrirBanco() {
    if (bancoPromise) return bancoPromise;

    bancoPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB não está disponível neste dispositivo.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const oldVersion = event.oldVersion;

        // Migração inicial. Novas versões devem usar oldVersion para preservar
        // os dados existentes e aplicar somente as mudanças necessárias.
        if (oldVersion < 1 && !db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        db.onversionchange = () => {
          db.close();
          bancoPromise = null;
        };

        resolve(db);
      };

      request.onerror = () => {
        bancoPromise = null;
        reject(request.error || new Error('Não foi possível abrir o IndexedDB.'));
      };

      request.onblocked = () => {
        // A abertura pode continuar assim que uma conexão antiga for liberada.
        console.warn('A abertura do IndexedDB está aguardando uma conexão antiga ser liberada.');
      };
    });

    return bancoPromise;
  }

  async function verificarEspaco(fileSize) {
    if (!navigator.storage?.estimate) {
      return { ok: true, warning: false, usage: null, quota: null };
    }

    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();

      if (!quota) {
        return { ok: true, warning: false, usage, quota };
      }

      const disponivel = Math.max(0, quota - usage);
      const usoProjetado = usage + fileSize;
      const percentualProjetado = usoProjetado / quota;
      const warning = percentualProjetado >= STORAGE_WARNING_RATIO;

      if (fileSize > disponivel) {
        throw new DOMException(
          'Não há espaço de armazenamento suficiente para guardar esta mídia localmente.',
          'QuotaExceededError'
        );
      }

      return {
        ok: true,
        warning,
        usage,
        quota,
        disponivel,
        percentualProjetado
      };
    } catch (error) {
      if (error?.name === 'QuotaExceededError') throw error;
      console.warn('Não foi possível estimar o espaço do armazenamento:', error);
      return { ok: true, warning: false, usage: null, quota: null };
    }
  }

  function mensagemQuota(error) {
    if (error?.name === 'QuotaExceededError') {
      return new Error(
        'Não foi possível guardar a mídia neste dispositivo: o armazenamento local está cheio ou próximo do limite. Libere espaço e tente novamente.'
      );
    }
    return error;
  }

  async function salvar(file, dados = {}, idExterno = null) {
    if (!(file instanceof Blob)) {
      throw new TypeError('A mídia precisa ser um File ou Blob.');
    }

    let espaco;
    try {
      espaco = await verificarEspaco(file.size);
    } catch (error) {
      throw mensagemQuota(error);
    }

    if (espaco.warning) {
      console.warn(
        'IndexedDB: armazenamento próximo do limite. A mídia será salva, mas o espaço local está elevado.'
      );
    }

    const db = await abrirBanco();
    const registro = {
      file,
      name: file.name || dados.name || 'midia',
      type: file.type || dados.type || 'application/octet-stream',
      size: file.size,
      createdAt: Date.now(),
      ...dados,
      id: idExterno || crypto.randomUUID(),
      status: 'pending'
    };

    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(registro);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Não foi possível salvar a mídia.'));
        tx.onabort = () => reject(tx.error || new Error('Não foi possível salvar a mídia.'));
      });
    } catch (error) {
      throw mensagemQuota(error);
    }

    return registro.id;
  }

  async function obter(id) {
    const db = await abrirBanco();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Não foi possível obter a mídia.'));
    });
  }

  async function atualizar(id, dados = {}) {
    if (!id) throw new TypeError('O id da mídia é obrigatório.');
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
      throw new TypeError('Os dados para atualização precisam ser um objeto.');
    }

    const db = await abrirBanco();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const atual = request.result;
        if (!atual) {
          reject(new Error('Mídia não encontrada no IndexedDB.'));
          return;
        }

        store.put({ ...atual, ...dados, id: atual.id });
      };

      request.onerror = () => reject(request.error || new Error('Não foi possível obter a mídia para atualização.'));
      tx.oncomplete = async () => {
        try {
          resolve(await obter(id));
        } catch (error) {
          reject(error);
        }
      };
      tx.onerror = () => reject(tx.error || new Error('Não foi possível atualizar a mídia.'));
      tx.onabort = () => reject(tx.error || new Error('Atualização da mídia cancelada.'));
    });
  }

  async function remover(id) {
    const db = await abrirBanco();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Não foi possível remover a mídia.'));
      tx.onabort = () => reject(tx.error || new Error('Remoção da mídia cancelada.'));
    });
  }

  async function listar() {
    const db = await abrirBanco();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Não foi possível listar as mídias.'));
    });
  }

  async function limparAntigas(diasLimite) {
    const dias = Number(diasLimite);
    if (!Number.isFinite(dias) || dias < 0) {
      throw new TypeError('diasLimite precisa ser um número maior ou igual a zero.');
    }

    const limite = Date.now() - (dias * 24 * 60 * 60 * 1000);
    const registros = await listar();
    const antigas = registros.filter((registro) => {
      const criadoEm = Number(registro.createdAt);
      return Number.isFinite(criadoEm) && criadoEm < limite;
    });

    if (!antigas.length) return 0;

    const db = await abrirBanco();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      antigas.forEach((registro) => store.delete(registro.id));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Não foi possível limpar mídias antigas.'));
      tx.onabort = () => reject(tx.error || new Error('Limpeza de mídias antigas cancelada.'));
    });

    return antigas.length;
  }


  async function restaurarPendentes() {
    const feed = document.getElementById('feed-container');
    if (!feed) return;

    const registros = (await listar())
      .filter((registro) =>
        registro &&
        registro.file instanceof Blob &&
        registro.status !== 'ready'
      )
      .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));

    for (const registro of registros) {
      restaurarRegistroNoFeed(feed, registro);
    }

    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
      emptyState.hidden = feed.querySelector('.post-card') !== null;
    }
  }

  function restaurarRegistroNoFeed(feed, registro) {
    if (feed.querySelector('[data-local-media-id="' + CSS.escape(registro.id) + '"]')) {
      return;
    }

    const file = registro.file;
    const url = URL.createObjectURL(file);
    const isVideo = String(registro.type || file.type || '').startsWith('video/');

    const card = document.createElement('article');
    card.className = 'post-card';
    card.dataset.localMediaId = registro.id;

    const header = document.createElement('div');
    header.className = 'post-header';
    header.textContent = registro.name || file.name || 'Mídia local';

    const media = document.createElement(isVideo ? 'video' : 'img');
    media.className = 'post-media';
    media.src = url;

    if (isVideo) {
      media.controls = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = 'metadata';
    } else {
      media.alt = registro.name || file.name || 'Imagem';
      media.loading = 'lazy';
    }

    const status = document.createElement('small');
    status.className = 'post-upload-status';

    if (registro.status === 'failed') {
      status.textContent = 'Mídia salva neste dispositivo. O último envio falhou.';
      status.classList.add('is-error');
    } else if (registro.status === 'processing') {
      status.textContent = 'Mídia salva neste dispositivo. Envio não concluído.';
      status.classList.add('is-error');
    } else {
      status.textContent = 'Mídia salva neste dispositivo. Aguardando envio.';
      status.classList.add('is-uploading');
    }

    const actions = document.createElement('aside');
    actions.className = 'post-actions';
    actions.setAttribute('aria-label', 'Ações de engajamento');
    actions.innerHTML = `
      <button type="button" class="action-btn" data-engajamento="curtir" aria-label="Curtir">
        <i data-lucide="thumbs-up"></i>
      </button>
      <button type="button" class="action-btn" data-engajamento="nao-curtir" aria-label="Não curtir">
        <i data-lucide="thumbs-down"></i>
      </button>
      <button type="button" class="action-btn" data-engajamento="comentarios" aria-label="Comentários">
        <i data-lucide="message-square"></i>
      </button>
      <button type="button" class="action-btn" data-engajamento="compartilhar" aria-label="Compartilhar">
        <i data-lucide="share-2"></i>
      </button>
    `;

    card.append(header, media, status, actions);
    feed.appendChild(card);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: actions });
    }
  }

  function iniciarRestauracao() {
    restaurarPendentes().catch((error) => {
      console.error('Não foi possível restaurar mídias do IndexedDB:', error);
    });
  }

  window.REDE_SOCIOLOCAL_MEDIA_DB = Object.freeze({
    salvar,
    obter,
    atualizar,
    remover,
    listar,
    limparAntigas,
    restaurarPendentes
  });
})();
