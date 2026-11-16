const $ = (id) => document.getElementById(id);
const welcome = $('welcome');
const workspace = $('workspace');
const messages = $('messages');
const prompt = $('prompt');
const toast = $('toast');
let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),3500)}
function showWorkspace(){welcome.classList.add('hidden');workspace.classList.remove('hidden');prompt.focus()}
function showWelcome(){workspace.classList.add('hidden');welcome.classList.remove('hidden');$('sidebar').classList.remove('open')}
$('get-started').addEventListener('click',showWorkspace);
$('login').addEventListener('click',()=>notify('Account login will be added in the next phase. Try Get Started for a preview.'));
$('back-home').addEventListener('click',showWelcome);
$('open-menu').addEventListener('click',()=>$('sidebar').classList.add('open'));
$('close-menu').addEventListener('click',()=>$('sidebar').classList.remove('open'));
$('projects').addEventListener('click',()=>notify('Projects will be available after account setup.'));
$('tools').addEventListener('click',()=>notify('AI Tools are planned for a future update.'));
function resetChat(){messages.innerHTML='<div class="empty-chat"><img src="/assets/elanova-mascot.png" alt="ÉLANOVA mascot"><h2>What can we create today?</h2><p>Bring your ideas to life, one conversation at a time.</p><div class="suggestions"><button data-prompt="Help me plan a new project">Plan a project ↗</button><button data-prompt="Give me creative ideas for a brand">Explore ideas ↗</button><button data-prompt="Help me write a professional introduction">Write something ↗</button></div></div>';$('sidebar').classList.remove('open');prompt.focus()}
$('new-chat').addEventListener('click',resetChat);
function addBubble(text,role){const el=document.createElement('div');el.className='bubble '+role;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight}
$('composer').addEventListener('submit',(event)=>{event.preventDefault();const text=prompt.value.trim();if(!text)return;const empty=messages.querySelector('.empty-chat');if(empty)empty.remove();addBubble(text,'user');prompt.value='';addBubble('This is the ÉLANOVA.GPT interface preview. AI replies are not connected yet. The next step is to configure a secure AI backend.','assistant')});
prompt.addEventListener('keydown',(event)=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();$('composer').requestSubmit()}});
messages.addEventListener('click',(event)=>{const btn=event.target.closest('[data-prompt]');if(btn){prompt.value=btn.dataset.prompt;prompt.focus()}});
