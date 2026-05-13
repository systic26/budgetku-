/* Pengeluaran Page */
Pages.pengeluaran = {
  render() {
    const el = document.getElementById('page-pengeluaran');
    const list = DB.getPengeluaran();
    const total = list.reduce((s, p) => s + (p.nominal || 0), 0);
    el.innerHTML = `
      <div class="grid-2">
        <!-- Form -->
        <div class="card">
          <div class="card-title mb-16">➕ Catat Pengeluaran</div>
          <form id="formPengeluaran">
            <div class="form-group">
              <label class="form-label">Tanggal</label>
              <input type="date" class="form-control" id="pngTanggal" value="${UI.todayISO()}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Kategori</label>
              <select class="form-control" id="pngKategori">
                <option value="Bensin">⛽ Bensin</option>
                <option value="Pulsa/Data">📱 Pulsa/Data</option>
                <option value="Makan">🍱 Makan</option>
                <option value="Parkir">🅿️ Parkir</option>
                <option value="Lainnya">📌 Lainnya</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nominal (Rp)</label>
              <input type="number" class="form-control" id="pngNominal" placeholder="0" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Keterangan</label>
              <input type="text" class="form-control" id="pngKet" placeholder="detail pengeluaran" />
            </div>
            <button type="submit" class="btn btn-danger btn-full">💸 Simpan Pengeluaran</button>
          </form>
        </div>

        <!-- List -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div class="card-title">💸 Riwayat Pengeluaran</div>
            <span class="text-danger fw-600">${UI.formatRp(total)}</span>
          </div>
          <div id="pengeluaranList">${this._renderList(list)}</div>
        </div>
      </div>
    `;

    document.getElementById('formPengeluaran').addEventListener('submit', e => {
      e.preventDefault();
      const tanggal = document.getElementById('pngTanggal').value;
      const kategori = document.getElementById('pngKategori').value;
      const nominal = parseFloat(document.getElementById('pngNominal').value) || 0;
      const keterangan = document.getElementById('pngKet').value || kategori;
      if (!nominal) return UI.toast('Nominal wajib diisi', 'error');
      DB.insertPengeluaran({ tanggal, kategori, nominal, keterangan });
      UI.toast('Pengeluaran dicatat', 'success');
      Pages.pengeluaran.render();
    });
  },

  _renderList(list) {
    const rev = list.slice().sort((a, b) => {
      const diff = new Date(b.tanggal) - new Date(a.tanggal);
      return diff !== 0 ? diff : new Date(b.created_at||0) - new Date(a.created_at||0);
    });
    if (!rev.length) return UI.emptyState('💸', 'Belum ada pengeluaran');
    return `<div style="display:flex;flex-direction:column;gap:8px;max-height:420px;overflow-y:auto">
      ${rev.map(p => `
        <div style="padding:9px 12px;background:var(--bg-base);border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;font-size:0.83rem">${p.kategori}</div>
            <div style="font-size:0.72rem;color:var(--text-muted)">${UI.formatDate(p.tanggal)} ${p.keterangan ? '· ' + p.keterangan : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="text-danger fw-600">${UI.formatRp(p.nominal)}</span>
            <button class="btn-icon edit" onclick="Pages.pengeluaran._edit('${p.id}')">✏️</button>
            <button class="btn-icon danger" onclick="Pages.pengeluaran._delete('${p.id}')">🗑</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  },

  _edit(id) {
    const p = DB.getPengeluaran().find(x => x.id === id);
    if (!p) return;
    UI.openModal('Edit Pengeluaran', `
      <form id="formEditPng">
        <div class="form-group"><label class="form-label">Tanggal</label><input type="date" id="epTanggal" class="form-control" value="${p.tanggal}" required></div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select id="epKategori" class="form-control">
            <option value="Bensin" ${p.kategori==='Bensin'?'selected':''}>Bensin</option>
            <option value="Pulsa/Data" ${p.kategori==='Pulsa/Data'?'selected':''}>Pulsa/Data</option>
            <option value="Makan" ${p.kategori==='Makan'?'selected':''}>Makan</option>
            <option value="Parkir" ${p.kategori==='Parkir'?'selected':''}>Parkir</option>
            <option value="Lainnya" ${p.kategori==='Lainnya'?'selected':''}>Lainnya</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Nominal (Rp)</label><input type="number" id="epNominal" class="form-control" value="${p.nominal}" required></div>
        <div class="form-group"><label class="form-label">Keterangan</label><input type="text" id="epKet" class="form-control" value="${p.keterangan || ''}"></div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.pengeluaran._saveEdit('${id}')">Simpan</button>`);
  },

  _saveEdit(id) {
    const tanggal = document.getElementById('epTanggal').value;
    const kategori = document.getElementById('epKategori').value;
    const nominal = parseFloat(document.getElementById('epNominal').value) || 0;
    const keterangan = document.getElementById('epKet').value || kategori;
    if (!nominal) return UI.toast('Nominal wajib diisi', 'error');
    
    DB.updatePengeluaran(id, { tanggal, kategori, nominal, keterangan });
    UI.closeModal();
    UI.toast('Pengeluaran diubah', 'success');
    Pages.pengeluaran.render();
  },

  _delete(id) {
    UI.confirm('Hapus pengeluaran ini?', () => {
      DB.deletePengeluaran(id);
      UI.toast('Pengeluaran dihapus', 'info');
      Pages.pengeluaran.render();
    });
  },
};
