const API_ALL    = 'https://phi-lab-server.vercel.app/api/v1/lab/issues';
const API_SEARCH = 'https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=';

if (localStorage.getItem('isLoggedIn') !== 'true') {
  window.location.href = 'login.html';
}

function logout() {
  localStorage.removeItem('isLoggedIn');
  window.location.href = 'login.html';
}

let allIssues   = [];
let activeTab   = 'all';
let searchTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchAllIssues();
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const q = searchInput.value.trim();
        q ? fetchSearchResults(q) : renderCards(getFilteredByTab());
      }, 350);
    });
  }
});

async function fetchAllIssues() {
  showSpinner();
  try {
    const res  = await fetch(API_ALL);
    const data = await res.json();
    allIssues  = Array.isArray(data) ? data : (data.data || data.issues || []);
    updateStats();
    renderCards(allIssues);
  } catch (err) {
    showError('Failed to load issues. Please try again.');
  }
}

async function fetchSearchResults(query) {
  showSpinner();
  try {
    const res   = await fetch(API_SEARCH + encodeURIComponent(query));
    const data  = await res.json();
    let results = Array.isArray(data) ? data : (data.data || data.issues || []);
    if (activeTab === 'open')   results = results.filter(i => getStatus(i) === 'open');
    if (activeTab === 'closed') results = results.filter(i => getStatus(i) === 'closed');
    renderCards(results);
  } catch (err) {
    const q = query.toLowerCase();
    const local = getFilteredByTab().filter(issue =>
      (issue.title       || '').toLowerCase().includes(q) ||
      (issue.description || '').toLowerCase().includes(q) ||
      (issue.author      || '').toLowerCase().includes(q)
    );
    renderCards(local);
  }
}

function switchTab(tab, btn) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const q = document.getElementById('searchInput')?.value.trim() || '';
  q ? fetchSearchResults(q) : renderCards(getFilteredByTab());
}

function getFilteredByTab() {
  if (activeTab === 'open')   return allIssues.filter(i => getStatus(i) === 'open');
  if (activeTab === 'closed') return allIssues.filter(i => getStatus(i) === 'closed');
  return allIssues;
}

function getStatus(issue) {
  return (issue.status || '').toLowerCase();
}

function updateStats() {
  const total  = allIssues.length;
  const open   = allIssues.filter(i => getStatus(i) === 'open').length;
  const closed = allIssues.filter(i => getStatus(i) === 'closed').length;
  const el = id => document.getElementById(id);
  if (el('issueCountText')) el('issueCountText').textContent = `${total} Issues`;
  if (el('openCount'))      el('openCount').textContent      = open;
  if (el('closedCount'))    el('closedCount').textContent    = closed;
}

function renderCards(issues) {
  const area = document.getElementById('cardsArea');
  if (!area) return;
  if (!issues.length) {
    area.innerHTML = `
      <div class="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
        <i class="fa-solid fa-inbox text-5xl"></i>
        <p class="text-sm font-medium">No issues found</p>
      </div>`;
    return;
  }
  area.innerHTML = `<div class="cards-grid">${issues.map(buildCard).join('')}</div>`;
}

function buildCard(issue) {
  const isOpen      = getStatus(issue) === 'open';
  const borderClass = isOpen ? 'card-open' : 'card-closed';
  const priority    = (issue.priority || 'MEDIUM').toUpperCase();
  const priClass    = getPriorityClass(priority);
  const labelsHTML  = buildLabels(issue.labels);
  const date        = formatDate(issue.createdAt || issue.created_at);
  const desc        = truncate(issue.description || '', 100);
  const title       = esc(issue.title || 'Untitled Issue');
  const author      = esc(issue.author || 'Unknown');
  const number      = issue.number || issue.id || '';

  const dataStr = JSON.stringify(issue)
    .replace(/'/g, "&#39;")
    .replace(/"/g, '&quot;');

  return `
  <div class="bg-white rounded-2xl shadow-sm issue-card ${borderClass}"
       onclick="openModal(JSON.parse(this.dataset.issue))"
       data-issue="${dataStr}">
    <div class="p-4 flex flex-col gap-3">

      <div class="flex items-start justify-between">
        <div class="${isOpen ? 'status-ring-open' : 'status-ring-closed'}">

          <!-- ✅ FIX 2: image path থেকে space সরানো হয়েছে -->
          <img src="${isOpen ? 'assets/Open-Status.png' : 'assets/Closed-Status.png'}"
               alt="status" class="w-4 h-4 object-contain" />
        </div>
        <span class="text-xs font-bold px-3 py-1 rounded-full ${priClass}">${priority}</span>
      </div>

      <h3 class="font-bold text-gray-900 text-sm leading-snug line-clamp-2">${title}</h3>

      <p class="text-gray-400 text-xs leading-relaxed line-clamp-3">${esc(desc)}</p>

      <div class="flex gap-1.5 flex-wrap">${labelsHTML}</div>
    </div>

    <div class="px-4 py-3 flex flex-col gap-0.5 text-xs text-gray-400"
         style="box-shadow: inset 0 1px 0 0 rgba(0,0,0,0.06);">
      <span>#${number} by ${author}</span>
      <span>${date}</span>
    </div>
  </div>`;
}

const LABEL_MAP = {
  'bug':              { icon: 'fa-solid fa-bug',       cls: 'label-bug'         },
  'help wanted':      { icon: 'fa-solid fa-life-ring', cls: 'label-help'        },
  'enhancement':      { icon: '',                      cls: 'label-enhancement' },
  'question':         { icon: '',                      cls: 'label-question'    },
  'documentation':    { icon: '',                      cls: 'label-docs'        },
  'duplicate':        { icon: '',                      cls: 'label-duplicate'   },
  'wontfix':          { icon: '',                      cls: 'label-wontfix'     },
  'invalid':          { icon: '',                      cls: 'label-invalid'     },
  'good first issue': { icon: '',                      cls: 'label-good'        },
};

function buildLabels(labels) {
  if (!labels || !labels.length) return '';
  return labels.slice(0, 3).map(lbl => {
    const name = typeof lbl === 'string' ? lbl : (lbl.name || '');
    const info = LABEL_MAP[name.toLowerCase()] || { icon: '', cls: 'label-default' };
    return `
      <span class="inline-flex items-center gap-1 text-[10px] font-bold
                   uppercase px-2.5 py-1 rounded-full ${info.cls}">
        ${info.icon ? `<i class="${info.icon}"></i>` : ''} ${esc(name)}
      </span>`;
  }).join('');
}

function openModal(issue) {
  const isOpen   = getStatus(issue) === 'open';
  const priority = (issue.priority || 'MEDIUM').toUpperCase();

  const statusBadge = document.getElementById('modalStatusBadge');
  statusBadge.textContent = isOpen ? 'Open' : 'Closed';
  statusBadge.className   = isOpen
    ? 'text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700'
    : 'text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700';

  const modalIcon = document.getElementById('modalIcon');
  if (modalIcon) {
    modalIcon.src = isOpen ? 'assets/Open-Status.png' : 'assets/CClosed- Status .png';
  }

  document.getElementById('modalHeaderLabels').innerHTML = buildLabels(issue.labels);
  document.getElementById('modalTitle').textContent      = issue.title || 'Untitled Issue';
  document.getElementById('modalMeta').textContent       = `Opened by ${issue.author || 'Unknown'} • ${formatDate(issue.createdAt || issue.created_at)}`;
  document.getElementById('modalDesc').textContent       = issue.description || 'No description provided.';
  document.getElementById('modalAuthor').textContent     = issue.author || 'Unknown';

  const priBadge = document.getElementById('modalPriorityBadge');
  priBadge.textContent = priority;
  priBadge.className   = `text-xs font-bold px-3 py-1 rounded-full inline-block ${getPriorityClass(priority)}`;

  document.getElementById('modalBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOnBackdrop(e) {
  if (e.target === document.getElementById('modalBackdrop')) closeModal();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function getPriorityClass(p) {
  if (p === 'HIGH') return 'priority-high';
  if (p === 'LOW')  return 'priority-low';
  return 'priority-medium';
}

function showSpinner() {
  const area = document.getElementById('cardsArea');
  if (area) area.innerHTML = `
    <div class="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-indigo-400"></i>
      <span class="text-sm">Loading issues…</span>
    </div>`;
}

function showError(msg) {
  const area = document.getElementById('cardsArea');
  if (area) area.innerHTML = `
    <div class="flex flex-col items-center justify-center py-24 gap-3">
      <i class="fa-solid fa-triangle-exclamation text-4xl text-red-300"></i>
      <p class="text-sm text-gray-400 font-medium">${msg}</p>
      <button onclick="fetchAllIssues()"
              class="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm
                     font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function esc(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}