(() => {
  'use strict';

  const input = document.getElementById('mux-video-input');
  const fileBox = document.getElementById('mux-selected-file');
  const fileName = document.getElementById('mux-file-name');
  const fileDetails = document.getElementById('mux-file-details');
  const button = document.getElementById('mux-upload-button');
  const progress = document.getElementById('mux-upload-progress');
  const progressLabel = document.getElementById('mux-progress-label');
  const status = document.getElementById('mux-upload-status');

  let selectedVideo = null;

  function setProgress(value) {
    const safe = Math.max(0, Math.min(100, Math.round(value)));
    progress.value = safe;
    progressLabel.textContent = `${safe}%`;
  }

  function setStatus(text) {
    status.textContent = text;
  }

  async function waitForAsset(uploadId) {
    for (let attempt = 0; attempt < 150; attempt += 1) {
      const response = await fetch(
        `/api/mux-upload-status?upload_id=${encodeURIComponent(uploadId)}`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível consultar o status no Mux.');
      }

      if (data.status === 'asset_created' && data.asset_id) {
        return data;
      }

      if (['errored', 'cancelled', 'timed_out'].includes(data.status)) {
        throw new Error(`O upload terminou com status: ${data.status}.`);
      }

      setStatus(`Processando no Mux… tentativa ${attempt + 1}/150`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('O Mux ainda está processando o vídeo. Consulte novamente em instantes.');
  }

  async function upload() {
    if (!selectedVideo) {
      setStatus('Escolha um vídeo antes de enviar.');
      return;
    }

    button.disabled = true;
    input.disabled = true;
    setProgress(0);
    setStatus('Preparando envio para o Mux…');

    try {
      const createResponse = await fetch('/api/mux-create-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          filename: selectedVideo.name,
          content_type: selectedVideo.type || 'video/mp4'
        })
      });

      const createData = await createResponse.json().catch(() => ({}));

      if (!createResponse.ok || !createData.uploadUrl || !createData.uploadId) {
        throw new Error(createData?.error || 'Não foi possível criar o upload no Mux.');
      }

      setStatus('Enviando vídeo diretamente para o Mux…');

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', createData.uploadUrl, true);
        xhr.setRequestHeader('Content-Type', selectedVideo.type || 'application/octet-stream');

        xhr.upload.addEventListener('progress', event => {
          if (event.lengthComputable) {
            setProgress((event.loaded / event.total) * 100);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            resolve();
          } else {
            reject(new Error(`O Mux recusou o upload (HTTP ${xhr.status}).`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Falha de rede durante o envio do vídeo.')));
        xhr.addEventListener('abort', () => reject(new Error('O envio do vídeo foi cancelado.')));
        xhr.send(selectedVideo);
      });

      setStatus('Upload concluído. Aguardando processamento do Mux…');
      const asset = await waitForAsset(createData.uploadId);

      setStatus(`Concluído. Asset Mux: ${asset.asset_id}`);
    } catch (error) {
      console.error('Erro no envio Mux:', error);
      setStatus(error?.message || 'Não foi possível concluir o envio para o Mux.');
      button.disabled = false;
      input.disabled = false;
    }
  }

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    selectedVideo = file;
    fileName.textContent = file.name;
    fileDetails.textContent = `${file.type || 'Vídeo'} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    fileBox.hidden = false;
    button.disabled = false;
    setProgress(0);
    setStatus('Vídeo preparado. Pronto para enviar ao Mux.');
  });

  button.addEventListener('click', upload);
})();
