App.register('publishing', async (root) => {
  root.appendChild(el('h1', { textContent: 'Publishing' }));

  const tabs = el('div', { className: 'tabs' });
  const tabQueue = el('div', { className: 'tab active', textContent: 'Schedule' });
  const tabLog = el('div', { className: 'tab', textContent: 'Publish Log' });
  tabs.append(tabQueue, tabLog);
  root.appendChild(tabs);

  const container = el('div');
  root.appendChild(container);

  tabQueue.addEventListener('click', () => { tabQueue.classList.add('active'); tabLog.classList.remove('active'); loadQueue(); });
  tabLog.addEventListener('click', () => { tabLog.classList.add('active'); tabQueue.classList.remove('active'); loadLog(); });

  async function loadQueue() {
    container.innerHTML = '';
    try {
      const data = await api('/publish-queue');
      const items = data.queue || data.items || (Array.isArray(data) ? data : []);

      if (!items.length) {
        container.appendChild(emptyState('Queue Empty', 'Build the publish queue first.'));
        container.appendChild(el('div', { style: 'text-align:center;margin-top:16px' }, [
          el('button', { className: 'btn btn-primary', textContent: 'Build Queue', onClick: () => showRunModal('queue', 'Build Queue') }),
        ]));
        return;
      }

      // Group by date
      const byDate = {};
      items.forEach(item => {
        const date = (item.scheduled_date || item.date || 'Unscheduled').split('T')[0];
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(item);
      });

      // Platform summary cards
      const platCounts = {};
      items.forEach(item => {
        const p = item.platform || 'unknown';
        platCounts[p] = (platCounts[p] || 0) + 1;
      });
      const platCards = el('div', { className: 'stats', style: 'margin-bottom:24px' });
      Object.entries(platCounts).forEach(([p, count]) => {
        platCards.appendChild(statCard(p, count, 'posts'));
      });
      container.appendChild(platCards);

      // Schedule table grouped by date
      Object.entries(byDate).sort().forEach(([date, dateItems]) => {
        container.appendChild(el('h2', { textContent: date }));
        const table = el('table');
        table.appendChild(el('thead', {}, [
          el('tr', {}, [
            el('th', { textContent: 'Time' }),
            el('th', { textContent: 'Platform' }),
            el('th', { textContent: 'Format' }),
            el('th', { textContent: 'Content Preview' }),
          ]),
        ]));
        const tbody = el('tbody');
        dateItems.forEach(item => {
          tbody.appendChild(el('tr', {}, [
            el('td', { textContent: item.time || item.scheduled_time || '—' }),
            el('td', {}, [badge(item.platform || '—', 'platform')]),
            el('td', {}, [badge(item.format || '—', 'format')]),
            el('td', { textContent: truncate(item.content_preview || item.hook || item.title || '—', 100) }),
          ]));
        });
        table.appendChild(tbody);
        container.appendChild(table);
      });

      container.appendChild(el('div', { className: 'btn-row' }, [
        el('button', { className: 'btn btn-primary', textContent: 'Run Publisher', onClick: () => showRunModal('publish', 'Publisher') }),
      ]));

    } catch (err) {
      container.appendChild(emptyState('No Publish Queue', err.message));
      container.appendChild(el('div', { style: 'text-align:center;margin-top:16px' }, [
        el('button', { className: 'btn btn-primary', textContent: 'Build Queue', onClick: () => showRunModal('queue', 'Build Queue') }),
      ]));
    }
  }

  async function loadLog() {
    container.innerHTML = '';
    try {
      const data = await api('/publish-log');
      const entries = data.log || data.entries || (Array.isArray(data) ? data : []);

      if (!entries.length) {
        container.appendChild(emptyState('No Publish History', 'Posts will appear here after publishing.'));
        return;
      }

      const table = el('table');
      table.appendChild(el('thead', {}, [
        el('tr', {}, [
          el('th', { textContent: 'Date' }),
          el('th', { textContent: 'Platform' }),
          el('th', { textContent: 'Status' }),
          el('th', { textContent: 'Content' }),
          el('th', { textContent: 'Error' }),
        ]),
      ]));
      const tbody = el('tbody');
      entries.forEach(entry => {
        const ok = entry.status === 'success' || entry.success;
        tbody.appendChild(el('tr', {}, [
          el('td', { textContent: formatDate(entry.date || entry.timestamp) }),
          el('td', {}, [badge(entry.platform || '—', 'platform')]),
          el('td', {}, [badge(ok ? 'Success' : 'Failed', ok ? 'pass' : 'fail')]),
          el('td', { textContent: truncate(entry.content_preview || entry.title || '—', 80) }),
          el('td', { textContent: entry.error || '—' }),
        ]));
      });
      table.appendChild(tbody);
      container.appendChild(table);

    } catch (err) {
      container.appendChild(emptyState('No Publish Log', err.message));
    }
  }

  loadQueue();
});
