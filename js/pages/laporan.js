/* Laporan Page — Bulanan + YTD */
window.Pages = window.Pages || {};
Pages.laporan = {

  _selectedYear:  new Date().getFullYear(),
  _selectedMonth: new Date().getMonth() + 1,
  _activeTab: 'bulanan',

  render() {
    const el = document.getElementById('page-laporan');
    const now = new Date();
    const years = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) years.push(y);

    el.innerHTML = `
      <div class="lap-header card mb-16">
        <div>
          <div style="font-weight:700;font-size:1rem">Laporan Keuangan</div>
          <div class="text-muted" style="font-size:0.75rem;margin-top:2px">Pilih periode & unduh laporan lengkap</div>
        </div>
        <div class="lap-header-controls">
          <div style="display:flex;gap:2px;background:rgba(255,255,255,0.06);border-radius:8px;padding:3px;margin-right:8px">
            <button class="btn btn-sm" id="tabBulanan" style="${this._activeTab==='bulanan'?'background:var(--primary);color:#fff':'background:transparent;color:var(--text-muted)'};border:none;border-radius:6px;padding:6px 14px;font-size:0.75rem;font-weight:600;cursor:pointer;transition:all .2s"> Bulanan</button>
            <button class="btn btn-sm" id="tabYTD" style="${this._activeTab==='ytd'?'background:var(--primary);color:#fff':'background:transparent;color:var(--text-muted)'};border:none;border-radius:6px;padding:6px 14px;font-size:0.75rem;font-weight:600;cursor:pointer;transition:all .2s"> YTD</button>
          </div>
          <select class="form-control" id="lapMonth" style="width:auto;${this._activeTab==='ytd'?'display:none':''}">
            ${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
              .map((m,i) => `<option value="${i+1}" ${i+1===this._selectedMonth?'selected':''}>${m}</option>`).join('')}
          </select>
          <select class="form-control" id="lapYear" style="width:auto">
            ${years.map(y => `<option value="${y}" ${y===this._selectedYear?'selected':''}>${y}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="lapGenerate"> Tampilkan</button>
          <button class="btn btn-outline btn-sm" id="lapPrint"> Cetak</button>
          <button class="btn btn-outline btn-sm" id="lapExportCSV"> Excel CSV</button>
        </div>
      </div>
      <div id="lapContent"></div>
    `;

    document.getElementById('tabBulanan').addEventListener('click', () => { this._activeTab='bulanan'; this.render(); });
    document.getElementById('tabYTD').addEventListener('click', () => { this._activeTab='ytd'; this.render(); });
    document.getElementById('lapGenerate').addEventListener('click', () => {
      this._selectedMonth = parseInt(document.getElementById('lapMonth').value);
      this._selectedYear  = parseInt(document.getElementById('lapYear').value);
      if (this._activeTab === 'ytd') this._renderYTD(); else this._renderReport();
    });
    document.getElementById('lapPrint').addEventListener('click', () => window.print());
    document.getElementById('lapExportCSV').addEventListener('click', () => this._exportFullCSV());
    if (this._activeTab === 'ytd') this._renderYTD(); else this._renderReport();
  },

  _renderReport() {
    const y = this._selectedYear;
    const m = this._selectedMonth;
    const prefix = `${y}-${String(m).padStart(2,'0')}`;
    const monthName = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][m-1];

    const cf = DB.getCashflow().filter(c => c.tanggal?.startsWith(prefix));
    const trx = DB.getTransaksi().filter(t => t.tanggal?.startsWith(prefix));
    const pengeluaran = DB.getPengeluaran().filter(p => p.tanggal?.startsWith(prefix));
    const servis = DB.getServis().filter(s => s.tanggal?.startsWith(prefix));
    const utang = DB.getUtang ? DB.getUtang().filter(u => u.tanggal?.startsWith(prefix)) : [];

    // Aggregates
    const tripIncome      = cf.filter(c => c.source_type==='TRIP').reduce((s,c)=>s+(c.nominal||0),0);
    const insentif        = cf.filter(c => c.source_type==='INCENTIVE').reduce((s,c)=>s+(c.nominal||0),0);
    const alokasiServis   = cf.filter(c => c.source_type==='SERVIS_ALLOC').reduce((s,c)=>s+(c.nominal||0),0);
    const manualAlloc     = cf.filter(c => c.source_type==='MANUAL').reduce((s,c)=>s+(c.nominal||0),0);
    const totalPengeluaran= cf.filter(c => c.kategori==='PENGELUARAN').reduce((s,c)=>s+(c.nominal||0),0);
    const totalServisBiaya= servis.reduce((s,sv)=>s+(sv.biaya||0),0);
    const totalKotor      = tripIncome + insentif;
    const saldoBersih     = totalKotor - totalPengeluaran - alokasiServis;
    const hariKerja       = trx.filter(t=>t.status_operasi==='WORKING').length;
    const hariLibur       = trx.filter(t=>t.status_operasi==='OFF').length;
    const totalOrder      = trx.reduce((s,t)=>s+(t.jumlah_orderan||0),0);
    const avgHarian       = hariKerja>0 ? Math.round(totalKotor/hariKerja) : 0;
    const avgOrder        = hariKerja>0 ? (totalOrder/hariKerja).toFixed(1) : 0;
    const margin          = totalKotor>0 ? ((saldoBersih/totalKotor)*100).toFixed(1) : '0';

    // Day-by-day
    const days = {};
    trx.forEach(t => { days[t.tanggal]={trx:t,income:0,alokasi:0,pengeluaran:0,orders:t.jumlah_orderan||0}; });
    cf.forEach(c => {
      if (!days[c.tanggal]) days[c.tanggal]={trx:null,income:0,alokasi:0,pengeluaran:0,orders:0};
      if (c.kategori==='PENGHASILAN') days[c.tanggal].income+=(c.nominal||0);
      if (c.source_type==='SERVIS_ALLOC') days[c.tanggal].alokasi+=(c.nominal||0);
      if (c.kategori==='PENGELUARAN') days[c.tanggal].pengeluaran+=(c.nominal||0);
    });
    const sortedDays = Object.entries(days).sort((a,b)=>a[0].localeCompare(b[0]));

    document.getElementById('lapContent').innerHTML = `
    <div class="lap-printable" id="lapPrintable">

      <!-- Report header -->
      <div class="lap-report-header">
        <div>
          <div style="font-size:1.4rem;font-weight:800;display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;color:var(--primary)"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>Laporan Keuangan</div>
          <div class="text-muted mt-4">${monthName} ${y} · BudgetKu Driver Finance</div>
        </div>
        <div class="lap-period-badge">${monthName} ${y}</div>
      </div>

      <!-- 6 Summary Cards -->
      <div class="lap-summary-grid">
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>','Total Penghasilan',totalKotor,'primary')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg>','Saldo Bersih',saldoBersih,saldoBersih>=0?'success':'danger')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>','Total Pengeluaran',totalPengeluaran,'danger')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>','Alokasi Servis',alokasiServis,'warning')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>','Trip Income',tripIncome,'primary')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>','Insentif',insentif,'purple')}
      </div>

      <!-- Stats strip -->
      <div class="card lap-stats-row">
        ${this._statItem('Hari Kerja',hariKerja+' hari')}
        ${this._statItem('Hari Libur',hariLibur+' hari')}
        ${this._statItem('Total Order',totalOrder)}
        ${this._statItem('Avg Order/Hari',avgOrder)}
        ${this._statItem('Avg Pendapatan/Hari',UI.formatRp(avgHarian))}
        ${this._statItem('Margin Bersih',margin+'%')}
        ${this._statItem('Biaya Servis',UI.formatRp(totalServisBiaya))}
        ${this._statItem('Alokasi Manual',UI.formatRp(manualAlloc))}
      </div>

      <!-- Semua Transaksi Harian -->
      <div class="card lap-table-card">
        <div class="lap-section-title"> Semua Transaksi Harian (${trx.length} data)</div>
        ${trx.length ? `<div class="table-wrap"><table>
          <thead><tr>
            <th>Tanggal</th><th>Status</th><th>Order</th><th>Jam Kerja</th>
            <th class="text-right">Penghasilan Trip</th><th class="text-right">Insentif</th>
            <th class="text-right">Alokasi Servis</th><th class="text-right">Net Hari</th>
            <th>Keterangan</th>
          </tr></thead>
          <tbody>
            ${sortedDays.map(([date,d]) => {
              const net = d.income - d.alokasi - d.pengeluaran;
              const t = d.trx;
              const jamKerja = t && t.jam_mulai && t.jam_selesai ? `${t.jam_mulai}–${t.jam_selesai}` : '-';
              return `<tr>
                <td style="white-space:nowrap;font-weight:600">${UI.formatDate(date)}</td>
                <td>${UI.badgeStatus(t?t.status_operasi:'-')}</td>
                <td class="text-center">${d.orders||'-'}</td>
                <td style="font-size:0.78rem;white-space:nowrap">${jamKerja}</td>
                <td class="text-right text-success fw-600">${d.income>0?'+'+UI.formatRp(d.income):'-'}</td>
                <td class="text-right text-primary">${t&&t.insentif>0?UI.formatRp(t.insentif):'-'}</td>
                <td class="text-right text-warning">${d.alokasi>0?UI.formatRp(d.alokasi):'-'}</td>
                <td class="text-right fw-600 ${net>=0?'text-success':'text-danger'}">${net>=0?'+':'-'}${UI.formatRp(Math.abs(net))}</td>
                <td class="text-muted" style="font-size:0.78rem;max-width:140px;word-break:break-word">${t?t.keterangan||'-':'-'}</td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--border);font-weight:700;font-size:0.88rem">
              <td colspan="4">TOTAL (${hariKerja} hari kerja)</td>
              <td class="text-right text-success">+${UI.formatRp(tripIncome)}</td>
              <td class="text-right text-primary">+${UI.formatRp(insentif)}</td>
              <td class="text-right text-warning">${UI.formatRp(alokasiServis)}</td>
              <td class="text-right ${saldoBersih>=0?'text-success':'text-danger'}">${saldoBersih>=0?'+':'-'}${UI.formatRp(Math.abs(saldoBersih))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table></div>` : UI.emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', `Tidak ada transaksi untuk ${monthName} ${y}`)}
      </div>

      <!-- Detail Cashflow -->
      <div class="card lap-table-card">
        <div class="lap-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px;color:var(--success)"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Semua Arus Kas (${cf.length} entri)</div>
        ${cf.length ? `<div class="table-wrap"><table>
          <thead><tr>
            <th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Tujuan Dana</th>
            <th class="text-right">Nominal</th><th>Keterangan</th>
          </tr></thead>
          <tbody>
            ${cf.sort((a,b)=>a.tanggal.localeCompare(b.tanggal)).map(c => {
              const isOut = c.kategori==='PENGELUARAN'||c.kategori==='PENGELUARAN_SERVIS';
              return `<tr>
                <td style="white-space:nowrap">${UI.formatDate(c.tanggal)}</td>
                <td>${UI.badgeSource(c.source_type)}</td>
                <td><span class="badge badge-muted" style="font-size:0.65rem">${c.kategori||'-'}</span></td>
                <td class="text-muted" style="font-size:0.78rem">${c.tujuan_dana||'-'}</td>
                <td class="text-right fw-600 ${isOut?'text-danger':'text-success'}">${isOut?'-':'+'}${UI.formatRp(c.nominal)}</td>
                <td class="text-muted" style="font-size:0.78rem;max-width:160px;word-break:break-word">${c.keterangan||'-'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>` : UI.emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', 'Tidak ada cashflow')}
      </div>

      <!-- Pengeluaran detail -->
      ${pengeluaran.length ? `<div class="card lap-table-card">
        <div class="lap-section-title"> Pengeluaran (${pengeluaran.length} item · Total: ${UI.formatRp(totalPengeluaran)})</div>
        <div class="table-wrap"><table>
          <thead><tr><th>Tanggal</th><th>Kategori</th><th class="text-right">Nominal</th><th>Keterangan</th></tr></thead>
          <tbody>
            ${pengeluaran.sort((a,b)=>a.tanggal.localeCompare(b.tanggal)).map(p=>`<tr>
              <td style="white-space:nowrap">${UI.formatDate(p.tanggal)}</td>
              <td><span class="badge badge-danger">${p.kategori||'Umum'}</span></td>
              <td class="text-right text-danger fw-600">-${UI.formatRp(p.nominal)}</td>
              <td class="text-muted" style="font-size:0.78rem">${p.keterangan||'-'}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr style="font-weight:700;border-top:2px solid var(--border)">
            <td colspan="2">TOTAL</td><td class="text-right text-danger">-${UI.formatRp(totalPengeluaran)}</td><td></td>
          </tr></tfoot>
        </table></div>
      </div>` : ''}

      <!-- Servis detail -->
      ${servis.length ? `<div class="card lap-table-card">
        <div class="lap-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px;color:var(--warning)"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>Biaya Servis (${servis.length} item · Total: ${UI.formatRp(totalServisBiaya)})</div>
        <div class="table-wrap"><table>
          <thead><tr><th>Tanggal</th><th>Nama Servis</th><th class="text-right">Biaya</th><th>Keterangan</th></tr></thead>
          <tbody>
            ${servis.sort((a,b)=>a.tanggal.localeCompare(b.tanggal)).map(s=>`<tr>
              <td style="white-space:nowrap">${UI.formatDate(s.tanggal)}</td>
              <td class="fw-600">${s.nama_servis||'-'}</td>
              <td class="text-right text-warning fw-600">${UI.formatRp(s.biaya)}</td>
              <td class="text-muted" style="font-size:0.78rem">${s.keterangan||'-'}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr style="font-weight:700;border-top:2px solid var(--border)">
            <td colspan="2">TOTAL</td><td class="text-right text-warning">${UI.formatRp(totalServisBiaya)}</td><td></td>
          </tr></tfoot>
        </table></div>
      </div>` : ''}

      <!-- Footer -->
      <div class="card" style="text-align:center;padding:14px;margin-bottom:8px">
        <div class="text-muted" style="font-size:0.72rem">
          Digenerate oleh BudgetKu · ${new Date().toLocaleString('id-ID')} · Data ${monthName} ${y}
        </div>
      </div>

    </div>`;
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

  _renderYTD() {
    const y = this._selectedYear;
    const yearPrefix = `${y}-`;

    const cf = DB.getCashflow().filter(c => c.tanggal?.startsWith(yearPrefix));
    const trx = DB.getTransaksi().filter(t => t.tanggal?.startsWith(yearPrefix));
    const pengeluaran = DB.getPengeluaran().filter(p => p.tanggal?.startsWith(yearPrefix));
    const servis = DB.getServis().filter(s => s.tanggal?.startsWith(yearPrefix));

    // Aggregates
    const tripIncome      = cf.filter(c => c.source_type==='TRIP').reduce((s,c)=>s+(c.nominal||0),0);
    const insentif        = cf.filter(c => c.source_type==='INCENTIVE').reduce((s,c)=>s+(c.nominal||0),0);
    const alokasiServis   = cf.filter(c => c.source_type==='SERVIS_ALLOC').reduce((s,c)=>s+(c.nominal||0),0);
    const manualAlloc     = cf.filter(c => c.source_type==='MANUAL').reduce((s,c)=>s+(c.nominal||0),0);
    const totalPengeluaran= cf.filter(c => c.kategori==='PENGELUARAN').reduce((s,c)=>s+(c.nominal||0),0);
    const totalServisBiaya= servis.reduce((s,sv)=>s+(sv.biaya||0),0);
    const totalKotor      = tripIncome + insentif;
    const saldoBersih     = totalKotor - totalPengeluaran - alokasiServis;
    const hariKerja       = trx.filter(t=>t.status_operasi==='WORKING').length;
    const hariLibur       = trx.filter(t=>t.status_operasi==='OFF').length;
    const totalOrder      = trx.reduce((s,t)=>s+(t.jumlah_orderan||0),0);
    const avgHarian       = hariKerja>0 ? Math.round(totalKotor/hariKerja) : 0;
    const avgOrder        = hariKerja>0 ? (totalOrder/hariKerja).toFixed(1) : 0;
    const margin          = totalKotor>0 ? ((saldoBersih/totalKotor)*100).toFixed(1) : '0';

    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const monthlyData = [];

    for (let m = 1; m <= 12; m++) {
      const prefix = `${y}-${String(m).padStart(2,'0')}`;
      const cfMonth = cf.filter(c => c.tanggal?.startsWith(prefix));
      const trxMonth = trx.filter(t => t.tanggal?.startsWith(prefix));
      const pengeluaranMonth = pengeluaran.filter(p => p.tanggal?.startsWith(prefix));
      const servisMonth = servis.filter(s => s.tanggal?.startsWith(prefix));

      const tripM = cfMonth.filter(c => c.source_type==='TRIP').reduce((s,c)=>s+(c.nominal||0),0);
      const insentifM = cfMonth.filter(c => c.source_type==='INCENTIVE').reduce((s,c)=>s+(c.nominal||0),0);
      const alokasiM = cfMonth.filter(c => c.source_type==='SERVIS_ALLOC').reduce((s,c)=>s+(c.nominal||0),0);
      const pengeluaranM = cfMonth.filter(c => c.kategori==='PENGELUARAN').reduce((s,c)=>s+(c.nominal||0),0);
      const kotorM = tripM + insentifM;
      const bersihM = kotorM - pengeluaranM - alokasiM;
      const kerjaM = trxMonth.filter(t=>t.status_operasi==='WORKING').length;
      const orderM = trxMonth.reduce((s,t)=>s+(t.jumlah_orderan||0),0);

      const hasData = cfMonth.length > 0 || trxMonth.length > 0 || pengeluaranMonth.length > 0 || servisMonth.length > 0;

      monthlyData.push({
        monthIndex: m,
        monthName: monthNames[m-1],
        kerja: kerjaM,
        order: orderM,
        kotor: kotorM,
        pengeluaran: pengeluaranM,
        alokasi: alokasiM,
        bersih: bersihM,
        hasData
      });
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const visibleMonths = monthlyData.filter(d => {
      if (y < currentYear) return true;
      if (y > currentYear) return d.hasData;
      return d.monthIndex <= currentMonth || d.hasData;
    });

    document.getElementById('lapContent').innerHTML = `
    <div class="lap-printable" id="lapPrintable">

      <!-- Report header -->
      <div class="lap-report-header">
        <div>
          <div style="font-size:1.4rem;font-weight:800;display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;color:var(--primary)"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>Laporan Keuangan YTD</div>
          <div class="text-muted mt-4">Tahun ${y} · BudgetKu Driver Finance</div>
        </div>
        <div class="lap-period-badge">YTD ${y}</div>
      </div>

      <!-- 6 Summary Cards -->
      <div class="lap-summary-grid">
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>','Total Penghasilan',totalKotor,'primary')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg>','Saldo Bersih',saldoBersih,saldoBersih>=0?'success':'danger')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>','Total Pengeluaran',totalPengeluaran,'danger')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>','Alokasi Servis',alokasiServis,'warning')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>','Trip Income',tripIncome,'primary')}
        ${this._summCard('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>','Insentif',insentif,'purple')}
      </div>

      <!-- Stats strip -->
      <div class="card lap-stats-row">
        ${this._statItem('Hari Kerja',hariKerja+' hari')}
        ${this._statItem('Hari Libur',hariLibur+' hari')}
        ${this._statItem('Total Order',totalOrder)}
        ${this._statItem('Avg Order/Hari',avgOrder)}
        ${this._statItem('Avg Pendapatan/Hari',UI.formatRp(avgHarian))}
        ${this._statItem('Margin Bersih',margin+'%')}
        ${this._statItem('Biaya Servis',UI.formatRp(totalServisBiaya))}
        ${this._statItem('Alokasi Manual',UI.formatRp(manualAlloc))}
      </div>

      <!-- Detail Bulanan YTD -->
      <div class="card lap-table-card">
        <div class="lap-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px;color:var(--primary)"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Rincian Bulanan (YTD)</div>
        <div class="table-wrap"><table>
          <thead><tr>
            <th>Bulan</th>
            <th class="text-center">Hari Kerja</th>
            <th class="text-center">Total Order</th>
            <th class="text-right">Penghasilan Kotor</th>
            <th class="text-right">Pengeluaran</th>
            <th class="text-right">Alokasi Servis</th>
            <th class="text-right">Saldo Bersih</th>
          </tr></thead>
          <tbody>
            ${visibleMonths.map(d => {
              return `<tr>
                <td style="font-weight:600">${d.monthName}</td>
                <td class="text-center">${d.kerja} hari</td>
                <td class="text-center">${d.order}</td>
                <td class="text-right text-success fw-600">${d.kotor > 0 ? '+' + UI.formatRp(d.kotor) : '-'}</td>
                <td class="text-right text-danger fw-600">${d.pengeluaran > 0 ? '-' + UI.formatRp(d.pengeluaran) : '-'}</td>
                <td class="text-right text-warning">${d.alokasi > 0 ? UI.formatRp(d.alokasi) : '-'}</td>
                <td class="text-right fw-600 ${d.bersih >= 0 ? 'text-success' : 'text-danger'}">${d.bersih >= 0 ? '+' : '-'}${UI.formatRp(Math.abs(d.bersih))}</td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--border);font-weight:700;font-size:0.88rem">
              <td>TOTAL YTD</td>
              <td class="text-center">${hariKerja} hari</td>
              <td class="text-center">${totalOrder}</td>
              <td class="text-right text-success">+${UI.formatRp(totalKotor)}</td>
              <td class="text-right text-danger">-${UI.formatRp(totalPengeluaran)}</td>
              <td class="text-right text-warning">${UI.formatRp(alokasiServis)}</td>
              <td class="text-right ${saldoBersih >= 0 ? 'text-success' : 'text-danger'}">${saldoBersih >= 0 ? '+' : '-'}${UI.formatRp(Math.abs(saldoBersih))}</td>
            </tr>
          </tfoot>
        </table></div>
      </div>

      <!-- Footer -->
      <div class="card" style="text-align:center;padding:14px;margin-bottom:8px">
        <div class="text-muted" style="font-size:0.72rem">
          Digenerate oleh BudgetKu · ${new Date().toLocaleString('id-ID')} · Data YTD Tahun ${y}
        </div>
      </div>

    </div>`;
  },

  _exportFullCSV() {
    const y = this._selectedYear;
    const esc = v => `"${String(v||'').replace(/"/g,"'")}"`;
    const rows = [];

    if (this._activeTab === 'ytd') {
      const yearPrefix = `${y}-`;
      const cf = DB.getCashflow().filter(c => c.tanggal?.startsWith(yearPrefix));
      const trx = DB.getTransaksi().filter(t => t.tanggal?.startsWith(yearPrefix));
      const pengeluaran = DB.getPengeluaran().filter(p => p.tanggal?.startsWith(yearPrefix));
      const servis = DB.getServis().filter(s => s.tanggal?.startsWith(yearPrefix));

      const tripIncome = cf.filter(c => c.source_type==='TRIP').reduce((s,c)=>s+(c.nominal||0),0);
      const insentif = cf.filter(c => c.source_type==='INCENTIVE').reduce((s,c)=>s+(c.nominal||0),0);
      const alokasiServis = cf.filter(c => c.source_type==='SERVIS_ALLOC').reduce((s,c)=>s+(c.nominal||0),0);
      const totalPengeluaran = cf.filter(c => c.kategori==='PENGELUARAN').reduce((s,c)=>s+(c.nominal||0),0);
      const totalKotor = tripIncome + insentif;
      const saldoBersih = totalKotor - totalPengeluaran - alokasiServis;
      const totalServisBiaya = servis.reduce((s,sv)=>s+(sv.biaya||0),0);

      rows.push(['=== LAPORAN KEUANGAN YTD BUDGETKU ===']);
      rows.push([`Periode: Tahun ${y}`]);
      rows.push([`Digenerate: ${new Date().toLocaleString('id-ID')}`]);
      rows.push([]);

      // Ringkasan
      rows.push(['=== RINGKASAN YTD ===']);
      rows.push(['Item','Nominal']);
      rows.push(['Total Penghasilan',totalKotor]);
      rows.push(['Trip Income',tripIncome]);
      rows.push(['Insentif',insentif]);
      rows.push(['Total Pengeluaran',totalPengeluaran]);
      rows.push(['Alokasi Dana Servis',alokasiServis]);
      rows.push(['Saldo Bersih',saldoBersih]);
      rows.push(['Biaya Servis',totalServisBiaya]);
      rows.push([]);

      // Rincian Bulanan
      rows.push(['=== RINCIAN BULANAN (YTD) ===']);
      rows.push(['Bulan','Hari Kerja','Total Order','Penghasilan Kotor','Pengeluaran','Alokasi Servis','Saldo Bersih']);

      const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      for (let m = 1; m <= 12; m++) {
        const prefix = `${y}-${String(m).padStart(2,'0')}`;
        const cfMonth = cf.filter(c => c.tanggal?.startsWith(prefix));
        const trxMonth = trx.filter(t => t.tanggal?.startsWith(prefix));

        const tripM = cfMonth.filter(c => c.source_type==='TRIP').reduce((s,c)=>s+(c.nominal||0),0);
        const insentifM = cfMonth.filter(c => c.source_type==='INCENTIVE').reduce((s,c)=>s+(c.nominal||0),0);
        const alokasiM = cfMonth.filter(c => c.source_type==='SERVIS_ALLOC').reduce((s,c)=>s+(c.nominal||0),0);
        const pengeluaranM = cfMonth.filter(c => c.kategori==='PENGELUARAN').reduce((s,c)=>s+(c.nominal||0),0);
        const kotorM = tripM + insentifM;
        const bersihM = kotorM - pengeluaranM - alokasiM;
        const kerjaM = trxMonth.filter(t=>t.status_operasi==='WORKING').length;
        const orderM = trxMonth.reduce((s,t)=>s+(t.jumlah_orderan||0),0);

        rows.push([
          monthNames[m-1],
          `${kerjaM} hari`,
          orderM,
          kotorM,
          pengeluaranM,
          alokasiM,
          bersihM
        ]);
      }

      const csv = rows.map(r => r.map(esc).join(',')).join('\n');
      const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_BudgetKu_YTD_${y}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      UI.toast(`Laporan YTD Tahun ${y} berhasil didownload!`, 'success');

    } else {
      const m = this._selectedMonth;
      const prefix = `${y}-${String(m).padStart(2,'0')}`;
      const monthName = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m-1];

      const trx   = DB.getTransaksi().filter(t=>t.tanggal?.startsWith(prefix)).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
      const cf    = DB.getCashflow().filter(c=>c.tanggal?.startsWith(prefix)).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
      const peng  = DB.getPengeluaran().filter(p=>p.tanggal?.startsWith(prefix)).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
      const serv  = DB.getServis().filter(s=>s.tanggal?.startsWith(prefix)).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));

      rows.push(['=== LAPORAN KEUANGAN BUDGETKU ===']);
      rows.push([`Periode: ${monthName} ${y}`]);
      rows.push([`Digenerate: ${new Date().toLocaleString('id-ID')}`]);
      rows.push([]);

      // Summary
      const tripInc = cf.filter(c=>c.source_type==='TRIP').reduce((s,c)=>s+(c.nominal||0),0);
      const insentif = cf.filter(c=>c.source_type==='INCENTIVE').reduce((s,c)=>s+(c.nominal||0),0);
      const alokasi  = cf.filter(c=>c.source_type==='SERVIS_ALLOC').reduce((s,c)=>s+(c.nominal||0),0);
      const pengeluaranTotal = cf.filter(c=>c.kategori==='PENGELUARAN').reduce((s,c)=>s+(c.nominal||0),0);
      const totalKotor = tripInc + insentif;
      const saldoBersih = totalKotor - pengeluaranTotal - alokasi;
      rows.push(['=== RINGKASAN ===']);
      rows.push(['Item','Nominal']);
      rows.push(['Total Penghasilan',totalKotor]);
      rows.push(['Trip Income',tripInc]);
      rows.push(['Insentif',insentif]);
      rows.push(['Total Pengeluaran',pengeluaranTotal]);
      rows.push(['Alokasi Dana Servis',alokasi]);
      rows.push(['Saldo Bersih',saldoBersih]);
      rows.push(['Biaya Servis',serv.reduce((s,sv)=>s+(sv.biaya||0),0)]);
      rows.push([]);

      // Transaksi
      rows.push(['=== TRANSAKSI HARIAN ===']);
      rows.push(['Tanggal','Status','Jumlah Order','Jam Mulai','Jam Selesai','Penghasilan Kotor','Insentif','Keterangan']);
      trx.forEach(t => rows.push([t.tanggal,t.status_operasi,t.jumlah_orderan||0,t.jam_mulai||'',t.jam_selesai||'',t.penghasilan_kotor||0,t.insentif||0,t.keterangan||'']));
      rows.push([]);

      // Cashflow
      rows.push(['=== ARUS KAS ===']);
      rows.push(['Tanggal','Tipe','Kategori','Tujuan Dana','Nominal','Keterangan']);
      cf.forEach(c => rows.push([c.tanggal,c.source_type,c.kategori,c.tujuan_dana||'',c.nominal,c.keterangan||'']));
      rows.push([]);

      // Pengeluaran
      if (peng.length) {
        rows.push(['=== PENGELUARAN ===']);
        rows.push(['Tanggal','Kategori','Nominal','Keterangan']);
        peng.forEach(p => rows.push([p.tanggal,p.kategori||'Umum',p.nominal,p.keterangan||'']));
        rows.push([]);
      }

      // Servis
      if (serv.length) {
        rows.push(['=== BIAYA SERVIS ===']);
        rows.push(['Tanggal','Nama Servis','Biaya','Keterangan']);
        serv.forEach(s => rows.push([s.tanggal,s.nama_servis||'-',s.biaya,s.keterangan||'']));
      }

      const csv = rows.map(r => r.map(esc).join(',')).join('\n');
      const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_BudgetKu_${monthName}${y}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      UI.toast(`Laporan ${monthName} ${y} berhasil didownload!`, 'success');
    }
  },
};
