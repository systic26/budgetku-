/* Laporan Bulanan Page — Full Detail + Enhanced Export */
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
      <div class="lap-header card mb-16">
        <div>
          <div style="font-weight:700;font-size:1rem">📄 Laporan Keuangan Bulanan</div>
          <div class="text-muted" style="font-size:0.75rem;margin-top:2px">Pilih periode & unduh laporan lengkap</div>
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
          <button class="btn btn-outline btn-sm" id="lapExportCSV">⬇️ Excel CSV</button>
        </div>
      </div>
      <div id="lapContent"></div>
    `;

    document.getElementById('lapGenerate').addEventListener('click', () => {
      this._selectedMonth = parseInt(document.getElementById('lapMonth').value);
      this._selectedYear  = parseInt(document.getElementById('lapYear').value);
      this._renderReport();
    });
    document.getElementById('lapPrint').addEventListener('click', () => window.print());
    document.getElementById('lapExportCSV').addEventListener('click', () => this._exportFullCSV());
    this._renderReport();
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
          <div style="font-size:1.4rem;font-weight:800">📋 Laporan Keuangan</div>
          <div class="text-muted mt-4">${monthName} ${y} · BudgetKu Driver Finance</div>
        </div>
        <div class="lap-period-badge">${monthName} ${y}</div>
      </div>

      <!-- 6 Summary Cards -->
      <div class="lap-summary-grid">
        ${this._summCard('💰','Total Penghasilan',totalKotor,'primary')}
        ${this._summCard('✅','Saldo Bersih',saldoBersih,saldoBersih>=0?'success':'danger')}
        ${this._summCard('💸','Total Pengeluaran',totalPengeluaran,'danger')}
        ${this._summCard('🔧','Alokasi Servis',alokasiServis,'warning')}
        ${this._summCard('⚡','Trip Income',tripIncome,'primary')}
        ${this._summCard('🎁','Insentif',insentif,'purple')}
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
        <div class="lap-section-title">📅 Semua Transaksi Harian (${trx.length} data)</div>
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
        </table></div>` : UI.emptyState('📭',`Tidak ada transaksi untuk ${monthName} ${y}`)}
      </div>

      <!-- Detail Cashflow -->
      <div class="card lap-table-card">
        <div class="lap-section-title">💳 Semua Arus Kas (${cf.length} entri)</div>
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
        </table></div>` : UI.emptyState('📭','Tidak ada cashflow')}
      </div>

      <!-- Pengeluaran detail -->
      ${pengeluaran.length ? `<div class="card lap-table-card">
        <div class="lap-section-title">💸 Pengeluaran (${pengeluaran.length} item · Total: ${UI.formatRp(totalPengeluaran)})</div>
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
        <div class="lap-section-title">🔧 Biaya Servis (${servis.length} item · Total: ${UI.formatRp(totalServisBiaya)})</div>
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

  _exportFullCSV() {
    const y = this._selectedYear;
    const m = this._selectedMonth;
    const prefix = `${y}-${String(m).padStart(2,'0')}`;
    const monthName = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m-1];

    const trx   = DB.getTransaksi().filter(t=>t.tanggal?.startsWith(prefix)).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
    const cf    = DB.getCashflow().filter(c=>c.tanggal?.startsWith(prefix)).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
    const peng  = DB.getPengeluaran().filter(p=>p.tanggal?.startsWith(prefix)).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
    const serv  = DB.getServis().filter(s=>s.tanggal?.startsWith(prefix)).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));

    const esc = v => `"${String(v||'').replace(/"/g,"'")}"`;
    const rows = [];

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
    UI.toast(`✅ Laporan ${monthName} ${y} berhasil didownload!`, 'success');
  },
};
