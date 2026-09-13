// Registro do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((err) => {
    console.error('Falha ao registrar Service Worker:', err);
  });
}

const mediaInput = document.getElementById('media-input');
const feedContainer = document.getElementById('feed-container');
const emptyState = document.getElementById('empty-state');

mediaInput.addEventListener('change', (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  if (emptyState) {
    emptyState.style.display = 'none';
  }

  files.forEach((file) => {
    const mediaUrl = URL.createObjectURL(file);
    const postElement = createPostCard(file, mediaUrl);
    feedContainer.appendChild(postElement);
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
    mediaElement.className = 'post-media';
    mediaElement.controls = true;
    mediaElement.loop = true;
    mediaElement.playsInline = true;
  } else {
    mediaElement = document.createElement('img');
    mediaElement.src = src;
    mediaElement.className = 'post-media';
    mediaElement.alt = file.name;
  }

  const actions = document.createElement('div');
  actions.className = 'post-actions';
  actions.innerHTML = `
    <span class="action-btn">❤️</span>
    <span class="action-btn">💬</span>
    <span class="action-btn">✈️</span>
  `;

  card.appendChild(header);
  card.appendChild(mediaElement);
  card.appendChild(actions);

  return card;
}

