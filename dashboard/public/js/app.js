const App = {
  routes: {},
  currentPage: null,

  register(name, renderFn) {
    this.routes[name] = renderFn;
  },

  init() {
    window.addEventListener('hashchange', () => this.navigate());
    this.navigate();
  },

  navigate() {
    const hash = location.hash.slice(2) || '';
    const page = hash.split('/')[0] || 'overview';
    const el = document.getElementById('app');

    document.querySelectorAll('.sidebar a').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });

    if (this.routes[page]) {
      this.currentPage = page;
      el.innerHTML = '';
      this.routes[page](el);
    } else {
      el.innerHTML = '<div class="empty"><h3>Page not found</h3></div>';
    }
  },
};

// --- Utilities ---

async function api(path) {
  const res = await fetch('/api' + path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function truncate(str, len = 120) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') node.className = v;
    else if (k === 'textContent') node.textContent = v;
    else if (k === 'innerHTML') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const c of Array.isArray(children) ? children : [children]) {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  }
  return node;
}

function statCard(label, value, sub = '') {
  return el('div', { className: 'stat-card' }, [
    el('div', { className: 'label', textContent: label }),
    el('div', { className: 'value', textContent: value }),
    sub ? el('div', { className: 'sub', textContent: sub }) : null,
  ].filter(Boolean));
}

function badge(text, type) {
  return el('span', { className: `badge badge-${type}`, textContent: text });
}

function emptyState(title, msg) {
  return el('div', { className: 'empty' }, [
    el('h3', { textContent: title }),
    el('p', { textContent: msg }),
  ]);
}

function runPhase(phase, logContainer) {
  return new Promise((resolve) => {
    logContainer.innerHTML = '';
    const source = new EventSource('/api/run/' + phase);

    source.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'done') {
        const cls = data.code === 0 ? 'done-success' : 'done-fail';
        const msg = data.code === 0 ? 'DONE (success)' : `DONE (exit code ${data.code})`;
        logContainer.appendChild(el('div', { className: cls, textContent: msg }));
        source.close();
        resolve(data.code);
      } else {
        const cls = data.type === 'stderr' ? 'stderr' : '';
        logContainer.appendChild(el('div', { className: cls, textContent: data.text }));
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    };

    source.onerror = () => {
      logContainer.appendChild(el('div', { className: 'done-fail', textContent: 'Connection lost' }));
      source.close();
      resolve(1);
    };
  });
}

function showRunModal(phase, phaseName) {
  const overlay = el('div', { className: 'modal-overlay' });
  const modal = el('div', { className: 'modal' }, [
    el('div', { className: 'modal-header' }, [
      el('span', { textContent: `Running: ${phaseName}` }),
      el('button', { className: 'modal-close', textContent: '×', onClick: () => overlay.remove() }),
    ]),
    el('div', { className: 'modal-body' }, [
      el('div', { className: 'run-log', id: 'run-log' }),
    ]),
  ]);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const log = document.getElementById('run-log');
  runPhase(phase, log).then(() => {
    setTimeout(() => App.navigate(), 1000);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
