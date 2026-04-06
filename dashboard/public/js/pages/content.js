App.register('content', async (root) => {
  root.appendChild(el('h1', { textContent: 'Content Browser' }));

  const tabs = el('div', { className: 'tabs' });
  const tabScripts = el('div', { className: 'tab active', textContent: 'Ad Scripts' });
  const tabContent = el('div', { className: 'tab', textContent: 'Long-Form Content' });
  tabs.append(tabScripts, tabContent);
  root.appendChild(tabs);

  const container = el('div');
  root.appendChild(container);

  let currentTab = 'scripts';

  tabScripts.addEventListener('click', () => { currentTab = 'scripts'; tabScripts.classList.add('active'); tabContent.classList.remove('active'); loadScripts(); });
  tabContent.addEventListener('click', () => { currentTab = 'content'; tabContent.classList.add('active'); tabScripts.classList.remove('active'); loadContent(); });

  let scriptPage = 1;
  let scriptFormat = '';
  let scriptIcp = '';

  async function loadScripts() {
    container.innerHTML = '';
    try {
      const params = new URLSearchParams({ page: scriptPage, limit: 20 });
      if (scriptFormat) params.set('format', scriptFormat);
      if (scriptIcp) params.set('icp', scriptIcp);

      const data = await api('/scripts?' + params);
      const scripts = data.scripts || [];

      const filters = el('div', { className: 'filters' });
      const fmtSelect = el('select', {}, [
        el('option', { value: '', textContent: 'All Formats' }),
        ...(data.formats_used || []).map(f => {
          const opt = el('option', { value: f, textContent: f });
          if (f === scriptFormat) opt.selected = true;
          return opt;
        }),
      ]);
      const icpSelect = el('select', {}, [
        el('option', { value: '', textContent: 'All ICPs' }),
        ...(data.icps_used || []).map(f => {
          const opt = el('option', { value: f, textContent: truncate(f, 40) });
          if (f === scriptIcp) opt.selected = true;
          return opt;
        }),
      ]);
      const countLabel = el('span', { className: 'badge badge-format', textContent: `${data.total} scripts` });
      filters.append(fmtSelect, icpSelect, countLabel);
      container.appendChild(filters);

      fmtSelect.addEventListener('change', () => { scriptFormat = fmtSelect.value; scriptPage = 1; loadScripts(); });
      icpSelect.addEventListener('change', () => { scriptIcp = icpSelect.value; scriptPage = 1; loadScripts(); });

      if (!scripts.length) {
        container.appendChild(emptyState('No Scripts', 'No scripts match the current filters.'));
        return;
      }

      const grid = el('div', { className: 'card-grid' });
      scripts.forEach(s => {
        const card = el('div', { className: 'card' }, [
          el('div', { className: 'card-header' }, [
            badge(s.format || '—', 'format'),
            s.quality_verdict ? badge(s.quality_verdict, s.quality_verdict === 'PASS' ? 'pass' : 'fail') : null,
          ].filter(Boolean)),
          el('div', { className: 'card-hook', textContent: s.hook || s.script?.hook || truncate(JSON.stringify(s.script || s), 200) }),
          el('div', { className: 'card-meta' }, [
            el('span', { textContent: 'ICP: ' + truncate(s.icp || '—', 30) }),
            s.titan_agents ? el('span', { textContent: 'Titans: ' + (Array.isArray(s.titan_agents) ? s.titan_agents.join(', ') : s.titan_agents) }) : null,
          ].filter(Boolean)),
        ]);

        card.addEventListener('click', () => showScriptModal(s));
        grid.appendChild(card);
      });
      container.appendChild(grid);

      if (data.pages > 1) {
        const pag = el('div', { className: 'pagination' });
        const prev = el('button', { textContent: '← Prev', disabled: scriptPage <= 1 });
        prev.addEventListener('click', () => { if (scriptPage > 1) { scriptPage--; loadScripts(); } });
        const info = el('span', { textContent: `Page ${data.page} of ${data.pages}`, style: 'padding:6px 12px;font-size:12px;color:var(--text-secondary)' });
        const next = el('button', { textContent: 'Next →', disabled: scriptPage >= data.pages });
        next.addEventListener('click', () => { if (scriptPage < data.pages) { scriptPage++; loadScripts(); } });
        pag.append(prev, info, next);
        container.appendChild(pag);
      }

    } catch (err) {
      container.appendChild(emptyState('No Scripts', err.message));
    }
  }

  function showScriptModal(s) {
    const overlay = el('div', { className: 'modal-overlay' });
    const content = typeof s.script === 'object' ? JSON.stringify(s.script, null, 2) : (s.script || JSON.stringify(s, null, 2));
    const modal = el('div', { className: 'modal' }, [
      el('div', { className: 'modal-header' }, [
        el('span', {}, [
          badge(s.format || '', 'format'),
          document.createTextNode(' ' + (s.id || '')),
        ]),
        el('button', { className: 'modal-close', textContent: '×', onClick: () => overlay.remove() }),
      ]),
      el('div', { className: 'modal-body' }, [
        el('pre', { style: 'white-space:pre-wrap;font-size:13px;line-height:1.6', textContent: content }),
      ]),
    ]);
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  async function loadContent() {
    container.innerHTML = '';
    try {
      const data = await api('/content');
      const formats = data.formats || {};
      const formatNames = Object.keys(formats);

      if (!formatNames.length) {
        container.appendChild(emptyState('No Content', 'Run content generation to create long-form content.'));
        return;
      }

      for (const fmt of formatNames) {
        container.appendChild(el('h2', { textContent: fmt.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ` (${formats[fmt].length})` }));
        const grid = el('div', { className: 'card-grid' });
        for (const file of formats[fmt]) {
          const card = el('div', { className: 'card' }, [
            el('div', { className: 'card-header' }, [badge(fmt, 'format')]),
            el('div', { className: 'card-hook', textContent: file.replace('.md', '').replace(/-/g, ' ') }),
          ]);
          card.addEventListener('click', async () => {
            const res = await fetch(`/api/content/${fmt}/${file}`);
            const text = await res.text();
            const overlay = el('div', { className: 'modal-overlay' });
            const modal = el('div', { className: 'modal' }, [
              el('div', { className: 'modal-header' }, [
                el('span', { textContent: file }),
                el('button', { className: 'modal-close', textContent: '×', onClick: () => overlay.remove() }),
              ]),
              el('div', { className: 'modal-body' }, [
                el('pre', { style: 'white-space:pre-wrap;font-size:13px;line-height:1.6', textContent: text }),
              ]),
            ]);
            overlay.appendChild(modal);
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
            document.body.appendChild(overlay);
          });
          grid.appendChild(card);
        }
        container.appendChild(grid);
      }
    } catch (err) {
      container.appendChild(emptyState('No Content', err.message));
    }
  }

  loadScripts();
});
