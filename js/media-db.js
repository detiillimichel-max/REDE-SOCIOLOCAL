(() => {
  'use strict';

  const DB_NAME = 'rede-sociolocal-media';
  const DB_VERSION = 1;
  const STORE_NAME = 'pending-media';

  function abrirBanco() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB não está disponível neste dispositivo.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Não foi possível abrir o IndexedDB.'));
    });
  }

  async function salvar(file, dados = {}) {
    if (!(file instanceof Blob)) {
      throw new TypeError('A mídia precisa ser um File ou Blob.');
    }

    const db = await abrirBanco();
    const registro = {
      id: crypto.randomUUID(),
      file,
      name: file.name || dados.name || 'midia',
      type: file.type || dados.type || 'application/octet-stream',
      size: file.size,
      createdAt: Date.now(),
      ...dados
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(registro);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Não foi possível salvar a mídia.'));
    });

    db.close();
    return registro.id;
  }

  async function obter(id) {
    const db = await abrirBanco();

    const registro = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return registro;
  }

  async function remover(id) {
    const db = await abrirBanco();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Não foi possível remover a mídia.'));
    });

    db.close();
  }

  async function listar() {
    const db = await abrirBanco();

    const registros = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return registros;
  }

  window.REDE_SOCIOLOCAL_MEDIA_DB = Object.freeze({
    salvar,
    obter,
    remover,
    listar
  });
})();
