(() => {
  'use strict';

  let blobClientPromise;

  async function obterClienteBlob() {
    if (!blobClientPromise) {
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

  async function enviarFotoParaBlob(file) {
    const { upload } = await obterClienteBlob();
    const caminho = `rede-sociolocal/${Date.now()}-${nomeSeguro(file.name)}`;

    return upload(caminho, file, {
      access: 'public',
      handleUploadUrl: '/api/blob-upload'
    });
  }

  async function criarUploadMux() {
    const response = await fetch('/api/mux-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok || !data.upload_url || !data.upload_id) {
      throw new Error(data.error || 'Não foi possível criar o upload no Mux.');
    }

    return data;
  }

  async function enviarVideoParaMux(file) {
    const upload = await criarUploadMux();

    const uploadResponse = await fetch(upload.upload_url, {
      method: 'PUT',
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error(`O Mux recusou o vídeo (HTTP ${uploadResponse.status}).`);
    }

    for (let tentativa = 0; tentativa < 30; tentativa += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `/api/mux-upload?upload_id=${encodeURIComponent(upload.upload_id)}`
      );
      const statusData = await statusResponse.json().catch(() => ({}));

      if (!statusResponse.ok || !statusData.ok) {
        throw new Error(statusData.error || 'Não foi possível consultar o processamento no Mux.');
      }

      if (statusData.ready && statusData.playback_id) {
        return statusData;
      }

      if (statusData.status === 'errored' || statusData.status === 'cancelled') {
        throw new Error(`O Mux não conseguiu processar o vídeo: ${statusData.status}.`);
      }
    }

    throw new Error('O Mux ainda está processando o vídeo. Tente novamente em alguns instantes.');
  }

  async function registrarMetadados(file, dados) {
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
        source: isVideo ? 'mux' : 'blob',
        source_url: dados.source_url || dados.storage_url || dados.url,
        storage_url: dados.storage_url || dados.url,
        thumbnail_url: dados.thumbnail_url || null,
        mux_asset_id: dados.asset_id || null,
        mux_playback_id: dados.playback_id || null,
        status: 'ready'
      })
    });

    const data = await response.json().catch(() => ({}));
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
    if (!file) {
      throw new Error('Nenhum arquivo foi selecionado.');
    }

    if (file.type.startsWith('image/')) {
      const blob = await enviarFotoParaBlob(file);
      return registrarMetadados(file, blob);
    }

    if (file.type.startsWith('video/')) {
      const mux = await enviarVideoParaMux(file);
      return registrarMetadados(file, mux);
    }

    throw new Error('Formato de arquivo não suportado.');
  }

  window.REDEMediaCloud = {
    uploadAndRegister
  };
})();
