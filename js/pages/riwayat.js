/* Riwayat Cashflow Page — Enhanced UI/UX */
Pages.riwayat = {

  _activePeriod: 'semua',
  _activeSource: '',

  render() {
    const el = document.getElementById('page-riwayat');
    const summary = this._calcSummary();

    el.innerHTML = `
      <!-- SUMMARY CARDS -->
      <div class="rw-summary-grid">
        <div class="rw-stat-card rw-stat-today">
          <div class="rw-stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Hari Ini</div>
          <div class="rw-stat-value">${UI.formatRp(summary.today)}</div>
          <div class="rw-stat-sub">${summary.todayTrips} trip · ${UI.formatRp(summary.todayInsentif)} insentif</div>
        </div>
        <div class="rw-stat-card rw-stat-week">
          <div class="rw-stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Minggu Ini</div>
          <div class="rw-stat-value">${UI.formatRp(summary.week)}</div>
          <div class="rw-stat-sub">${summary.weekDays} hari kerja</div>
        </div>
        <div class="rw-stat-card rw-stat-month">
          <div class="rw-stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Bulan Ini</div>
          <div class="rw-stat-value">${UI.formatRp(summary.month)}</div>
          <div class="rw-stat-sub">Rata ${UI.formatRp(summary.monthAvg)}/hari</div>
        </div>
        <div class="rw-stat-card rw-stat-year">
          <div class="rw-stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-right:6px"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Tahun Ini</div>
          <div class="rw-stat-value">${UI.formatRp(summary.year)}</div>
          <div class="rw-stat-sub">Total ${summary.yearDays} hari kerja</div>
        </div>
      </div>

      <!-- MINI CHART: 7-day trend -->
      <div class="card rw-chart-card">
        <div class="rw-chart-header">
          <span class="rw-chart-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>Tren Pendapatan 7 Hari Terakhir</span>
        </div>
        <div class="rw-chart-bars" id="rw7dayChart"></div>
        <div class="rw-chart-labels" id="rw7dayLabels"></div>
      </div>

      <!-- FILTER ROW -->
      <div class="rw-filter-row">
        <div class="rw-period-tabs" id="rwPeriodTabs">
          ${['semua','hari','minggu','bulan','tahun'].map(p => `
            <button class="rw-tab ${this._activePeriod === p ? 'active' : ''}" data-period="${p}">
              ${{ semua:'Semua', hari:'Hari Ini', minggu:'Minggu', bulan:'Bulan', tahun:'Tahun' }[p]}
            </button>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
          <select class="form-control rw-source-filter" id="rwSourceFilter">
            <option value="">Semua Tipe</option>
            <option value="TRIP">Trip</option>
            <option value="INCENTIVE">Insentif</option>
            <option value="SERVIS_ALLOC">Alokasi Servis</option>
            <option value="PENGELUARAN">Pengeluaran</option>
            <option value="SERVIS">Servis</option>
            <option value="MANUAL">Manual</option>
          </select>
          <button class="btn btn-outline btn-sm" id="rwExportBtn" style="white-space:nowrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>CSV</button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="card rw-table-card">
        <div id="rwTableWrap"></div>
      </div>
    `;

    // Render chart
    this._renderChart(summary.last7);

    // Restore filter states
    document.getElementById('rwSourceFilter').value = this._activeSource;

    // Render table
    this._applyFilter();

    // Bind events
    document.getElementById('rwPeriodTabs').addEventListener('click', e => {
      const btn = e.target.closest('.rw-tab');
      if (!btn) return;
      this._activePeriod = btn.dataset.period;
      document.querySelectorAll('.rw-tab').forEach(b => b.classList.toggle('active', b === btn));
      this._applyFilter();
    });

    document.getElementById('rwSourceFilter').addEventListener('change', e => {
      this._activeSource = e.target.value;
      this._applyFilter();
    });

    document.getElementById('rwExportBtn').addEventListener('click', () => {
      const data = this._getFilteredData();
      const headers = ['Tanggal','Tipe','Kategori','Tujuan Dana','Nominal','Keterangan'];
      const rows = data.map(c => [
        c.tanggal, c.source_type, c.kategori,
        c.tujuan_dana||'', c.nominal, (c.keterangan||'').replace(/"/g,"'")
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetku_cashflow_${UI.todayISO()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      UI.toast('CSV berhasil didownload!', 'success');
    });
  },

  _calcSummary() {
    const cf = DB.getCashflow();
    const now = new Date();
    const todayStr = UI.todayISO();

    // Week bounds (Mon–Sun)
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0,0,0,0);

    const income = cf.filter(c => c.kategori === 'PENGHASILAN');

    // Today
    const todayIncome = income.filter(c => c.tanggal === todayStr);
    const todayTrips = todayIncome.filter(c => c.source_type === 'TRIP').reduce((s,c) => s + (c.nominal||0), 0);
    const todayInsentif = todayIncome.filter(c => c.source_type === 'INCENTIVE').reduce((s,c) => s + (c.nominal||0), 0);
    const today = todayTrips + todayInsentif;

    // Week
    const weekIncome = income.filter(c => {
      const d = new Date(c.tanggal + 'T00:00:00');
      return d >= weekStart && d <= now;
    });
    const week = weekIncome.reduce((s,c) => s + (c.nominal||0), 0);
    const weekDays = new Set(weekIncome.map(c => c.tanggal)).size;

    // Month
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthIncome = income.filter(c => c.tanggal && c.tanggal.startsWith(ym));
    const month = monthIncome.reduce((s,c) => s + (c.nominal||0), 0);
    const monthDays = new Set(monthIncome.map(c => c.tanggal)).size;
    const monthAvg = monthDays > 0 ? Math.round(month / monthDays) : 0;

    // Year
    const y = String(now.getFullYear());
    const yearIncome = income.filter(c => c.tanggal && c.tanggal.startsWith(y));
    const year = yearIncome.reduce((s,c) => s + (c.nominal||0), 0);
    const yearDays = new Set(yearIncome.map(c => c.tanggal)).size;

    // Last 7 days chart data
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const val = income.filter(c => c.tanggal === dStr).reduce((s,c) => s + (c.nominal||0), 0);
      last7.push({
        label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        dateStr: dStr,
        value: val,
        isToday: dStr === todayStr,
      });
    }

    return { today, todayTrips, todayInsentif, week, weekDays, month, monthAvg, monthDays, year, yearDays, last7 };
  },

  _renderChart(last7) {
    const container = document.getElementById('rw7dayChart');
    const labelContainer = document.getElementById('rw7dayLabels');
    if (!container) return;

    const max = Math.max(...last7.map(d => d.value), 1);
    const bars = last7.map(d => {
      const pct = Math.max(4, Math.round((d.value / max) * 100));
      const isToday = d.isToday;
      const isEmpty = d.value === 0;
      return `
        <div class="rw-bar-wrap" title="${d.label}: ${UI.formatRp(d.value)}">
          <div class="rw-bar-tooltip">${UI.formatRp(d.value)}</div>
          <div class="rw-bar ${isToday ? 'rw-bar-today' : ''} ${isEmpty ? 'rw-bar-empty' : ''}"
               style="height:${pct}%"></div>
        </div>`;
    }).join('');

    const labels = last7.map(d =>
      `<div class="rw-bar-label ${d.isToday ? 'rw-bar-label-today' : ''}">${d.label}</div>`
    ).join('');

    container.innerHTML = bars;
    labelContainer.innerHTML = labels;
  },

  _getFilteredData() {
    const all = DB.getCashflow().sort((a, b) => {
      const diff = new Date(b.tanggal) - new Date(a.tanggal);
      return diff !== 0 ? diff : new Date(b.created_at||0) - new Date(a.created_at||0);
    });

    const now = new Date();
    const todayStr = UI.todayISO();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0,0,0,0);
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const y = String(now.getFullYear());

    let data = all;
    if (this._activePeriod === 'hari') {
      data = all.filter(c => c.tanggal === todayStr);
    } else if (this._activePeriod === 'minggu') {
      data = all.filter(c => {
        const d = new Date((c.tanggal||'') + 'T00:00:00');
        return d >= weekStart && d <= now;
      });
    } else if (this._activePeriod === 'bulan') {
      data = all.filter(c => c.tanggal && c.tanggal.startsWith(ym));
    } else if (this._activePeriod === 'tahun') {
      data = all.filter(c => c.tanggal && c.tanggal.startsWith(y));
    }

    if (this._activeSource) {
      data = data.filter(c => c.source_type === this._activeSource);
    }

    return data;
  },

  _applyFilter() {
    const data = this._getFilteredData();
    const wrap = document.getElementById('rwTableWrap');
    if (!wrap) return;

    // Period total
    const totalIn = data.filter(c => c.kategori === 'PENGHASILAN').reduce((s,c) => s + (c.nominal||0), 0);
    const totalOut = data.filter(c => c.kategori === 'PENGELUARAN' || c.kategori === 'PENGELUARAN_SERVIS').reduce((s,c) => s + (c.nominal||0), 0);
    const net = totalIn - totalOut;

    wrap.innerHTML = `
      <div class="rw-table-summary">
        <div class="rw-ts-item rw-ts-in">
          <span class="rw-ts-label">Masuk</span>
          <span class="rw-ts-val">+${UI.formatRp(totalIn)}</span>
        </div>
        <div class="rw-ts-item rw-ts-out">
          <span class="rw-ts-label">Keluar</span>
          <span class="rw-ts-val">−${UI.formatRp(totalOut)}</span>
        </div>
        <div class="rw-ts-item rw-ts-net">
          <span class="rw-ts-label">Net</span>
          <span class="rw-ts-val ${net >= 0 ? 'text-success' : 'text-danger'}">${net >= 0 ? '+' : '−'}${UI.formatRp(Math.abs(net))}</span>
        </div>
      </div>
      ${this._renderTable(data)}
    `;
  },

  _renderTable(list) {
    if (!list.length) return UI.emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>', 'Tidak ada data untuk periode ini');
    return `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Tanggal</th>
          <th>Tipe</th>
          <th>Keterangan</th>
          <th class="text-right">Nominal</th>
          <th class="text-right">Aksi</th>
        </tr></thead>
        <tbody>
          ${list.map(c => {
            const isOut = c.kategori === 'PENGELUARAN' || c.kategori === 'PENGELUARAN_SERVIS';
            return `<tr>
              <td style="white-space:nowrap">
                <div class="fw-500">${UI.formatDate(c.tanggal)}</div>
                <div class="text-muted fs-sm">${c.tujuan_dana || c.kategori || ''}</div>
              </td>
              <td>${UI.badgeSource(c.source_type)}</td>
              <td class="text-muted fs-sm" style="max-width:160px;word-break:break-word">${c.keterangan || '-'}</td>
              <td class="text-right fw-600 ${isOut ? 'text-danger' : 'text-success'}" style="white-space:nowrap">
                ${isOut ? '−' : '+'}${UI.formatRp(c.nominal)}
              </td>
              <td class="text-right" style="white-space:nowrap">
                <button class="btn-icon edit" title="Edit" onclick="Pages.riwayat._edit('${c.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="btn-icon danger" onclick="Pages.riwayat._delete('${c.id}')" title="Hapus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  },

  _edit(id) {
    const c = DB.getCashflow().find(x => x.id === id);
    if (!c) return;
    UI.openModal('Edit Cashflow', `
      <form id="formEditCf">
        <div class="form-group"><label class="form-label">Tanggal</label><input type="date" id="ecfTanggal" class="form-control" value="${c.tanggal}" required></div>
        <div class="form-group"><label class="form-label">Kategori</label><input type="text" id="ecfKategori" class="form-control" value="${c.kategori}" required></div>
        <div class="form-group"><label class="form-label">Tujuan Dana</label><input type="text" id="ecfTujuan" class="form-control" value="${c.tujuan_dana || ''}"></div>
        <div class="form-group"><label class="form-label">Nominal (Rp)</label><input type="number" id="ecfNominal" class="form-control" value="${c.nominal}" required></div>
        <div class="form-group"><label class="form-label">Keterangan</label><input type="text" id="ecfKet" class="form-control" value="${c.keterangan || ''}"></div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.riwayat._saveEdit('${id}')">Simpan</button>`);
  },

  _saveEdit(id) {
    const tanggal    = document.getElementById('ecfTanggal').value;
    const kategori   = document.getElementById('ecfKategori').value;
    const tujuan_dana = document.getElementById('ecfTujuan').value;
    const nominal    = parseFloat(document.getElementById('ecfNominal').value) || 0;
    const keterangan = document.getElementById('ecfKet').value;
    DB.updateCashflow(id, { tanggal, kategori, tujuan_dana, nominal, keterangan });
    UI.closeModal();
    UI.toast('Cashflow diubah', 'success');
    Pages.riwayat.render();
  },

  _delete(id) {
    UI.confirm('Hapus data cashflow ini?', () => {
      DB.deleteCashflow(id);
      UI.toast('Cashflow dihapus', 'warning');
      Pages.riwayat.render();
    });
  }
};
