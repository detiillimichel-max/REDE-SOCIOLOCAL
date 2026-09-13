// Registro do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((err) => {
    console.error('Falha ao registrar Service Worker:', err);
  });
}

const feedContainer = document.getElementById('feed-container');
const emptyState = document.getElementById('empty-state');

const mediaInputs = [
  document.getElementById('gallery-input'),
  document.getElementById('camera-photo-input'),
  document.getElementById('camera-video-input')
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
