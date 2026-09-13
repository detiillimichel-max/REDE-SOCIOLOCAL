// Registro do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((err) => {
    console.error('Falha ao registrar Service Worker:', err);
  });
}

const feedContainer = document.getElementById('feed-container');
const emptyState = document.getElementById('empty-state');

// Entradas de mídia existentes no index.html.
const galleryButton = document.getElementById('gallery-button');
const galleryChoice = document.getElementById('gallery-choice');
const galleryPhotosButton = document.getElementById('gallery-photos');
const galleryVideosButton = document.getElementById('gallery-videos');
const galleryCancelButton = document.getElementById('gallery-cancel');
const galleryPhotoInput = document.getElementById('gallery-photo-input');
const galleryVideoInput = document.getElementById('gallery-video-input');
const cameraPhotoInput = document.getElementById('camera-photo-input');
const cameraVideoInput = document.getElementById('camera-video-input');

// O botão Galeria abre primeiro a escolha entre Fotos e Vídeos.
if (galleryButton && galleryChoice) {
  galleryButton.addEventListener('click', () => {
    galleryChoice.hidden = false;
  });
}

if (galleryPhotosButton && galleryPhotoInput) {
  galleryPhotosButton.addEventListener('click', () => {
    galleryChoice.hidden = true;
    galleryPhotoInput.click();
  });
}

if (galleryVideosButton && galleryVideoInput) {
  galleryVideosButton.addEventListener('click', () => {
    galleryChoice.hidden = true;
    galleryVideoInput.click();
  });
}

if (galleryCancelButton && galleryChoice) {
  galleryCancelButton.addEventListener('click', () => {
    galleryChoice.hidden = true;
  });
}

// Fecha a escolha ao tocar fora do cartão.
if (galleryChoice) {
  galleryChoice.addEventListener('click', (event) => {
    if (event.target === galleryChoice) {
      galleryChoice.hidden = true;
    }
  });
}

const mediaInputs = [
  galleryPhotoInput,
  galleryVideoInput,
  cameraPhotoInput,
  cameraVideoInput
].filter(Boolean);

mediaInputs.forEach((input) => {
  input.addEventListener('change', (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    files.forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return;
      }

      const mediaUrl = URL.createObjectURL(file);
      const postElement = createPostCard(file, mediaUrl);
      feedContainer.appendChild(postElement);
    });

    // Permite selecionar novamente o mesmo arquivo depois.
    event.target.value = '';
  });
});

function createPostCard(file, src) {
  const card = document.createElement('article');
  card.className = 'post-card';

  const isVideo = file.type.startsWith('video/');

  const header = document.createElement('div');
  header.className = 'post-header';
  header.textContent = file.name;

  let mediaElement;

  if (isVideo) {
    mediaElement = document.createElement('video');
    mediaElement.src = src;
    mediaElement.controls = true;
    mediaElement.loop = true;
    mediaElement.playsInline = true;
    mediaElement.preload = 'metadata';
  } else {
    mediaElement = document.createElement('img');
    mediaElement.src = src;
    mediaElement.alt = file.name;
    mediaElement.loading = 'lazy';
  }

  mediaElement.className = 'post-media';

  const actions = document.createElement('div');
  actions.className = 'post-actions';
  actions.innerHTML = `
    <button type="button" class="action-btn" aria-label="Curtir">♡</button>
    <button type="button" class="action-btn" aria-label="Comentar">◌</button>
    <button type="button" class="action-btn" aria-label="Compartilhar">↗</button>
  `;

  card.appendChild(header);
  card.appendChild(mediaElement);
  card.appendChild(actions);

  return card;
}
