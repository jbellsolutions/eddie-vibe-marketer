App.register('performance', async (root) => {
  root.appendChild(el('h1', { textContent: 'Performance & Learning' }));

  try {
    const data = await api('/performance');

    // Winning patterns - bar charts
    const patterns = data.winning_patterns || data.patterns || {};
    if (patterns.formats || patterns.by_format) {
      root.appendChild(el('h2', { textContent: 'Top Formats' }));
      const items = patterns.formats || patterns.by_format || {};
      root.appendChild(buildBarChart(items));
    }

    if (patterns.icps || patterns.by_icp) {
      root.appendChild(el('h2', { textContent: 'Top ICPs' }));
      const items = patterns.icps || patterns.by_icp || {};
      root.appendChild(buildBarChart(items));
    }

    if (patterns.platforms || patterns.by_platform) {
      root.appendChild(el('h2', { textContent: 'Top Platforms' }));
      const items = patterns.platforms || patterns.by_platform || {};
      root.appendChild(buildBarChart(items));
    }

    // Top performers table
    const performers = data.top_performers || [];
    if (performers.length) {
      root.appendChild(el('h2', { textContent: 'Top Performers' }));
      const table = el('table');
      table.appendChild(el('thead', {}, [
        el('tr', {}, [
          el('th', { textContent: 'Name' }),
          el('th', { textContent: 'Format' }),
          el('th', { textContent: 'CPA' }),
          el('th', { textContent: 'ROAS' }),
          el('th', { textContent: 'Installs' }),
        ]),
      ]));
      const tbody = el('tbody');
      performers.forEach(p => {
        tbody.appendChild(el('tr', {}, [
          el('td', { textContent: p.name || p.id || '—' }),
          el('td', {}, [badge(p.format || '—', 'format')]),
          el('td', { textContent: p.cpa != null ? '$' + p.cpa : '—' }),
          el('td', { textContent: p.roas != null ? p.roas + 'x' : '—' }),
          el('td', { textContent: p.installs ?? '—' }),
        ]));
      });
      table.appendChild(tbody);
      root.appendChild(table);
    }

    // Recommendations
    const recs = data.recommendations || data.next_cycle || [];
    if (recs.length) {
      root.appendChild(el('h2', { textContent: 'Next Cycle Recommendations' }));
      const ul = el('ul', { style: 'padding-left:20px;font-size:14px;line-height:2;color:var(--text-secondary)' });
      recs.forEach(r => ul.appendChild(el('li', { textContent: typeof r === 'string' ? r : r.recommendation || r.text || JSON.stringify(r) })));
      root.appendChild(ul);
    }

    if (!Object.keys(patterns).length && !performers.length && !recs.length) {
      root.appendChild(emptyState('No Learnings Yet', 'Performance data will appear after running the optimize phase.'));
    }

  } catch (err) {
    root.appendChild(emptyState('No Performance Data', err.message));
    root.appendChild(el('div', { style: 'text-align:center;margin-top:16px' }, [
      el('button', { className: 'btn btn-primary', textContent: 'Run Optimize', onClick: () => showRunModal('optimize', 'Optimize Loop') }),
    ]));
  }
});

function buildBarChart(items) {
  const chart = el('div', { className: 'bar-chart' });
  const entries = Object.entries(items).sort((a, b) => (b[1].score || b[1] || 0) - (a[1].score || a[1] || 0));
  const max = Math.max(...entries.map(([, v]) => typeof v === 'number' ? v : v.score || v.count || 0), 1);

  entries.forEach(([label, val]) => {
    const num = typeof val === 'number' ? val : val.score || val.count || 0;
    const pct = Math.round((num / max) * 100);
    chart.appendChild(el('div', { className: 'bar-row' }, [
      el('div', { className: 'bar-label', textContent: label }),
      el('div', { className: 'bar-track' }, [
        el('div', { className: 'bar-fill', style: `width:${pct}%`, textContent: num.toString() }),
      ]),
    ]));
  });
  return chart;
}
