/* Servis Page */
Pages.servis = {
  render() {
    const el = document.getElementById('page-servis');
    const ds = DB.getDanaServisBalance();
    const dsPct = ds.masuk > 0 ? Math.round((ds.keluar / ds.masuk) * 100) : 0;
    el.innerHTML = `
      <div class="grid-2 mb-24">
        <div class="stat-card warning">
          <div class="stat-label">Dana Servis Tersimpan</div>
          <div class="stat-value warning">${UI.formatRp(ds.masuk)}</div>
          <div class="stat-meta">Total yang dialokasikan</div>
        </div>
        <div class="stat-card ${dsPct > 80 ? 'danger' : 'success'}">
          <div class="stat-label">Sisa Dana Servis</div>
          <div class="stat-value ${dsPct > 80 ? 'danger' : 'success'}">${UI.formatRp(ds.sisa)}</div>
          <div class="progress-wrap">
            <div class="progress-labels"><span>Terpakai ${dsPct}%</span><span>${UI.formatRp(ds.keluar)} dipakai</span></div>
            <div class="progress-bar"><div class="progress-fill ${dsPct > 80 ? 'danger' : 'success'}" style="width:${Math.min(dsPct,100)}%"></div></div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Form Servis -->
        <div class="card">
          <div class="card-title mb-16">➕ Catat Pengeluaran Servis</div>
          <form id="formServis">
            <div class="form-group">
              <label class="form-label">Tanggal</label>
              <input type="date" class="form-control" id="srvTanggal" value="${UI.todayISO()}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nama Servis / Kerusakan</label>
              <input type="text" class="form-control" id="srvNama" placeholder="contoh: Ganti ban dalam, Oli mesin" required />
            </div>
            <div class="form-group">
              <label class="form-label">Biaya (Rp)</label>
              <input type="number" class="form-control" id="srvBiaya" placeholder="0" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Keterangan Tambahan</label>
              <input type="text" class="form-control" id="srvKet" placeholder="bengkel, merk, dll" />
            </div>
            <button type="submit" class="btn btn-warning btn-full">🔧 Simpan Pengeluaran Servis</button>
          </form>
        </div>

        <!-- Riwayat Servis -->
        <div class="card">
          <div class="card-title mb-12">🔧 Riwayat Servis</div>
          <div id="servisList">${this._renderList()}</div>
        </div>
      </div>
    `;

    document.getElementById('formServis').addEventListener('submit', e => {
      e.preventDefault();
      const tanggal = document.getElementById('srvTanggal').value;
      const nama_servis = document.getElementById('srvNama').value;
      const biaya = parseFloat(document.getElementById('srvBiaya').value) || 0;
      const keterangan = document.getElementById('srvKet').value;
      if (!nama_servis || biaya <= 0) return UI.toast('Isi semua field dengan benar', 'error');
      const ds2 = DB.getDanaServisBalance();
      if (biaya > ds2.sisa) {
        UI.toast('⚠️ Biaya melebihi sisa dana servis!', 'warning');
      }
      DB.insertServis({ tanggal, nama_servis, biaya, keterangan });
      UI.toast('Pengeluaran servis berhasil dicatat', 'success');
      Pages.servis.render();
    });
  },

  _renderList() {
    const list = DB.getServis().slice().sort((a, b) => {
      const diff = new Date(b.tanggal) - new Date(a.tanggal);
      return diff !== 0 ? diff : new Date(b.created_at||0) - new Date(a.created_at||0);
    });
    if (!list.length) return UI.emptyState('🔧', 'Belum ada riwayat servis');
    return `<div style="display:flex;flex-direction:column;gap:8px">
      ${list.map(s => `
        <div style="padding:10px 12px;background:var(--bg-base);border-radius:var(--radius-sm);border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <div style="font-weight:600;font-size:0.875rem">${s.nama_servis}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${UI.formatDate(s.tanggal)} ${s.keterangan ? '· ' + s.keterangan : ''}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="text-danger fw-600">${UI.formatRp(s.biaya)}</span>
              <button class="btn-icon edit" onclick="Pages.servis._edit('${s.id}')">✏️</button>
              <button class="btn-icon danger" onclick="Pages.servis._delete('${s.id}')">🗑</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;
  },

  _edit(id) {
    const s = DB.getServis().find(x => x.id === id);
    if (!s) return;
    UI.openModal('Edit Servis', `
      <form id="formEditSrv">
        <div class="form-group"><label class="form-label">Tanggal</label><input type="date" id="esTanggal" class="form-control" value="${s.tanggal}" required></div>
        <div class="form-group"><label class="form-label">Nama Servis</label><input type="text" id="esNama" class="form-control" value="${s.nama_servis}" required></div>
        <div class="form-group"><label class="form-label">Biaya (Rp)</label><input type="number" id="esBiaya" class="form-control" value="${s.biaya}" required></div>
        <div class="form-group"><label class="form-label">Keterangan</label><input type="text" id="esKet" class="form-control" value="${s.keterangan || ''}"></div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.servis._saveEdit('${id}')">Simpan</button>`);
  },

  _saveEdit(id) {
    const tanggal = document.getElementById('esTanggal').value;
    const nama_servis = document.getElementById('esNama').value;
    const biaya = parseFloat(document.getElementById('esBiaya').value) || 0;
    const keterangan = document.getElementById('esKet').value;
    if (!nama_servis || !biaya) return UI.toast('Nama dan biaya wajib diisi', 'error');
    
    DB.updateServis(id, { tanggal, nama_servis, biaya, keterangan });
    UI.closeModal();
    UI.toast('Servis diubah', 'success');
    Pages.servis.render();
  },

  _delete(id) {
    UI.confirm('Hapus riwayat servis ini?', () => {
      DB.deleteServis(id);
      UI.toast('Riwayat servis dihapus', 'info');
      Pages.servis.render();
    });
  },
};
