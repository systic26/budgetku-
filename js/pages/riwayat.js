/* Riwayat Cashflow Page */
Pages.riwayat = {
  render() {
    const el = document.getElementById('page-riwayat');
    const all = DB.getCashflow().sort((a, b) => {
      const diff = new Date(b.tanggal) - new Date(a.tanggal);
      return diff !== 0 ? diff : b.id - a.id;
    });
    el.innerHTML = `
      <div class="section-header mb-16">
        <div class="section-title">📋 Riwayat Cashflow</div>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="form-control" id="filterSource" style="width:auto;padding:6px 10px;font-size:0.8rem">
            <option value="">Semua Tipe</option>
            <option value="TRIP">Trip</option>
            <option value="INCENTIVE">Insentif</option>
            <option value="SERVIS_ALLOC">Alokasi Servis</option>
            <option value="MANUAL">Manual</option>
            <option value="PENGELUARAN">Pengeluaran</option>
            <option value="SERVIS">Servis</option>
          </select>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap" id="cashflowTable">
          ${this._renderTable(all)}
        </div>
      </div>
    `;

    document.getElementById('filterSource').addEventListener('change', function () {
      const filtered = this.value ? all.filter(c => c.source_type === this.value) : all;
      document.getElementById('cashflowTable').innerHTML = Pages.riwayat._renderTable(filtered);
    });
  },

  _renderTable(list) {
    if (!list.length) return UI.emptyState('📭', 'Belum ada data cashflow');
    return `<table>
      <thead><tr>
        <th>Tanggal</th><th>Tipe</th><th>Kategori</th>
        <th>Tujuan Dana</th><th class="text-right">Nominal</th><th>Keterangan</th>
        <th class="text-right">Aksi</th>
      </tr></thead>
      <tbody>
        ${list.map(c => {
          const isOut = c.kategori === 'PENGELUARAN' || c.kategori === 'PENGELUARAN_SERVIS';
          return `<tr>
            <td>${UI.formatDate(c.tanggal)}</td>
            <td>${UI.badgeSource(c.source_type)}</td>
            <td><span class="text-muted fs-sm">${c.kategori}</span></td>
            <td><span class="text-muted fs-sm">${c.tujuan_dana || '-'}</span></td>
            <td class="text-right fw-600 ${isOut ? 'text-danger' : 'text-success'}">
              ${isOut ? '−' : '+'}${UI.formatRp(c.nominal)}
            </td>
            <td class="text-muted fs-sm">${c.keterangan || '-'}</td>
            <td class="text-right" style="white-space:nowrap">
              <button class="btn-icon edit" onclick="Pages.riwayat._edit(${c.id})">✏️</button>
              <button class="btn-icon danger" onclick="Pages.riwayat._delete(${c.id})">🗑</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
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
        <button class="btn btn-primary" onclick="Pages.riwayat._saveEdit(${id})">Simpan</button>`);
  },

  _saveEdit(id) {
    const tanggal = document.getElementById('ecfTanggal').value;
    const kategori = document.getElementById('ecfKategori').value;
    const tujuan_dana = document.getElementById('ecfTujuan').value;
    const nominal = parseFloat(document.getElementById('ecfNominal').value) || 0;
    const keterangan = document.getElementById('ecfKet').value;
    
    DB.updateCashflow(id, { tanggal, kategori, tujuan_dana, nominal, keterangan });
    UI.closeModal();
    UI.toast('Cashflow diubah', 'success');
    Pages.riwayat.render();
  },

  _delete(id) {
    UI.confirm('Hapus data cashflow ini? Peringatan: ini mungkin membuat data tidak sinkron dengan transaksi aslinya.', () => {
      DB.deleteCashflow(id);
      UI.toast('Cashflow dihapus', 'warning');
      Pages.riwayat.render();
    });
  }
};
