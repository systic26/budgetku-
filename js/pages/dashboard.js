/* Dashboard Page — Enhanced with 30-day chart, heatmap, week comparison */
window.Pages = window.Pages || {};
Pages.dashboard = {
  render() {
    const el = document.getElementById('page-dashboard');
    const s = DB.getDashboardSummary();
    const ds = s.danaServis;
    const dsPct = ds.masuk > 0 ? Math.round((ds.keluar / ds.masuk) * 100) : 0;
    const rasio = s.rasioUtang;
    const rasioDisplay = isFinite(rasio) ? rasio.toFixed(2) : '∞';
    const debtWarn = rasio > 1.0;
    const settings = DB.getSettings();
    const target = settings.target_harian || 150000;
    const week = this._getWeekComparison();
    const last30 = this._getLast30();
    const heatmap = this._getMonthHeatmap();

    el.innerHTML = `
      ${debtWarn ? `<div class="alert-debt mb-24">
        <div class="alert-debt-icon">🚨</div>
        <div class="alert-debt-text">Rasio Utang/Bersih ${rasioDisplay}× — Utang melebihi saldo bersih!</div>
      </div>` : ''}

      <!-- STAT CARDS -->
      <div class="grid-4 mb-20">
        ${statCard('primary','💰','Saldo Kotor', s.saldoKotor,
          `<div class="stat-breakdown">
            <div class="breakdown-row"><span class="breakdown-label">Trip</span><span class="breakdown-val text-primary">${UI.formatRp(s.tripIncome)}</span></div>
            <div class="breakdown-row"><span class="breakdown-label">Insentif</span><span class="breakdown-val text-primary">${UI.formatRp(s.insentifIncome)}</span></div>
          </div>`)}
        ${statCard('success','✅','Saldo Bersih', s.saldoBersih,
          `<div class="stat-meta">Setelah pengeluaran & alokasi servis</div>`)}
        ${statCard('warning','🔧','Dana Servis', ds.sisa,
          `<div class="progress-wrap">
            <div class="progress-labels"><span>Terpakai ${dsPct}%</span><span>${UI.formatRp(ds.masuk)} terkumpul</span></div>
            <div class="progress-bar"><div class="progress-fill ${dsPct>80?'danger':'warning'}" style="width:${Math.min(dsPct,100)}%"></div></div>
          </div>`)}
        ${statCard('danger','🏦','Total Utang', s.totalUtang,
          `<div class="stat-meta">Rasio: ${rasioDisplay}×</div>`)}
      </div>

      <!-- ROW: 30-day chart + Week comparison -->
      <div class="db-chart-row mb-20">
        <div class="card db-line-card">
          <div class="card-title mb-4">📈 Tren Pendapatan 30 Hari Terakhir</div>
          <div class="db-line-meta">
            <span class="text-muted" style="font-size:0.75rem">Total: <strong class="text-success">${UI.formatRp(last30.total)}</strong></span>
            <span class="text-muted" style="font-size:0.75rem">Rata-rata: <strong class="text-primary">${UI.formatRp(last30.avg)}</strong>/hari</span>
            <span class="text-muted" style="font-size:0.75rem">Terbaik: <strong class="text-warning">${UI.formatRp(last30.max)}</strong></span>
          </div>
          <div id="dbLineChart" style="width:100%;margin-top:8px"></div>
        </div>
        <div class="db-side-col">
          <!-- Week comparison -->
          <div class="card db-week-card">
            <div class="card-title mb-12">📆 Perbandingan Minggu</div>
            <div class="db-week-row">
              <div class="db-week-item">
                <div class="db-week-label">Minggu Ini</div>
                <div class="db-week-val text-success">${UI.formatRp(week.thisWeek)}</div>
                <div class="db-week-days">${week.thisWDays} hari kerja</div>
              </div>
              <div class="db-week-arrow ${week.delta >= 0 ? 'up' : 'down'}">${week.delta >= 0 ? '▲' : '▼'} ${Math.abs(week.deltaPct)}%</div>
              <div class="db-week-item">
                <div class="db-week-label">Minggu Lalu</div>
                <div class="db-week-val text-muted">${UI.formatRp(week.lastWeek)}</div>
                <div class="db-week-days">${week.lastWDays} hari kerja</div>
              </div>
            </div>
          </div>
          <!-- Target Harian -->
          <div class="card db-target-card">
            <div class="card-title mb-8">🎯 Target Harian Hari Ini</div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
              <span class="db-target-val ${s.todayIncome >= target ? 'text-success' : 'text-warning'}">${UI.formatRp(s.todayIncome || 0)}</span>
              <span class="text-muted" style="font-size:0.75rem">/ ${UI.formatRp(target)}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${s.todayIncome >= target ? 'success' : s.todayIncome >= target*0.6 ? 'warning' : 'danger'}"
                   style="width:${Math.min(100, Math.round(((s.todayIncome||0)/target)*100))}%"></div>
            </div>
            <div class="text-muted mt-4" style="font-size:0.72rem">
              ${s.todayIncome >= target ? '✅ Target tercapai!' : `Kurang ${UI.formatRp(target - (s.todayIncome||0))}`}
            </div>
          </div>
        </div>
      </div>

      <!-- ROW: Pie chart + Heatmap -->
      <div class="grid-2 mb-20">
        <div class="card">
          <div class="card-title mb-8">📊 Distribusi Penghasilan</div>
          <div id="pieChart"></div>
        </div>
        <div class="card">
          <div class="card-title mb-12">🗓️ Kalender Bulan Ini</div>
          <div class="db-heatmap" id="dbHeatmap"></div>
          <div class="db-heatmap-legend">
            <span>Rp0</span>
            <div class="db-legend-bar"></div>
            <span>${UI.formatRp(target)}+</span>
          </div>
        </div>
      </div>

      <!-- ROW: Statistik -->
      <div class="grid-2 mb-20">
        <div class="card">
          <div class="card-title">📈 Statistik Operasional</div>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
            ${statRow('Margin Bersih', s.marginBersih.toFixed(2)+'%', s.marginBersih>=30?'success':'warning')}
            ${statRow('Rata-rata Pendapatan/Hari', UI.formatRp(s.rataRataPendapatan), 'primary')}
            ${statRow('Rata-rata Pengeluaran/Hari', UI.formatRp(s.rataRataPengeluaran), 'warning')}
            ${statRow('Total Hari Kerja', s.hariKerja+' hari', 'success')}
            ${statRow('Total Alokasi Servis', UI.formatRp(s.alokasiServis), 'warning')}
            ${statRow('Rasio Utang/Bersih', rasioDisplay+'×', rasio>1?'danger':'success')}
          </div>
        </div>
        <div class="card">
          <div class="card-title mb-8">🔗 Akses Cepat</div>
          <div class="db-quick-links">
            <button class="db-quick-btn" onclick="UI.navigateTo('transaksi')">📝<span>Input Transaksi</span></button>
            <button class="db-quick-btn" onclick="UI.navigateTo('riwayat')">📋<span>Riwayat</span></button>
            <button class="db-quick-btn" onclick="UI.navigateTo('laporan')">📄<span>Laporan</span></button>
            <button class="db-quick-btn" onclick="UI.navigateTo('pengeluaran')">💸<span>Pengeluaran</span></button>
            <button class="db-quick-btn" onclick="UI.navigateTo('servis')">🔧<span>Servis</span></button>
            <button class="db-quick-btn" onclick="UI.navigateTo('utang')">🏦<span>Utang</span></button>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="section-header">
        <div class="section-title">📋 Transaksi Terbaru</div>
        <button class="btn btn-outline btn-sm" onclick="UI.navigateTo('riwayat')">Lihat Semua</button>
      </div>
      <div class="card">
        ${renderRecentTransaksi()}
      </div>
    `;

    // Render charts
    UI.renderPieChart('pieChart', [
      { label: 'Trip', value: s.tripIncome, color: 'var(--primary)' },
      { label: 'Insentif', value: s.insentifIncome, color: 'var(--purple)' },
    ]);
    this._renderLineChart('dbLineChart', last30.data);
    this._renderHeatmap('dbHeatmap', heatmap, target);
  },

  _getLast30() {
    const cf = DB.getCashflow();
    const now = new Date();
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const val = cf.filter(c => c.tanggal === dStr && c.kategori === 'PENGHASILAN').reduce((s,c) => s+(c.nominal||0), 0);
      data.push({ date: dStr, label: d.getDate()+'', value: val, isToday: i===0 });
    }
    const nonZero = data.filter(d => d.value > 0);
    return {
      data,
      total: data.reduce((s,d) => s+d.value, 0),
      max: Math.max(...data.map(d => d.value), 0),
      avg: nonZero.length ? Math.round(data.reduce((s,d) => s+d.value,0)/nonZero.length) : 0,
    };
  },

  _getWeekComparison() {
    const cf = DB.getCashflow();
    const now = new Date();
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const thisMonStart = new Date(now); thisMonStart.setDate(now.getDate() - dow); thisMonStart.setHours(0,0,0,0);
    const lastMonStart = new Date(thisMonStart); lastMonStart.setDate(thisMonStart.getDate() - 7);
    const lastSunEnd = new Date(thisMonStart); lastSunEnd.setDate(thisMonStart.getDate() - 1); lastSunEnd.setHours(23,59,59,999);

    const income = cf.filter(c => c.kategori === 'PENGHASILAN');
    const thisW = income.filter(c => { const d = new Date(c.tanggal+'T00:00:00'); return d >= thisMonStart && d <= now; });
    const lastW = income.filter(c => { const d = new Date(c.tanggal+'T00:00:00'); return d >= lastMonStart && d <= lastSunEnd; });
    const thisTotal = thisW.reduce((s,c) => s+(c.nominal||0), 0);
    const lastTotal = lastW.reduce((s,c) => s+(c.nominal||0), 0);
    const delta = thisTotal - lastTotal;
    const deltaPct = lastTotal > 0 ? Math.round((delta / lastTotal) * 100) : (thisTotal > 0 ? 100 : 0);
    return {
      thisWeek: thisTotal, lastWeek: lastTotal,
      delta, deltaPct,
      thisWDays: new Set(thisW.map(c=>c.tanggal)).size,
      lastWDays: new Set(lastW.map(c=>c.tanggal)).size,
    };
  },

  _getMonthHeatmap() {
    const cf = DB.getCashflow();
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const map = {};
    cf.filter(c => c.tanggal && c.tanggal.startsWith(`${y}-${String(m+1).padStart(2,'0')}`))
      .forEach(c => {
        const d = parseInt(c.tanggal.split('-')[2]);
        if (c.kategori === 'PENGHASILAN') map[d] = (map[d]||0) + (c.nominal||0);
      });
    const result = [];
    const firstDay = new Date(y, m, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < offset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push({ day: d, value: map[d]||0, isToday: d===now.getDate() });
    return result;
  },

  _renderLineChart(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const max = Math.max(...data.map(d => d.value), 1);
    const W = 600, H = 100, padL = 8, padR = 8, padT = 10, padB = 20;
    const cW = W - padL - padR, cH = H - padT - padB;
    const pts = data.map((d, i) => ({
      x: padL + (i / (data.length - 1)) * cW,
      y: padT + cH - (d.value / max) * cH,
      ...d
    }));

    // Smooth bezier path
    let path = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i-1].x + pts[i].x) / 2;
      path += ` C${cx.toFixed(1)},${pts[i-1].y.toFixed(1)} ${cx.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    const fillPath = path + ` L${pts[pts.length-1].x},${padT+cH} L${pts[0].x},${padT+cH} Z`;

    // X-axis labels (every 5 days)
    const labels = data.map((d,i) => i % 5 === 0 || d.isToday ?
      `<text x="${pts[i].x.toFixed(1)}" y="${H}" text-anchor="middle" font-size="8" fill="var(--text-muted)">${d.label}</text>` : '').join('');

    // Today dot
    const todayPt = pts.find(p => p.isToday);
    const todayDot = todayPt ? `<circle cx="${todayPt.x.toFixed(1)}" cy="${todayPt.y.toFixed(1)}" r="4" fill="var(--success)" stroke="var(--bg-card)" stroke-width="2"/>` : '';

    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100" preserveAspectRatio="none" style="display:block">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <path d="${fillPath}" fill="url(#lineGrad)"/>
        <path d="${path}" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/>
        ${todayDot}
        ${labels}
      </svg>`;
  },

  _renderHeatmap(containerId, cells, target) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const dayLabels = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
    el.innerHTML = `
      <div class="db-heatmap-days">${dayLabels.map(d=>`<div class="db-hd-label">${d}</div>`).join('')}</div>
      <div class="db-heatmap-grid">
        ${cells.map(c => {
          if (!c) return `<div class="db-hm-cell empty"></div>`;
          const pct = Math.min(1, c.value / target);
          const opacity = c.value === 0 ? 0 : 0.15 + pct * 0.85;
          const color = pct >= 1 ? 'var(--success)' : pct >= 0.5 ? 'var(--warning)' : 'var(--primary)';
          return `<div class="db-hm-cell ${c.isToday?'today':''}" title="${c.day}: ${UI.formatRp(c.value)}"
            style="background:${c.value>0?color:'rgba(255,255,255,0.04)'};opacity:${c.value>0?opacity:1}">
            <span>${c.day}</span>
          </div>`;
        }).join('')}
      </div>`;
  },

  _editTransaksi(id) {
    const t = DB.getTransaksiById(id);
    if (!t) return;
    UI.openModal('Edit Transaksi', `
      <form id="formEditTrx">
        <div class="form-group"><label class="form-label">Tanggal</label><input type="date" id="etTanggal" class="form-control" value="${t.tanggal}" required></div>
        <div class="form-group"><label class="form-label">Jumlah Orderan</label><input type="number" id="etOrderan" class="form-control" value="${t.jumlah_orderan}" required></div>
        <div class="form-group"><label class="form-label">Penghasilan Kotor (Rp)</label><input type="number" id="etKotor" class="form-control" value="${t.penghasilan_kotor}" required></div>
        <div class="form-group"><label class="form-label">Insentif (Rp)</label><input type="number" id="etInsentif" class="form-control" value="${t.insentif}"></div>
        <div class="form-group"><label class="form-label">Keterangan</label><input type="text" id="etKet" class="form-control" value="${t.keterangan||''}"></div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.dashboard._saveEditTransaksi('${id}')">Simpan</button>`);
  },

  _saveEditTransaksi(id) {
    const tanggal = document.getElementById('etTanggal').value;
    const jumlah_orderan = parseInt(document.getElementById('etOrderan').value)||0;
    const penghasilan_kotor = parseFloat(document.getElementById('etKotor').value)||0;
    const insentif = parseFloat(document.getElementById('etInsentif').value)||0;
    const keterangan = document.getElementById('etKet').value;
    const orig = DB.getTransaksiById(id);
    DB.deleteTransaksi(id);
    Engine.prosesTransaksi({ tanggal, jam_mulai: orig?.jam_mulai||'', jam_selesai: orig?.jam_selesai||'', jumlah_orderan, penghasilan_kotor, insentif, keterangan, status_override: jumlah_orderan > 0 ? 'WORKING' : 'OFF' });
    UI.closeModal(); UI.toast('Transaksi berhasil diubah', 'success'); Pages.dashboard.render();
  },

  _deleteTransaksi(id) {
    UI.confirm('Hapus transaksi ini?', () => { DB.deleteTransaksi(id); UI.toast('Transaksi dihapus','info'); Pages.dashboard.render(); });
  }
};

function statCard(type, icon, label, value, extra='') {
  return `<div class="stat-card ${type}">
    <div class="stat-icon">${icon}</div>
    <div class="stat-label">${label}</div>
    <div class="stat-value ${type}">${UI.formatRp(value)}</div>
    ${extra}
  </div>`;
}
function statRow(label, value, colorClass='') {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
    <span style="font-size:0.82rem;color:var(--text-secondary)">${label}</span>
    <span style="font-size:0.88rem;font-weight:700" class="text-${colorClass}">${value}</span>
  </div>`;
}
function renderRecentTransaksi() {
  const list = DB.getTransaksi().slice().sort((a,b) => {
    const diff = new Date(b.tanggal)-new Date(a.tanggal);
    return diff!==0?diff:new Date(b.created_at||0)-new Date(a.created_at||0);
  }).slice(0,8);
  if (!list.length) return UI.emptyState('📭','Belum ada transaksi. Mulai catat hari ini!');
  return `<div class="table-wrap"><table>
    <thead><tr>
      <th>Tanggal</th><th>Status</th><th>Orderan</th>
      <th>Penghasilan</th><th>Insentif</th><th>Alokasi Servis</th>
      <th style="text-align:right">Aksi</th>
    </tr></thead>
    <tbody>
      ${list.map(t => {
        const cf = DB.getCashflow().filter(c => c.transaksi_id===t.id);
        const alok = cf.filter(c=>c.source_type==='SERVIS_ALLOC').reduce((s,c)=>s+c.nominal,0);
        return `<tr>
          <td>${UI.formatDate(t.tanggal)}</td>
          <td>${UI.badgeStatus(t.status_operasi)}</td>
          <td>${t.jumlah_orderan||0}</td>
          <td class="text-success fw-600">${UI.formatRp(t.penghasilan_trip||t.penghasilan_kotor)}</td>
          <td class="text-primary fw-600">${t.insentif>0?UI.formatRp(t.insentif):'<span class="text-muted">-</span>'}</td>
          <td class="text-warning">${alok>0?UI.formatRp(alok):'<span class="text-muted">-</span>'}</td>
          <td style="text-align:right">
            <button class="btn-icon edit" onclick="Pages.dashboard._editTransaksi('${t.id}')">✏️</button>
            <button class="btn-icon danger" onclick="Pages.dashboard._deleteTransaksi('${t.id}')">🗑</button>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}
