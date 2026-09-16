(() => {
  'use strict';

  let blobClientPromise;

  async function obterClienteBlob() {
    if (!blobClientPromise) {
      // Mantém a versão do cliente alinhada com a versão usada no backend.
      blobClientPromise = import('https://esm.sh/@vercel/blob@2.6.1/client');
    }
    return blobClientPromise;
  }

  function nomeSeguro(nome) {
    return nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'media';
  }

  async function enviarParaBlob(file) {
    const { upload } = await obterClienteBlob();
    const caminho = `rede-sociolocal/${Date.now()}-${nomeSeguro(file.name)}`;

    return upload(caminho, file, {
      access: 'public',
      handleUploadUrl: '/api/blob-upload'
    });
  }

  async function registrarMetadados(file, blob) {
    const isVideo = file.type.startsWith('video/');
    const duration = await obterDuracao(file, isVideo);

    const response = await fetch('/api/media-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: isVideo ? 'video' : 'image',
        title: file.name,
        description: null,
        category: isVideo ? 'video' : 'foto',
        duration_seconds: duration,
        source: 'blob',
        source_url: blob.url,
        storage_url: blob.url,
        thumbnail_url: null,
        status: 'ready'
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Falha ao registrar os metadados no Neon.');
    }

    return data.media;
  }

  function obterDuracao(file, isVideo) {
    if (!isVideo) return Promise.resolve(null);

    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      video.src = url;
    });
  }

  async function uploadAndRegister(file) {
    const blob = await enviarParaBlob(file);
    return registrarMetadados(file, blob);
  }

  window.REDEMediaCloud = {
    uploadAndRegister
  };
})();
