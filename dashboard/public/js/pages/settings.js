App.register('settings', async (root) => {
  root.appendChild(el('h1', { textContent: 'Settings' }));

  // API Key Status
  root.appendChild(el('h2', { textContent: 'API Key Status' }));
  const keyGrid = el('div', { className: 'key-grid' });
  root.appendChild(keyGrid);

  try {
    const status = await api('/status');
    const keys = status.envKeys || {};
    Object.entries(keys).forEach(([key, ok]) => {
      keyGrid.appendChild(el('div', { className: 'key-item' }, [
        el('span', { className: 'key-dot', style: `background:${ok ? 'var(--success)' : 'var(--error)'}` }),
        document.createTextNode(key),
      ]));
    });
  } catch { keyGrid.appendChild(el('div', { textContent: 'Could not load status' })); }

  // Format Configuration
  root.appendChild(el('h2', { textContent: 'Format Configuration', style: 'margin-top:30px' }));
  const formatSection = el('div', { className: 'config-section' });
  root.appendChild(formatSection);

  try {
    const formats = await api('/config/formats');
    const formatList = formats.formats || formats;

    if (Array.isArray(formatList)) {
      formatList.forEach(fmt => {
        const row = el('div', { className: 'toggle-row' }, [
          el('div', { className: 'toggle-info' }, [
            el('strong', { textContent: fmt.name || fmt.id || '—' }),
            fmt.tier ? badge('Tier ' + fmt.tier, 'tier') : null,
          ].filter(Boolean)),
          el('label', { className: 'toggle' }, [
            (() => {
              const input = document.createElement('input');
              input.type = 'checkbox';
              input.checked = fmt.enabled !== false;
              input.addEventListener('change', () => {
                fmt.enabled = input.checked;
              });
              return input;
            })(),
            el('span', { className: 'slider' }),
          ]),
        ]);
        formatSection.appendChild(row);
      });

      const saveBtn = el('button', { className: 'btn btn-primary', style: 'margin-top:12px', textContent: 'Save Formats', onClick: async () => {
        try {
          const res = await fetch('/api/config/formats', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formats),
          });
          const result = await res.json();
          saveBtn.textContent = result.ok ? 'Saved!' : 'Error';
          setTimeout(() => saveBtn.textContent = 'Save Formats', 2000);
        } catch (e) { saveBtn.textContent = 'Error: ' + e.message; }
      }});
      formatSection.appendChild(saveBtn);
    } else {
      formatSection.appendChild(el('div', { textContent: 'Format config not in expected format.' }));
    }
  } catch (err) {
    formatSection.appendChild(el('div', { textContent: 'No format config: ' + err.message }));
  }

  // Research Config - Competitor URLs
  root.appendChild(el('h2', { textContent: 'Competitor URLs', style: 'margin-top:30px' }));
  const researchSection = el('div', { className: 'config-section' });
  root.appendChild(researchSection);

  try {
    const config = await api('/config/research-config');
    const urls = config.competitor_urls || config.competitors || [];

    const textarea = el('textarea', {
      style: 'min-height:150px',
      value: '',
    });
    textarea.value = (Array.isArray(urls) ? urls : Object.values(urls)).join('\n');
    researchSection.appendChild(textarea);

    const saveResBtn = el('button', { className: 'btn btn-primary', style: 'margin-top:8px', textContent: 'Save URLs', onClick: async () => {
      const newUrls = textarea.value.split('\n').map(u => u.trim()).filter(Boolean);
      config.competitor_urls = newUrls;
      if (config.competitors) config.competitors = newUrls;
      try {
        const res = await fetch('/api/config/research-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        const result = await res.json();
        saveResBtn.textContent = result.ok ? 'Saved!' : 'Error';
        setTimeout(() => saveResBtn.textContent = 'Save URLs', 2000);
      } catch (e) { saveResBtn.textContent = 'Error'; }
    }});
    researchSection.appendChild(saveResBtn);
  } catch (err) {
    researchSection.appendChild(el('div', { textContent: 'No research config: ' + err.message }));
  }

  // Publish Config
  root.appendChild(el('h2', { textContent: 'Publish Schedule', style: 'margin-top:30px' }));
  const pubSection = el('div', { className: 'config-section' });
  root.appendChild(pubSection);

  try {
    const config = await api('/config/publish-config');
    const textarea = el('textarea', { style: 'min-height:200px' });
    textarea.value = JSON.stringify(config, null, 2);
    pubSection.appendChild(textarea);

    const savePubBtn = el('button', { className: 'btn btn-primary', style: 'margin-top:8px', textContent: 'Save Config', onClick: async () => {
      try {
        const parsed = JSON.parse(textarea.value);
        const res = await fetch('/api/config/publish-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });
        const result = await res.json();
        savePubBtn.textContent = result.ok ? 'Saved!' : 'Error';
        setTimeout(() => savePubBtn.textContent = 'Save Config', 2000);
      } catch (e) { savePubBtn.textContent = 'Invalid JSON'; setTimeout(() => savePubBtn.textContent = 'Save Config', 2000); }
    }});
    pubSection.appendChild(savePubBtn);
  } catch (err) {
    pubSection.appendChild(el('div', { textContent: 'No publish config: ' + err.message }));
  }
});
