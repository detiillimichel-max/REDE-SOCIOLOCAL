(() => {
  'use strict';

  function iniciarMuxPublisher() {
    const openButton = document.getElementById('mux-publish-button');
    const modal = document.getElementById('mux-publish-modal');
    const closeButton = document.getElementById('mux-modal-close');
    const fileInput = document.getElementById('mux-video-input');
    const fileName = document.getElementById('mux-file-name');
    const fileDetails = document.getElementById('mux-file-details');
    const selectedFile = document.getElementById('mux-selected-file');

    if (!openButton || !modal || !closeButton || !fileInput) return;

    let selectedVideo = null;

    function abrirModal() {
      modal.hidden = false;
      document.body.classList.add('mux-modal-open');
      openButton.setAttribute('aria-expanded', 'true');
    }

    function fecharModal() {
      modal.hidden = true;
      document.body.classList.remove('mux-modal-open');
      openButton.setAttribute('aria-expanded', 'false');
    }

    function obterBotaoEnvio() {
      return modal.querySelector('[data-mux-upload], #mux-upload-button, .mux-upload-button');
    }

    function obterStatusElemento() {
      return modal.querySelector('[data-mux-status], #mux-upload-status, .mux-upload-status');
    }

    function obterProgressoElemento() {
      return modal.querySelector('[data-mux-progress], #mux-upload-progress, .mux-upload-progress');
    }

    function atualizarStatus(texto) {
      const status = obterStatusElemento();
      if (status) status.textContent = texto;
    }

    function atualizarProgresso(percentual) {
      const valor = Math.max(0, Math.min(100, Math.round(percentual)));
      const progress = obterProgressoElemento();
      const label = document.getElementById('mux-upload-progress-label');

      if (progress) {
        progress.value = valor;
        progress.setAttribute('aria-valuenow', String(valor));
      }
      if (label) label.textContent = `${valor}%`;
    }

    function selecionarVideo(file, origem = 'Mux') {
      if (!file || !file.type.startsWith('video/')) return;

      selectedVideo = file;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      fileName.textContent = file.name;
      fileDetails.textContent = `${file.type || 'Vídeo'} · ${sizeMb} MB · ${origem}`;
      selectedFile.hidden = false;
      atualizarProgresso(0);
      atualizarStatus('Vídeo preparado. Pronto para enviar ao Mux.');

      const uploadButton = obterBotaoEnvio();
      if (uploadButton) uploadButton.disabled = false;
      abrirModal();
    }

    window.REDEMuxSelectVideo = selecionarVideo;

    function aguardarAsset(uploadId) {
      return new Promise((resolve, reject) => {
        let tentativas = 0;
        const maxTentativas = 150;

        const consultar = async () => {
          tentativas += 1;

          try {
            const response = await fetch(
              `/api/mux-upload-status?upload_id=${encodeURIComponent(uploadId)}`,
              { method: 'GET', headers: { Accept: 'application/json' } }
            );
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
              throw new Error(data?.error || 'Não foi possível consultar o status no Mux.');
            }

            if (data.status === 'asset_created' && data.asset_id) {
              atualizarStatus('Vídeo recebido pelo Mux. Preparando o processamento…');
              resolve(data);
              return;
            }

            if (['errored', 'cancelled', 'timed_out'].includes(data.status)) {
              reject(new Error(`O upload terminou com status: ${data.status}.`));
              return;
            }

            if (tentativas >= maxTentativas) {
              reject(new Error('O Mux ainda está processando o vídeo. Tente consultar novamente em instantes.'));
              return;
            }

            atualizarStatus('Enviando vídeo para processamento…');
            window.setTimeout(consultar, 2000);
          } catch (error) {
            reject(error);
          }
        };

        consultar();
      });
    }

    async function enviarParaMux() {
      if (!selectedVideo) {
        atualizarStatus('Escolha um vídeo antes de enviar.');
        return;
      }

      const uploadButton = obterBotaoEnvio();
      if (uploadButton) uploadButton.disabled = true;
      fileInput.disabled = true;
      atualizarProgresso(0);
      atualizarStatus('Preparando envio para o Mux…');

      try {
        const createResponse = await fetch('/api/mux-create-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            filename: selectedVideo.name,
            content_type: selectedVideo.type || 'video/mp4'
          })
        });

        const createData = await createResponse.json().catch(() => ({}));

        if (!createResponse.ok || !createData.uploadUrl || !createData.uploadId) {
          throw new Error(createData?.error || 'Não foi possível preparar o upload no Mux.');
        }

        atualizarStatus('Enviando vídeo para o Mux…');

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', createData.uploadUrl, true);
          xhr.setRequestHeader('Content-Type', selectedVideo.type || 'application/octet-stream');

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              atualizarProgresso((event.loaded / event.total) * 100);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              atualizarProgresso(100);
              resolve();
            } else {
              reject(new Error(`O Mux recusou o upload (HTTP ${xhr.status}).`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Falha de rede durante o envio do vídeo.')));
          xhr.addEventListener('abort', () => reject(new Error('O envio do vídeo foi cancelado.')));
          xhr.send(selectedVideo);
        });

        atualizarStatus('Upload concluído. Aguardando o processamento do Mux…');
        await aguardarAsset(createData.uploadId);

        atualizarStatus('Vídeo recebido e registrado no Mux. Etapa 2 concluída.');
      } catch (error) {
        console.error('Erro no envio Mux:', error);
        atualizarStatus(error?.message || 'Não foi possível concluir o envio para o Mux.');
        if (uploadButton) uploadButton.disabled = false;
        fileInput.disabled = false;
      }
    }

    openButton.addEventListener('click', abrirModal);
    closeButton.addEventListener('click', fecharModal);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) fecharModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) fecharModal();
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) selecionarVideo(file, 'Mux');
    });

    const uploadButton = obterBotaoEnvio();
    if (uploadButton) uploadButton.addEventListener('click', enviarParaMux);
  }

  function iniciarRoteamentoDeVideos() {
    const videoButtons = ['gallery-video-button', 'camera-video-button'];

    document.addEventListener('click', (event) => {
      const button = event.target.closest?.('#gallery-video-button, #camera-video-button');
      if (!button) return;

      const inputId = button.id === 'camera-video-button'
        ? 'camera-video-input'
        : 'gallery-video-input';
      const input = document.getElementById(inputId);
      if (!input) return;

      event.preventDefault();
      event.stopPropagation();
      input.click();
    }, true);

    document.addEventListener('change', (event) => {
      const input = event.target;
      if (!input || !videoButtons.some((id) => input.id === id.replace('-button', '-input'))) return;

      const file = input.files?.[0];
      if (!file) return;

      event.stopPropagation();
      if (typeof window.REDEMuxSelectVideo === 'function') {
        const origem = input.id === 'camera-video-input' ? 'Câmera' : 'Galeria';
        window.REDEMuxSelectVideo(file, origem);
      }
      input.value = '';
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      iniciarMuxPublisher();
      iniciarRoteamentoDeVideos();
    }, { once: true });
  } else {
    iniciarMuxPublisher();
    iniciarRoteamentoDeVideos();
  }
})();
