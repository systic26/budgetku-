/* Dashboard Page */
window.Pages = window.Pages || {};
Pages.dashboard = {
  render() {
    const el = document.getElementById('page-dashboard');
    const s = DB.getDashboardSummary();
    const ds = s.danaServis;
    const dsPct = ds.masuk > 0 ? Math.round((ds.keluar / ds.masuk) * 100) : 0;
    const rasio = parseFloat(s.rasioUtang);
    const debtWarn = rasio > 1.0;

    el.innerHTML = `
      ${debtWarn ? `<div class="alert-debt">
        <div class="alert-debt-icon">🚨</div>
        <div class="alert-debt-text">Rasio Utang/Bersih ${rasio}× — Utang melebihi saldo bersih Anda! Harap segera dilunasi.</div>
      </div>` : ''}

      <!-- STAT CARDS ROW 1 -->
      <div class="grid-4 mb-24">
        ${statCard('primary', '💰', 'Saldo Kotor', s.saldoKotor,
          `<div class="stat-breakdown">
            <div class="breakdown-row"><span class="breakdown-label">Trip</span><span class="breakdown-val text-primary">${UI.formatRp(s.tripIncome)}</span></div>
            <div class="breakdown-row"><span class="breakdown-label">Insentif</span><span class="breakdown-val text-primary">${UI.formatRp(s.insentifIncome)}</span></div>
          </div>`)}
        ${statCard('success', '✅', 'Saldo Bersih', s.saldoBersih,
          `<div class="stat-meta">Setelah pengeluaran & alokasi servis</div>`)}
        ${statCard('warning', '🔧', 'Dana Servis', ds.sisa,
          `<div class="progress-wrap">
            <div class="progress-labels"><span>Terpakai ${dsPct}%</span><span>${UI.formatRp(ds.masuk)} terkumpul</span></div>
            <div class="progress-bar"><div class="progress-fill ${dsPct > 80 ? 'danger' : 'warning'}" style="width:${Math.min(dsPct,100)}%"></div></div>
          </div><div class="stat-meta mt-4" style="font-size:0.7rem;color:var(--text-muted)">⚠ Alokasi hanya dari hari kerja</div>`)}
        ${statCard('danger', '🏦', 'Total Utang', s.totalUtang,
          `<div class="stat-meta">Rasio Utang/Bersih: ${s.rasioUtang}×</div>`)}
      </div>

      <!-- ROW 2: Charts + Stats -->
      <div class="grid-2 mb-24">
        <!-- Distribusi Penghasilan -->
        <div class="card">
          <div class="card-title">📊 Distribusi Penghasilan</div>
          <div id="pieChart"></div>
        </div>

        <!-- Statistik -->
        <div class="card">
          <div class="card-title">📈 Statistik Operasional</div>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
            ${statRow('Margin Bersih', s.marginBersih + '%', s.marginBersih >= 30 ? 'success' : 'warning')}
            ${statRow('Rata-rata Pendapatan/Hari', UI.formatRp(s.rataRataPendapatan), 'primary')}
            ${statRow('Rata-rata Pengeluaran/Hari', UI.formatRp(s.rataRataPengeluaran), 'warning')}
            ${statRow('Total Hari Kerja', s.hariKerja + ' hari', 'success')}
            ${statRow('Total Alokasi Servis', UI.formatRp(s.alokasiServis), 'warning')}
            ${statRow('Rasio Utang/Bersih', s.rasioUtang + '×', rasio > 1 ? 'danger' : 'success')}
          </div>
        </div>
      </div>

      <!-- ROW 3: Recent Transactions -->
      <div class="section-header">
        <div class="section-title">📋 Transaksi Terbaru</div>
        <button class="btn btn-outline btn-sm" onclick="UI.navigateTo('riwayat')">Lihat Semua</button>
      </div>
      <div class="card">
        ${renderRecentTransaksi()}
      </div>
    `;

    // Render pie chart
    UI.renderPieChart('pieChart', [
      { label: 'Penghasilan Trip', value: s.tripIncome, color: 'var(--primary)' },
      { label: 'Insentif', value: s.insentifIncome, color: 'var(--purple)' },
    ]);
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
        <div class="form-group"><label class="form-label">Keterangan</label><input type="text" id="etKet" class="form-control" value="${t.keterangan || ''}"></div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.dashboard._saveEditTransaksi(${id})">Simpan</button>`);
  },

  _saveEditTransaksi(id) {
    const tanggal = document.getElementById('etTanggal').value;
    const jumlah_orderan = parseInt(document.getElementById('etOrderan').value) || 0;
    const penghasilan_kotor = parseFloat(document.getElementById('etKotor').value) || 0;
    const insentif = parseFloat(document.getElementById('etInsentif').value) || 0;
    const keterangan = document.getElementById('etKet').value;
    
    // Delete old
    DB.deleteTransaksi(id);
    
    // Insert new
    Engine.prosesTransaksi({
      tanggal,
      jam_mulai: '00:00', jam_selesai: '00:00',
      jumlah_orderan, penghasilan_kotor, insentif, keterangan,
      status_override: jumlah_orderan > 0 ? 'WORKING' : 'OFF'
    });
    
    UI.closeModal();
    UI.toast('Transaksi berhasil diubah', 'success');
    Pages.dashboard.render();
  },

  _deleteTransaksi(id) {
    UI.confirm('Hapus transaksi ini?', () => {
      DB.deleteTransaksi(id);
      UI.toast('Transaksi dihapus', 'info');
      Pages.dashboard.render();
    });
  }
};

function statCard(type, icon, label, value, extra = '') {
  return `<div class="stat-card ${type}">
    <div class="stat-icon">${icon}</div>
    <div class="stat-label">${label}</div>
    <div class="stat-value ${type}">${UI.formatRp(value)}</div>
    ${extra}
  </div>`;
}

function statRow(label, value, colorClass = '') {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
    <span style="font-size:0.82rem;color:var(--text-secondary)">${label}</span>
    <span style="font-size:0.88rem;font-weight:700" class="text-${colorClass}">${value}</span>
  </div>`;
}

function renderRecentTransaksi() {
  const list = DB.getTransaksi().slice().sort((a, b) => {
    const diff = new Date(b.tanggal) - new Date(a.tanggal);
    return diff !== 0 ? diff : new Date(b.created_at||0) - new Date(a.created_at||0);
  }).slice(0, 8);
  if (!list.length) return UI.emptyState('📭', 'Belum ada transaksi. Mulai catat hari ini!');
  return `<div class="table-wrap"><table>
    <thead><tr>
      <th>Tanggal</th><th>Status</th><th>Orderan</th>
      <th>Penghasilan</th><th>Insentif</th><th>Alokasi Servis</th>
      <th style="text-align:right">Aksi</th>
    </tr></thead>
    <tbody>
      ${list.map(t => {
        const cf = DB.getCashflow().filter(c => c.transaksi_id === t.id);
        const alok = cf.filter(c => c.source_type === 'SERVIS_ALLOC').reduce((s,c)=>s+c.nominal,0);
        return `<tr>
          <td>${UI.formatDate(t.tanggal)}</td>
          <td>${UI.badgeStatus(t.status_operasi)}</td>
          <td>${t.jumlah_orderan || 0}</td>
          <td class="text-success fw-600">${UI.formatRp(t.penghasilan_trip || t.penghasilan_kotor)}</td>
          <td class="text-primary fw-600">${t.insentif > 0 ? UI.formatRp(t.insentif) : '<span class="text-muted">-</span>'}</td>
          <td class="text-warning">${alok > 0 ? UI.formatRp(alok) : '<span class="text-muted">-</span>'}</td>
          <td style="text-align:right">
            <button class="btn-icon edit" onclick="Pages.dashboard._editTransaksi(${t.id})">✏️</button>
            <button class="btn-icon danger" onclick="Pages.dashboard._deleteTransaksi(${t.id})">🗑</button>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}
