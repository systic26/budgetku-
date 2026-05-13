/* Utang Page */
Pages.utang = {
  render() {
    const el = document.getElementById('page-utang');
    const list = DB.getUtang();
    const aktif = list.filter(u => !u.lunas);
    const totalAktif = aktif.reduce((s, u) => s + (u.nominal || 0), 0);
    const saldoBersih = DB.getDashboardSummary().saldoBersih;
    const rasio = saldoBersih > 0 ? (totalAktif / saldoBersih).toFixed(2) : (totalAktif > 0 ? '∞' : '0.00');
    const warn = rasio === '∞' || parseFloat(rasio) > 1.0;

    el.innerHTML = `
      ${warn ? `<div class="alert-debt mb-24">
        <div class="alert-debt-icon">🚨</div>
        <div class="alert-debt-text">Rasio Utang/Bersih ${rasio}× — Utang melebihi saldo bersih Anda!</div>
      </div>` : ''}

      <div class="grid-2 mb-24">
        <div class="stat-card danger">
          <div class="stat-label">Total Utang Aktif</div>
          <div class="stat-value danger">${UI.formatRp(totalAktif)}</div>
          <div class="stat-meta">${aktif.length} tagihan belum lunas</div>
        </div>
        <div class="stat-card ${warn ? 'danger' : 'success'}">
          <div class="stat-label">Rasio Utang / Saldo Bersih</div>
          <div class="stat-value ${warn ? 'danger' : 'success'}">${rasio}×</div>
          <div class="stat-meta">${warn ? '⚠️ Berbahaya! > 1.0' : '✅ Aman (< 1.0)'}</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Form -->
        <div class="card">
          <div class="card-title mb-16">➕ Tambah Utang</div>
          <form id="formUtang">
            <div class="form-group">
              <label class="form-label">Tanggal</label>
              <input type="date" class="form-control" id="utgTanggal" value="${UI.todayISO()}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nama / Sumber Utang</label>
              <input type="text" class="form-control" id="utGSumber" placeholder="contoh: Pinjaman Bu Ani, Cicilan HP" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nominal (Rp)</label>
              <input type="number" class="form-control" id="utGNominal" placeholder="0" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Jatuh Tempo</label>
              <input type="date" class="form-control" id="utGJatuh" />
            </div>
            <div class="form-group">
              <label class="form-label">Keterangan</label>
              <input type="text" class="form-control" id="utGKet" placeholder="detail utang" />
            </div>
            <button type="submit" class="btn btn-danger btn-full">🏦 Simpan Utang</button>
          </form>
        </div>

        <!-- List -->
        <div class="card">
          <div class="card-title mb-12">🏦 Daftar Utang</div>
          <div id="utangList">${this._renderList(list)}</div>
        </div>
      </div>
    `;

    document.getElementById('formUtang').addEventListener('submit', e => {
      e.preventDefault();
      const tanggal = document.getElementById('utgTanggal').value;
      const sumber = document.getElementById('utGSumber').value;
      const nominal = parseFloat(document.getElementById('utGNominal').value) || 0;
      const jatuh_tempo = document.getElementById('utGJatuh').value;
      const keterangan = document.getElementById('utGKet').value;
      if (!sumber || !nominal) return UI.toast('Isi semua field wajib', 'error');
      DB.insertUtang({ tanggal, sumber, nominal, jatuh_tempo, keterangan });
      UI.toast('Utang dicatat', 'success');
      Pages.utang.render();
    });
  },

  _renderList(list) {
    if (!list.length) return UI.emptyState('🏦', 'Belum ada utang tercatat');
    const sortedList = list.slice().sort((a, b) => {
      const diff = new Date(b.tanggal) - new Date(a.tanggal);
      return diff !== 0 ? diff : new Date(b.created_at||0) - new Date(a.created_at||0);
    });
    return `<div style="display:flex;flex-direction:column;gap:8px;max-height:450px;overflow-y:auto">
      ${sortedList.map(u => `
        <div style="padding:10px 12px;background:var(--bg-base);border-radius:var(--radius-sm);border:1px solid ${u.lunas ? 'var(--border)' : 'rgba(247,111,111,0.2)'}">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
            <div style="flex:1">
              <div style="font-weight:600;font-size:0.83rem;${u.lunas ? 'opacity:0.5;text-decoration:line-through' : ''}">${u.sumber}</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">${UI.formatDate(u.tanggal)} ${u.jatuh_tempo ? '· Jatuh tempo: ' + UI.formatDate(u.jatuh_tempo) : ''}</div>
              ${u.keterangan ? `<div style="font-size:0.72rem;color:var(--text-muted)">${u.keterangan}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
              <span class="${u.lunas ? 'text-muted' : 'text-danger'} fw-600">${UI.formatRp(u.nominal)}</span>
              <div style="display:flex;gap:4px">
                ${!u.lunas ? `<button class="btn btn-sm btn-success" onclick="Pages.utang._lunas('${u.id}')">✓ Lunas</button>` : '<span class="badge badge-success">Lunas</span>'}
                <button class="btn-icon edit" onclick="Pages.utang._edit('${u.id}')">✏️</button>
                <button class="btn-icon danger" onclick="Pages.utang._delete('${u.id}')">🗑</button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;
  },

  _lunas(id) {
    DB.updateUtang(id, { lunas: true });
    UI.toast('Utang ditandai lunas ✅', 'success');
    Pages.utang.render();
  },
  _edit(id) {
    const u = DB.getUtang().find(x => x.id === id);
    if (!u) return;
    UI.openModal('Edit Utang', `
      <form id="formEditUtg">
        <div class="form-group"><label class="form-label">Tanggal</label><input type="date" id="euTanggal" class="form-control" value="${u.tanggal}" required></div>
        <div class="form-group"><label class="form-label">Sumber</label><input type="text" id="euSumber" class="form-control" value="${u.sumber}" required></div>
        <div class="form-group"><label class="form-label">Nominal (Rp)</label><input type="number" id="euNominal" class="form-control" value="${u.nominal}" required></div>
        <div class="form-group"><label class="form-label">Jatuh Tempo</label><input type="date" id="euJatuh" class="form-control" value="${u.jatuh_tempo || ''}"></div>
        <div class="form-group"><label class="form-label">Keterangan</label><input type="text" id="euKet" class="form-control" value="${u.keterangan || ''}"></div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.utang._saveEdit('${id}')">Simpan</button>`);
  },

  _saveEdit(id) {
    const tanggal = document.getElementById('euTanggal').value;
    const sumber = document.getElementById('euSumber').value;
    const nominal = parseFloat(document.getElementById('euNominal').value) || 0;
    const jatuh_tempo = document.getElementById('euJatuh').value;
    const keterangan = document.getElementById('euKet').value;
    if (!sumber || !nominal) return UI.toast('Sumber dan nominal wajib diisi', 'error');
    
    DB.updateUtang(id, { tanggal, sumber, nominal, jatuh_tempo, keterangan });
    UI.closeModal();
    UI.toast('Utang diubah', 'success');
    Pages.utang.render();
  },
  _delete(id) {
    UI.confirm('Hapus data utang ini?', () => {
      DB.deleteUtang(id);
      UI.toast('Utang dihapus', 'info');
      Pages.utang.render();
    });
  },
};
