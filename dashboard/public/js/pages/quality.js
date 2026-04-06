App.register('quality', async (root) => {
  root.appendChild(el('h1', { textContent: 'Quality Gate' }));

  try {
    const data = await api('/quality');
    const summary = data.summary || {};
    const results = data.results || [];

    const passed = summary.passed || 0;
    const failed = summary.failed || 0;
    const total = summary.total || (passed + failed);
    const pct = total ? Math.round((passed / total) * 100) : 0;

    // Donut chart
    const donutContainer = el('div', { className: 'donut-container' });
    const donut = el('div', { className: 'donut' });
    donut.style.background = `conic-gradient(var(--success) 0% ${pct}%, var(--error) ${pct}% 100%)`;
    const center = el('div', { className: 'donut-center' }, [
      el('div', { className: 'pct', textContent: pct + '%' }),
      el('div', { className: 'lbl', textContent: 'Pass Rate' }),
    ]);
    donut.appendChild(center);

    const legend = el('div', { className: 'donut-legend' }, [
      el('div', {}, [el('span', { className: 'legend-dot', style: 'background:var(--success)' }), document.createTextNode(`Passed: ${passed}`)]),
      el('div', {}, [el('span', { className: 'legend-dot', style: 'background:var(--error)' }), document.createTextNode(`Failed: ${failed}`)]),
      el('div', {}, [el('span', { className: 'legend-dot', style: 'background:var(--text-secondary)' }), document.createTextNode(`Total: ${total}`)]),
    ]);

    donutContainer.append(donut, legend);
    root.appendChild(donutContainer);

    // Results table
    if (results.length) {
      const table = el('table');
      table.appendChild(el('thead', {}, [
        el('tr', {}, [
          el('th', { textContent: 'Script ID' }),
          el('th', { textContent: 'Format' }),
          el('th', { textContent: 'Verdict' }),
          el('th', { textContent: 'Violations' }),
          el('th', { textContent: 'Suggestions' }),
        ]),
      ]));
      const tbody = el('tbody');
      results.forEach(r => {
        tbody.appendChild(el('tr', {}, [
          el('td', { textContent: r.script_id || r.id || '—' }),
          el('td', {}, [badge(r.format || '—', 'format')]),
          el('td', {}, [badge(r.verdict || '—', r.verdict === 'PASS' ? 'pass' : 'fail')]),
          el('td', { textContent: (r.violations || []).join(', ') || '—' }),
          el('td', { textContent: (r.suggestions || r.fix_suggestions || []).join('; ') || '—' }),
        ]));
      });
      table.appendChild(tbody);
      root.appendChild(table);
    }

    root.appendChild(el('div', { className: 'btn-row' }, [
      el('button', { className: 'btn btn-primary', textContent: 'Run Quality Gate', onClick: () => showRunModal('quality', 'Quality Gate') }),
    ]));

  } catch (err) {
    root.appendChild(emptyState('No Quality Report', err.message));
    root.appendChild(el('div', { style: 'text-align:center;margin-top:16px' }, [
      el('button', { className: 'btn btn-primary', textContent: 'Run Quality Gate', onClick: () => showRunModal('quality', 'Quality Gate') }),
    ]));
  }
});
