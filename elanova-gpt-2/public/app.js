
const $ = (id) => document.getElementById(id);

const welcome = $('welcome');
const workspace = $('workspace');
const messages = $('messages');
const prompt = $('prompt');
const toast = $('toast');

const imageStudio = $('image-studio');
const imageForm = $('image-form');
const imagePrompt = $('image-prompt');
const imageResult = $('image-result');

let toastTimer;
let conversation = [];
let busy = false;
let imageBusy = false;

function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3500);
}

function closeSidebar() {
  $('sidebar').classList.remove('open');
}

function setActiveMenu(imageMode) {
  const chatButton = document.querySelector('.side-item:not([id])');
  const imageButton = $('generate-image');

  chatButton?.classList.toggle('active', !imageMode);
  imageButton.classList.toggle('active', imageMode);
}

function showChat() {
  imageStudio.classList.add('hidden');
  messages.classList.remove('hidden');
  $('composer').classList.remove('hidden');
  document.querySelector('.chat-footnote')?.classList.remove('hidden');

  setActiveMenu(false);
  closeSidebar();
  prompt.focus();
}

function showImageStudio() {
  imageStudio.classList.remove('hidden');
  messages.classList.add('hidden');
  $('composer').classList.add('hidden');
  document.querySelector('.chat-footnote')?.classList.add('hidden');

  setActiveMenu(true);
  closeSidebar();
  imagePrompt.focus();
}

function showWorkspace() {
  welcome.classList.add('hidden');
  workspace.classList.remove('hidden');
  showChat();
}

function showWelcome() {
  workspace.classList.add('hidden');
  welcome.classList.remove('hidden');
  closeSidebar();
}

$('get-started').addEventListener('click', showWorkspace);

$('login').addEventListener('click', () => {
  notify('Account login is coming soon. Select Get Started to try the chat.');
});

$('back-home').addEventListener('click', showWelcome);

$('open-menu').addEventListener('click', () => {
  $('sidebar').classList.add('open');
});

$('close-menu').addEventListener('click', closeSidebar);

$('projects').addEventListener('click', () => {
  notify('Projects will be available after account setup.');
});

$('tools').addEventListener('click', () => {
  notify('AI Tools are coming soon.');
});

$('generate-image').addEventListener('click', showImageStudio);

const chatNav = document.querySelector('.side-item:not([id])');
chatNav?.addEventListener('click', showChat);

function resetChat() {
  if (busy) {
    return notify('Please wait for the current response.');
  }

  conversation = [];

  messages.innerHTML = `
    <div class="empty-chat">
      <img src="/assets/elanova-mascot.png" alt="ELANOVA mascot">
      <h2>What can we create today?</h2>
      <p>Bring your ideas to life, one conversation at a time.</p>
      <div class="suggestions">
        <button data-prompt="Help me plan a new project">
          Plan a project &rarr;
        </button>
        <button data-prompt="Give me creative ideas for a brand">
          Explore ideas &rarr;
        </button>
        <button data-prompt="Help me write a professional introduction">
          Write something &rarr;
        </button>
      </div>
    </div>
  `;

  showChat();
}

$('new-chat').addEventListener('click', resetChat);

function addBubble(text, role) {
  const el = document.createElement('div');
  el.className = 'bubble ' + role;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

// EXISTING GEMINI CHAT
$('composer').addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = prompt.value.trim();

  if (!text || busy) return;

  if (text.length > 4000) {
    return notify('Please keep messages under 4,000 characters.');
  }

  busy = true;

  const sendButton = $('composer').querySelector('button[type="submit"]');
  sendButton.disabled = true;

  messages.querySelector('.empty-chat')?.remove();

  addBubble(text, 'user');
  prompt.value = '';

  const pending = addBubble('', 'assistant');
  pending.classList.add('thinking');

  pending.innerHTML = `
    <span class="thinking-label">ELANOVA</span>
    <span class="thinking-dots">
      <i></i><i></i><i></i>
    </span>
  `;

  const requestMessages = [
    ...conversation,
    { role: 'user', content: text }
  ].slice(-20);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: requestMessages })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Server error (${response.status})`);
    }

    if (!data.reply || typeof data.reply !== 'string') {
      throw new Error('No AI response received.');
    }

    pending.classList.remove('thinking');

    if (window.marked && window.DOMPurify) {
      pending.innerHTML = DOMPurify.sanitize(
        marked.parse(data.reply)
      );
      pending.classList.add('markdown-content');
    } else {
      pending.textContent = data.reply;
    }

    conversation = [
      ...requestMessages,
      { role: 'assistant', content: data.reply }
    ].slice(-20);

  } catch (error) {
    pending.classList.remove('thinking');
    pending.textContent = 'Connection unavailable. Please try again.';
    notify(error.message || 'Unable to connect to AI.');

  } finally {
    busy = false;
    sendButton.disabled = false;
    messages.scrollTop = messages.scrollHeight;

    if (imageStudio.classList.contains('hidden')) {
      prompt.focus();
    }
  }
});

prompt.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    $('composer').requestSubmit();
  }
});

messages.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-prompt]');

  if (btn) {
    prompt.value = btn.dataset.prompt;
    prompt.focus();
  }
});

// ELANOVA IMAGE STUDIO
imageForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const description = imagePrompt.value.trim();
  if (!description || imageBusy) return;

  imageBusy = true;

  const generateButton = imageForm.querySelector('button[type="submit"]');
  generateButton.disabled = true;
  generateButton.textContent = '✦ Creating your image...';

  imageResult.replaceChildren();

  const status = document.createElement('p');
  status.textContent = 'ELANOVA is creating your image. Please wait...';
  imageResult.appendChild(status);

  try {
    const response = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: description })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Image generation is unavailable.');
    }

    if (!data.image || typeof data.image !== 'string') {
      throw new Error('No image was returned.');
    }

    const imageUrl = data.image;

    if (
      !imageUrl.startsWith('data:image/png;base64,') &&
      !imageUrl.startsWith('data:image/jpeg;base64,') &&
      !imageUrl.startsWith('data:image/webp;base64,')
    ) {
      throw new Error('Unsupported image format.');
    }

    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = description;

    const download = document.createElement('a');
    download.href = imageUrl;
    download.download = 'elanova-created-image.png';
    download.className = 'image-download';
    download.textContent = '↓ Download Image';

    imageResult.replaceChildren(image, download);

  } catch (error) {
    imageResult.replaceChildren();

    const errorMessage = document.createElement('p');
    errorMessage.textContent = error.message || 'Unable to generate image.';
    imageResult.appendChild(errorMessage);

    notify('Image generation is not available yet.');

  } finally {
    imageBusy = false;
    generateButton.disabled = false;
    generateButton.textContent = '✦ Generate Image';
  }
});

