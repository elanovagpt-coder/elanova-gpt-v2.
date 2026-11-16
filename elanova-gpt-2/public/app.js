const $ = (id) => document.getElementById(id);
const welcome = $('welcome');
const workspace = $('workspace');
const messages = $('messages');
const prompt = $('prompt');
const toast = $('toast');
let toastTimer;
let conversation = [];
let busy = false;

function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}
function showWorkspace() {
  welcome.classList.add('hidden');
  workspace.classList.remove('hidden');
  prompt.focus();
}
function showWelcome() {
  workspace.classList.add('hidden');
  welcome.classList.remove('hidden');
  $('sidebar').classList.remove('open');
}
$('get-started').addEventListener('click', showWorkspace);
$('login').addEventListener('click', () => notify('Account login is coming soon. Select Get Started to try the chat.'));
$('back-home').addEventListener('click', showWelcome);
$('open-menu').addEventListener('click', () => $('sidebar').classList.add('open'));
$('close-menu').addEventListener('click', () => $('sidebar').classList.remove('open'));
$('projects').addEventListener('click', () => notify('Projects will be available after account setup.'));
$('tools').addEventListener('click', () => notify('AI Tools are planned for a future update.'));

function resetChat() {
  if (busy) return notify('Please wait for the current response.');
  conversation = [];
 messages.innerHTML = document.querySelector('#messages').dataset.emptyHtml || `
  <div class="empty-chat">
    <img src="/assets/elanova-mascot.png" alt="ELANOVA mascot">
    <h2>What can we create today?</h2>
    <p>Bring your ideas to life, one conversation at a time.</p>
    <div class="suggestions">
      <button data-prompt="Help me plan a new project">Plan a project ↗</button>
      <button data-prompt="Give me creative ideas for a brand">Explore ideas ↗</button>
      <button data-prompt="Help me write a professional introduction">Write something ↗</button>
    </div>
  </div>
`;<img src="/assets/elanova-mascot.png" alt="Ã‰LANOVA mascot"><h2>What can we create today?</h2><p>Bring your ideas to life, one conversation at a time.</p><div class="suggestions"><button data-prompt="Help me plan a new project">Plan a project â†—</button><button data-prompt="Give me creative ideas for a brand">Explore ideas â†—</button><button data-prompt="Help me write a professional introduction">Write something â†—</button></div></div>';
  $('sidebar').classList.remove('open');
  prompt.focus();
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
$('composer').addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = prompt.value.trim();
  if (!text || busy) return;
  if (text.length > 4000) return notify('Please keep messages under 4,000 characters.');
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

  const requestMessages = [...conversation, { role: 'user', content: text }].slice(-20);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: requestMessages })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);
    if (!data.reply || typeof data.reply !== 'string') throw new Error('No AI response received.');
   pending.classList.remove('thinking');


if (window.marked && window.DOMPurify) {
  pending.innerHTML = DOMPurify.sanitize(
    marked.parse(data.reply)
  );
  pending.classList.add('markdown-content');
} else {
  pending.textContent = data.reply;
}
    conversation = [...requestMessages, { role: 'assistant', content: data.reply }].slice(-20);
  } catch (error) {
    pending.textContent = 'Connection unavailable. Please try again.';
    notify(error.message || 'Unable to connect to AI.');
  } finally {
    busy = false;
    sendButton.disabled = false;
    messages.scrollTop = messages.scrollHeight;
    prompt.focus();
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
