/**
 * UI — Shared UI utilities: toast, modal, formatting, routing
 */
const UI = (() => {

  /* ===== FORMAT HELPERS ===== */
  function formatRp(n, showSign = false) {
    const abs = Math.abs(Math.round(n || 0));
    const str = 'Rp' + abs.toLocaleString('id-ID');
    if (showSign && n < 0) return '−' + str;
    if (showSign && n > 0) return '+' + str;
    return str;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }

  function formatTime(t) { return t || '-'; }

  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatPct(n) { return (n || 0) + '%'; }

  /* ===== TOAST ===== */
  function toast(msg, type = 'info', duration = 3500) {
    const svgs = {
      success: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    };
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${svgs[type]}</span><span class="toast-msg">${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.classList.add('fadeout');
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  /* ===== MODAL ===== */
  function openModal(title, bodyHTML, footerHTML = '') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    const backdrop = document.getElementById('modalBackdrop');
    backdrop.classList.add('active');
    // footer
    let footer = backdrop.querySelector('.modal-footer');
    if (footer) footer.remove();
    if (footerHTML) {
      const f = document.createElement('div');
      f.className = 'modal-footer';
      f.innerHTML = footerHTML;
      document.getElementById('modal').appendChild(f);
    }
  }
  function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('active');
    const f = document.getElementById('modal').querySelector('.modal-footer');
    if (f) f.remove();
  }

  /* ===== PAGE ROUTER ===== */
  function navigateTo(page) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    // Update pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === 'page-' + page);
    });
    // Update title
    const titles = {
      dashboard: 'Dashboard', transaksi: 'Input Transaksi',
      riwayat: 'Riwayat Cashflow', servis: 'Riwayat Servis',
      pengeluaran: 'Pengeluaran', utang: 'Utang',
      pengaturan: 'Pengaturan', laporan: 'Laporan Bulanan',
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    // Render page
    if (window.Pages && Pages[page]) Pages[page].render();
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  }

  /* ===== CONFIRM DIALOG ===== */
  function confirm(msg, onYes) {
    openModal(
      'Konfirmasi',
      `<p style="color:var(--text-secondary);margin-bottom:8px">${msg}</p>`,
      `<button class="btn btn-outline" id="cfNo">Batal</button>
       <button class="btn btn-danger" id="cfYes">Hapus</button>`
    );
    document.getElementById('cfNo').onclick = closeModal;
    document.getElementById('cfYes').onclick = () => { closeModal(); onYes(); };
  }

  /* ===== BADGE HELPER ===== */
  function badgeStatus(status) {
    if (status === 'WORKING') {
      return `<span class="badge badge-success" style="display:inline-flex;align-items:center;gap:6px">
        <span style="width:6px;height:6px;border-radius:50%;background-color:currentColor;display:inline-block"></span>Kerja
      </span>`;
    }
    if (status === 'OFF') {
      return `<span class="badge badge-warning" style="display:inline-flex;align-items:center;gap:6px">
        <span style="width:6px;height:6px;border-radius:50%;background-color:currentColor;display:inline-block"></span>Libur
      </span>`;
    }
    return '<span class="badge badge-muted">-</span>';
  }

  function badgeSource(type) {
    const map = {
      'TRIP': '<span class="badge badge-primary">Trip</span>',
      'INCENTIVE': '<span class="badge badge-purple">Insentif</span>',
      'SERVIS_ALLOC': '<span class="badge badge-warning">Alokasi Servis</span>',
      'MANUAL': '<span class="badge badge-muted">Manual</span>',
      'PENGELUARAN': '<span class="badge badge-danger">Pengeluaran</span>',
      'SERVIS': '<span class="badge badge-danger">Servis</span>',
    };
    return map[type] || `<span class="badge badge-muted">${type}</span>`;
  }

  /* ===== EMPTY STATE ===== */
  function emptyState(icon, text) {
    return `<div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-text">${text}</div>
    </div>`;
  }

  /* ===== SIMPLE BAR CHART (Canvas-free SVG) ===== */
  function renderMiniChart(containerId, data, color = 'var(--primary)') {
    const el = document.getElementById(containerId);
    if (!el || !data.length) return;
    const max = Math.max(...data.map(d => d.value), 1);
    const w = el.clientWidth || 300;
    const h = 80;
    const bars = data.length;
    const bw = Math.floor((w - bars * 2) / bars);
    let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">`;
    data.forEach((d, i) => {
      const bh = Math.max(2, Math.floor((d.value / max) * (h - 20)));
      const x = i * (bw + 2);
      const y = h - bh;
      svg += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="3" fill="${color}" opacity="0.7">
        <title>${d.label}: ${UI.formatRp(d.value)}</title></rect>`;
    });
    svg += '</svg>';
    el.innerHTML = svg;
  }

  /* ===== PIE CHART (SVG) ===== */
  function renderPieChart(containerId, slices) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const total = slices.reduce((s, sl) => s + sl.value, 0);
    if (total === 0) {
      el.innerHTML = emptyState(
        `<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="width:32px;height:32px;opacity:0.6"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        'Belum ada data'
      );
      return;
    }
    const cx = 80, cy = 80, r = 70;
    let startAngle = -Math.PI / 2;
    let paths = '';
    slices.forEach(sl => {
      const angle = (sl.value / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const endAngle = startAngle + angle;
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const large = angle > Math.PI ? 1 : 0;
      paths += `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${sl.color}" opacity="0.85" style="transition:opacity 0.2s; cursor:pointer"><title>${sl.label}: ${UI.formatRp(sl.value)}</title></path>`;
      startAngle = endAngle;
    });
    const legend = slices.map(sl =>
      `<div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.01);border:1px solid var(--border)">
        <div style="width:10px;height:10px;border-radius:50%;background:${sl.color}"></div>
        <span style="color:var(--text-secondary);font-weight:500">${sl.label}</span>
        <span style="font-weight:700;margin-left:auto;color:var(--text-primary)">${((sl.value / total) * 100).toFixed(1)}%</span>
      </div>`
    ).join('');
    el.innerHTML = `<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
      <svg width="160" height="160" viewBox="0 0 160 160">${paths}
        <circle cx="80" cy="80" r="38" fill="var(--bg-surface)"/>
        <text x="80" y="80" text-anchor="middle" font-size="10" fill="var(--text-muted)" font-family="var(--font-body)">Total</text>
        <text x="80" y="93" text-anchor="middle" font-size="10" fill="var(--text-primary)" font-weight="700" font-family="var(--font-display)">${UI.formatRp(total).replace('Rp','').replace('.000','k')}</text>
      </svg>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px">${legend}</div>
    </div>`;
  }

  return {
    formatRp, formatDate, formatDateShort, formatTime, todayISO, formatPct,
    toast, openModal, closeModal, navigateTo, confirm,
    badgeStatus, badgeSource, emptyState,
    renderMiniChart, renderPieChart,
  };
})();
