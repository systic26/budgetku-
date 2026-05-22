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
        <div class="card form-sticky">
          <div class="card-title mb-16"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>Catat Pengeluaran Servis</div>
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
            <button type="submit" class="btn btn-warning btn-full"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Simpan Pengeluaran Servis</button>
          </form>
        </div>

        <!-- Riwayat Servis -->
        <div class="card">
          <div class="card-title mb-12"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px;color:var(--warning)"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>Riwayat Servis</div>
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
        UI.toast('Biaya melebihi sisa dana servis!', 'warning');
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
    if (!list.length) return UI.emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>', 'Belum ada riwayat servis');
    return `<div class="table-wrap"><table>
      <thead><tr><th>Tanggal</th><th>Servis</th><th class="text-right">Biaya</th><th class="text-right">Aksi</th></tr></thead>
      <tbody>
        ${list.map(s => `<tr>
          <td style="white-space:nowrap">
            <div class="fw-500" style="font-size:0.82rem">${UI.formatDate(s.tanggal)}</div>
          </td>
          <td>
            <div class="fw-600" style="font-size:0.85rem">${s.nama_servis}</div>
            <div class="text-muted" style="font-size:0.72rem">${s.keterangan||''}</div>
          </td>
          <td class="text-right text-warning fw-600" style="white-space:nowrap">${UI.formatRp(s.biaya)}</td>
          <td class="text-right" style="white-space:nowrap">
            <button class="btn-icon edit" onclick="Pages.servis._edit('${s.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-icon danger" onclick="Pages.servis._delete('${s.id}')" title="Hapus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
          </td>
        </tr>`).join('')}
      </tbody>
      <tfoot><tr style="border-top:2px solid var(--border);font-weight:700">
        <td colspan="2">Total Biaya Servis</td>
        <td class="text-right text-warning">${UI.formatRp(list.reduce((s,x)=>s+(x.biaya||0),0))}</td>
        <td></td>
      </tr></tfoot>
    </table></div>`;
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
