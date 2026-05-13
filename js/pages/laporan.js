/* Laporan Bulanan Page */
window.Pages = window.Pages || {};
Pages.laporan = {

  _selectedYear:  new Date().getFullYear(),
  _selectedMonth: new Date().getMonth() + 1,

  render() {
    const el = document.getElementById('page-laporan');
    const now = new Date();
    const years = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) years.push(y);

    el.innerHTML = `
      <!-- Period Selector -->
      <div class="lap-header card mb-16">
        <div class="lap-header-left">
          <span style="font-size:1rem;font-weight:700">Pilih Periode</span>
        </div>
        <div class="lap-header-controls">
          <select class="form-control" id="lapMonth" style="width:auto">
            ${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
              .map((m,i) => `<option value="${i+1}" ${i+1===this._selectedMonth?'selected':''}>${m}</option>`).join('')}
          </select>
          <select class="form-control" id="lapYear" style="width:auto">
            ${years.map(y => `<option value="${y}" ${y===this._selectedYear?'selected':''}>${y}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="lapGenerate">📊 Tampilkan</button>
          <button class="btn btn-outline btn-sm" id="lapPrint">🖨️ Cetak</button>
          <button class="btn btn-outline btn-sm" id="lapExportCSV">⬇️ CSV</button>
        </div>
      </div>

      <!-- Report Content -->
      <div id="lapContent"></div>
    `;

    document.getElementById('lapGenerate').addEventListener('click', () => {
      this._selectedMonth = parseInt(document.getElementById('lapMonth').value);
      this._selectedYear  = parseInt(document.getElementById('lapYear').value);
      this._renderReport();
    });
    document.getElementById('lapPrint').addEventListener('click', () => window.print());
    document.getElementById('lapExportCSV').addEventListener('click', () => this._exportCSV());

    this._renderReport();
  },

  _renderReport() {
    const y = this._selectedYear;
    const m = this._selectedMonth;
    const prefix = `${y}-${String(m).padStart(2,'0')}`;
    const monthName = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][m-1];

    const cf = DB.getCashflow().filter(c => c.tanggal && c.tanggal.startsWith(prefix));
    const trx = DB.getTransaksi().filter(t => t.tanggal && t.tanggal.startsWith(prefix));
    const pengeluaran = DB.getPengeluaran().filter(p => p.tanggal && p.tanggal.startsWith(prefix));
    const servis = DB.getServis().filter(s => s.tanggal && s.tanggal.startsWith(prefix));

    // Calculations
    const tripIncome    = cf.filter(c => c.source_type === 'TRIP').reduce((s,c) => s+(c.nominal||0), 0);
    const insentif      = cf.filter(c => c.source_type === 'INCENTIVE').reduce((s,c) => s+(c.nominal||0), 0);
    const alokasiServis = cf.filter(c => c.source_type === 'SERVIS_ALLOC').reduce((s,c) => s+(c.nominal||0), 0);
    const totalPengeluaran = cf.filter(c => c.kategori === 'PENGELUARAN').reduce((s,c) => s+(c.nominal||0), 0);
    const totalServis   = cf.filter(c => c.kategori === 'PENGELUARAN_SERVIS').reduce((s,c) => s+(c.nominal||0), 0);
    const totalKotor    = tripIncome + insentif;
    const saldoBersih   = totalKotor - totalPengeluaran - alokasiServis;
    const hariKerja     = trx.filter(t => t.status_operasi === 'WORKING').length;
    const hariLibur     = trx.filter(t => t.status_operasi === 'OFF').length;
    const totalOrder    = trx.reduce((s,t) => s+(t.jumlah_orderan||0), 0);
    const avgHarian     = hariKerja > 0 ? Math.round(totalKotor / hariKerja) : 0;
    const margin        = totalKotor > 0 ? ((saldoBersih / totalKotor) * 100).toFixed(1) : '0';

    // Day-by-day breakdown
    const days = {};
    trx.forEach(t => { days[t.tanggal] = { trx: t, income: 0, alokasi: 0, pengeluaran: 0 }; });
    cf.forEach(c => {
      if (!days[c.tanggal]) days[c.tanggal] = { trx: null, income: 0, alokasi: 0, pengeluaran: 0 };
      if (c.kategori === 'PENGHASILAN') days[c.tanggal].income += (c.nominal||0);
      if (c.source_type === 'SERVIS_ALLOC') days[c.tanggal].alokasi += (c.nominal||0);
      if (c.kategori === 'PENGELUARAN') days[c.tanggal].pengeluaran += (c.nominal||0);
    });
    const sortedDays = Object.entries(days).sort((a,b) => a[0].localeCompare(b[0]));

    document.getElementById('lapContent').innerHTML = `
      <div class="lap-printable" id="lapPrintable">

        <!-- Report Header -->
        <div class="lap-report-header">
          <div>
            <div style="font-size:1.3rem;font-weight:800">📋 Laporan Keuangan Bulanan</div>
            <div style="color:var(--text-secondary);margin-top:4px">${monthName} ${y} · BudgetKu</div>
          </div>
          <div class="lap-period-badge">${monthName} ${y}</div>
        </div>

        <!-- Summary Cards -->
        <div class="lap-summary-grid">
          ${this._summCard('💰', 'Total Penghasilan', totalKotor, 'primary')}
          ${this._summCard('✅', 'Saldo Bersih', saldoBersih, saldoBersih>=0?'success':'danger')}
          ${this._summCard('💸', 'Total Pengeluaran', totalPengeluaran, 'danger')}
          ${this._summCard('🔧', 'Alokasi Servis', alokasiServis, 'warning')}
          ${this._summCard('⚡', 'Penghasilan Trip', tripIncome, 'primary')}
          ${this._summCard('🎁', 'Insentif', insentif, 'purple')}
        </div>

        <!-- Stats Row -->
        <div class="card lap-stats-row">
          ${this._statItem('Hari Kerja', hariKerja + ' hari')}
          ${this._statItem('Hari Libur', hariLibur + ' hari')}
          ${this._statItem('Total Order', totalOrder)}
          ${this._statItem('Rata-rata/Hari', UI.formatRp(avgHarian))}
          ${this._statItem('Margin Bersih', margin + '%')}
          ${this._statItem('Biaya Servis', UI.formatRp(totalServis))}
        </div>

        <!-- Day-by-Day Table -->
        <div class="card lap-table-card">
          <div style="font-weight:700;margin-bottom:12px;font-size:0.9rem">📅 Rincian Per Hari</div>
          ${sortedDays.length ? `
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>Tanggal</th><th>Status</th><th>Order</th>
                <th class="text-right">Penghasilan</th>
                <th class="text-right">Alokasi Servis</th>
                <th class="text-right">Pengeluaran</th>
                <th class="text-right">Net Hari</th>
              </tr></thead>
              <tbody>
                ${sortedDays.map(([date, d]) => {
                  const net = d.income - d.alokasi - d.pengeluaran;
                  const status = d.trx ? d.trx.status_operasi : '-';
                  const orders = d.trx ? (d.trx.jumlah_orderan||0) : '-';
                  return `<tr>
                    <td style="white-space:nowrap;font-weight:500">${UI.formatDate(date)}</td>
                    <td>${UI.badgeStatus(status)}</td>
                    <td>${orders}</td>
                    <td class="text-right text-success fw-600">${d.income>0?'+'+UI.formatRp(d.income):'-'}</td>
                    <td class="text-right text-warning">${d.alokasi>0?UI.formatRp(d.alokasi):'-'}</td>
                    <td class="text-right text-danger">${d.pengeluaran>0?'-'+UI.formatRp(d.pengeluaran):'-'}</td>
                    <td class="text-right fw-600 ${net>=0?'text-success':'text-danger'}">${net>=0?'+':'-'}${UI.formatRp(Math.abs(net))}</td>
                  </tr>`;
                }).join('')}
              </tbody>
              <tfoot>
                <tr style="border-top:2px solid var(--border);font-weight:700">
                  <td colspan="3">TOTAL</td>
                  <td class="text-right text-success">+${UI.formatRp(totalKotor)}</td>
                  <td class="text-right text-warning">${UI.formatRp(alokasiServis)}</td>
                  <td class="text-right text-danger">-${UI.formatRp(totalPengeluaran)}</td>
                  <td class="text-right ${saldoBersih>=0?'text-success':'text-danger'}">${saldoBersih>=0?'+':'-'}${UI.formatRp(Math.abs(saldoBersih))}</td>
                </tr>
              </tfoot>
            </table>
          </div>` : UI.emptyState('📭', `Tidak ada data untuk ${monthName} ${y}`)}
        </div>

        <!-- Pengeluaran Detail -->
        ${pengeluaran.length ? `
        <div class="card lap-table-card">
          <div style="font-weight:700;margin-bottom:12px;font-size:0.9rem">💸 Detail Pengeluaran</div>
          <div class="table-wrap"><table>
            <thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th class="text-right">Nominal</th></tr></thead>
            <tbody>
              ${pengeluaran.map(p => `<tr>
                <td>${UI.formatDate(p.tanggal)}</td>
                <td><span class="badge badge-danger">${p.kategori||'Umum'}</span></td>
                <td class="text-muted">${p.keterangan||'-'}</td>
                <td class="text-right text-danger fw-600">-${UI.formatRp(p.nominal)}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>` : ''}

        <!-- Servis Detail -->
        ${servis.length ? `
        <div class="card lap-table-card">
          <div style="font-weight:700;margin-bottom:12px;font-size:0.9rem">🔧 Biaya Servis</div>
          <div class="table-wrap"><table>
            <thead><tr><th>Tanggal</th><th>Nama Servis</th><th>Keterangan</th><th class="text-right">Biaya</th></tr></thead>
            <tbody>
              ${servis.map(s => `<tr>
                <td>${UI.formatDate(s.tanggal)}</td>
                <td class="fw-500">${s.nama_servis||'-'}</td>
                <td class="text-muted">${s.keterangan||'-'}</td>
                <td class="text-right text-warning fw-600">${UI.formatRp(s.biaya)}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>` : ''}

      </div>
    `;
  },

  _summCard(icon, label, value, color) {
    return `<div class="lap-sum-card">
      <div class="lap-sum-icon">${icon}</div>
      <div class="lap-sum-label">${label}</div>
      <div class="lap-sum-val text-${color}">${UI.formatRp(value)}</div>
    </div>`;
  },

  _statItem(label, value) {
    return `<div class="lap-stat-item">
      <div class="lap-stat-label">${label}</div>
      <div class="lap-stat-val">${value}</div>
    </div>`;
  },

  _exportCSV() {
    const y = this._selectedYear;
    const m = this._selectedMonth;
    const prefix = `${y}-${String(m).padStart(2,'0')}`;
    const monthName = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m-1];

    const data = DB.getCashflow()
      .filter(c => c.tanggal && c.tanggal.startsWith(prefix))
      .sort((a,b) => a.tanggal.localeCompare(b.tanggal));

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
    a.download = `budgetku_${monthName}${y}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('CSV berhasil didownload! Buka dengan Excel.', 'success');
  },
};
