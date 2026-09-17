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
      if (!file) return;

      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      fileName.textContent = file.name;
      fileDetails.textContent = `${file.type || 'Vídeo'} · ${sizeMb} MB`;
      selectedFile.hidden = false;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarMuxPublisher, { once: true });
  } else {
    iniciarMuxPublisher();
  }
})();
