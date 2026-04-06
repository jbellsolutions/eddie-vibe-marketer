App.register('research', async (root) => {
  root.appendChild(el('h1', { textContent: 'Competitor Intelligence' }));

  try {
    const data = await api('/research');
    const ads = data.ads || [];

    if (!ads.length) {
      root.appendChild(emptyState('No Research Data', 'Run Phase 1: Research to scrape competitor ads.'));
      return;
    }

    const competitors = [...new Set(ads.map(a => a.competitor))];
    const platforms = [...new Set(ads.flatMap(a => a.platforms || []))];

    const filters = el('div', { className: 'filters' });
    const compSelect = el('select', {}, [
      el('option', { value: '', textContent: 'All Competitors' }),
      ...competitors.map(c => el('option', { value: c, textContent: c })),
    ]);
    const platSelect = el('select', {}, [
      el('option', { value: '', textContent: 'All Platforms' }),
      ...platforms.map(p => el('option', { value: p, textContent: p })),
    ]);
    filters.append(compSelect, platSelect);
    root.appendChild(filters);

    const table = el('table');
    const thead = el('thead', {}, [
      el('tr', {}, [
        el('th', { textContent: '' }),
        el('th', { textContent: 'Competitor' }),
        el('th', { textContent: 'Hook Preview' }),
        el('th', { textContent: 'Media' }),
        el('th', { textContent: 'Platforms' }),
        el('th', { textContent: 'Active' }),
      ]),
    ]);
    const tbody = el('tbody');
    table.append(thead, tbody);
    root.appendChild(table);

    let expanded = null;

    function renderRows() {
      tbody.innerHTML = '';
      expanded = null;
      let filtered = ads;
      if (compSelect.value) filtered = filtered.filter(a => a.competitor === compSelect.value);
      if (platSelect.value) filtered = filtered.filter(a => (a.platforms || []).includes(platSelect.value));

      if (!filtered.length) {
        tbody.appendChild(el('tr', {}, [el('td', { colSpan: '6', textContent: 'No ads match filters.' })]));
        return;
      }

      filtered.forEach((ad, i) => {
        const row = el('tr', { style: 'cursor:pointer' }, [
          el('td', { textContent: '▶' }),
          el('td', { textContent: ad.competitor || '—' }),
          el('td', { textContent: truncate(ad.hook || ad.headline || ad.body || '', 80) }),
          el('td', { textContent: ad.media_type || '—' }),
          el('td', {}, (ad.platforms || []).map(p => badge(p, 'platform'))),
          el('td', { textContent: ad.is_active ? 'Yes' : '—' }),
        ]);

        row.addEventListener('click', () => {
          if (expanded === i) {
            const expRow = tbody.querySelector('.expanded-row');
            if (expRow) expRow.remove();
            expanded = null;
            row.querySelector('td').textContent = '▶';
            return;
          }
          const prev = tbody.querySelector('.expanded-row');
          if (prev) {
            prev.remove();
            const prevIdx = expanded;
            if (prevIdx !== null) {
              tbody.querySelectorAll('tr:not(.expanded-row)')[prevIdx].querySelector('td').textContent = '▶';
            }
          }
          expanded = i;
          row.querySelector('td').textContent = '▼';

          const detail = [
            ad.headline ? `Headline: ${ad.headline}` : '',
            ad.hook ? `Hook: ${ad.hook}` : '',
            ad.body ? `\nBody:\n${ad.body}` : '',
            ad.cta ? `\nCTA: ${ad.cta}` : '',
            ad.transcript ? `\nTranscript:\n${ad.transcript}` : '',
            ad.ad_library_url ? `\nAd Library: ${ad.ad_library_url}` : '',
          ].filter(Boolean).join('\n');

          const expRow = el('tr', { className: 'expanded-row' }, [
            el('td', { colSpan: '6' }, [
              el('div', { className: 'expanded-content', textContent: detail }),
            ]),
          ]);
          row.after(expRow);
        });

        tbody.appendChild(row);
      });
    }

    compSelect.addEventListener('change', renderRows);
    platSelect.addEventListener('change', renderRows);
    renderRows();

  } catch (err) {
    root.appendChild(emptyState('No Research Data', err.message));
    const btn = el('button', { className: 'btn btn-primary', textContent: 'Run Research', onClick: () => showRunModal('research', 'Research') });
    root.appendChild(el('div', { style: 'text-align:center;margin-top:16px' }, [btn]));
  }
});
