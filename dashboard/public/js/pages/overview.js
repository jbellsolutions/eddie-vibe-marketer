App.register('overview', async (root) => {
  root.appendChild(el('h1', { textContent: 'Pipeline Overview' }));

  const stats = el('div', { className: 'stats' });
  const pipeline = el('div', { className: 'pipeline' });
  const btnRow = el('div', { className: 'btn-row' });
  root.append(stats, el('h2', { textContent: 'Pipeline Flow' }), pipeline, el('h2', { textContent: 'Run Phase' }), btnRow);

  try {
    const [status, research, scripts, content, quality] = await Promise.allSettled([
      api('/status'),
      api('/research'),
      api('/scripts'),
      api('/content'),
      api('/quality'),
    ]);

    const st = status.value || {};
    const ads = research.status === 'fulfilled' ? (research.value.ads || []).length : 0;
    const scriptCount = scripts.status === 'fulfilled' ? scripts.value.total : 0;
    const contentCount = content.status === 'fulfilled'
      ? Object.values(content.value.formats || {}).reduce((s, f) => s + f.length, 0) : 0;
    const qaRate = quality.status === 'fulfilled' && quality.value.summary
      ? Math.round((quality.value.summary.passed / quality.value.summary.total) * 100) + '%' : '—';

    stats.append(
      statCard('Ads Scraped', ads, st.files?.['research-summary']?.exists ? 'Last: ' + formatDate(st.files['research-summary'].modified) : ''),
      statCard('Scripts Generated', scriptCount, scripts.status === 'fulfilled' ? (scripts.value.formats_used || []).length + ' formats' : ''),
      statCard('Content Pieces', contentCount, content.status === 'fulfilled' ? Object.keys(content.value.formats || {}).length + ' formats' : ''),
      statCard('QA Pass Rate', qaRate, quality.status === 'fulfilled' ? quality.value.summary?.total + ' reviewed' : ''),
    );

    const phases = [
      { name: 'Research', key: 'research-summary', phase: 'research' },
      { name: 'Generate', key: 'all-scripts', phase: 'generate' },
      { name: 'Quality', key: 'quality-report', phase: 'quality' },
      { name: 'Content', key: 'content-manifest', phase: 'content' },
      { name: 'Optimize', key: 'learnings', phase: 'optimize' },
      { name: 'Queue', key: 'publish-queue', phase: 'queue' },
      { name: 'Publish', key: 'publish-log', phase: 'publish' },
    ];

    phases.forEach((p, i) => {
      const fileStatus = st.files?.[p.key];
      const dotClass = fileStatus?.exists ? 'green' : 'gray';
      const box = el('div', { className: 'phase-box' }, [
        el('div', { className: 'name' }, [
          el('span', { className: `phase-dot ${dotClass}` }),
          document.createTextNode(p.name),
        ]),
        el('div', { className: 'time', textContent: fileStatus?.exists ? formatDate(fileStatus.modified) : 'Not run' }),
      ]);
      pipeline.appendChild(box);
      if (i < phases.length - 1) pipeline.appendChild(el('span', { className: 'arrow', textContent: '→' }));
    });

    const running = st.runningPhase;
    const phaseButtons = [
      { label: 'Run Research', phase: 'research' },
      { label: 'Run Generate', phase: 'generate' },
      { label: 'Run Quality Gate', phase: 'quality' },
      { label: 'Run Content', phase: 'content' },
      { label: 'Run Optimize', phase: 'optimize' },
      { label: 'Build Queue', phase: 'queue' },
      { label: 'Run Publisher', phase: 'publish' },
      { label: 'Full Cycle', phase: 'full-cycle' },
    ];

    phaseButtons.forEach(pb => {
      const btn = el('button', {
        className: `btn ${pb.phase === 'full-cycle' ? 'btn-primary' : 'btn-secondary'}`,
        textContent: pb.label,
        disabled: running ? 'true' : undefined,
        onClick: () => showRunModal(pb.phase, pb.label),
      });
      if (running) btn.disabled = true;
      btnRow.appendChild(btn);
    });

  } catch (err) {
    stats.appendChild(emptyState('Error', err.message));
  }
});
