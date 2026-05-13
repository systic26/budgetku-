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

    const totalLunas = list.filter(u=>u.lunas).reduce((s,u)=>s+(u.nominal||0),0);
    const today = UI.todayISO();

    el.innerHTML = `
      ${warn ? `<div class="alert-debt mb-16">
        <div class="alert-debt-icon">🚨</div>
        <div class="alert-debt-text">Rasio Utang/Bersih ${rasio}× — Utang melebihi saldo bersih Anda!</div>
      </div>` : ''}

      <!-- Summary Strip -->
      <div class="page-summary-strip">
        <div class="mini-stat">
          <div class="mini-stat-label">🏦 Total Utang Aktif</div>
          <div class="mini-stat-val text-danger">${UI.formatRp(totalAktif)}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${aktif.length} tagihan belum lunas</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">✅ Sudah Dilunasi</div>
          <div class="mini-stat-val text-success">${UI.formatRp(totalLunas)}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${list.filter(u=>u.lunas).length} tagihan lunas</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">⚠️ Rasio Utang</div>
          <div class="mini-stat-val ${warn?'text-danger':'text-success'}">${rasio}×</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${warn?'⚠️ Berbahaya':'✅ Aman'}</div>
        </div>
      </div>

      <!-- 2-col layout -->
      <div class="page-2col">
        <!-- Form -->
        <div class="card page-2col-form">
          <div class="card-title mb-16">➕ Tambah Utang</div>
          <form id="formUtang">
            <div class="form-group">
              <label class="form-label">Tanggal</label>
              <input type="date" class="form-control" id="utgTanggal" value="${today}" required />
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
      if (a.lunas !== b.lunas) return a.lunas ? 1 : -1;
      const diff = new Date(b.tanggal) - new Date(a.tanggal);
      return diff !== 0 ? diff : new Date(b.created_at||0) - new Date(a.created_at||0);
    });
    const today = new Date();
    return `<div class="table-wrap"><table>
      <thead><tr><th>Tanggal</th><th>Sumber</th><th class="text-right">Nominal</th><th>Jatuh Tempo</th><th>Status</th><th class="text-right">Aksi</th></tr></thead>
      <tbody>
        ${sortedList.map((u,i) => {
          const jt = u.jatuh_tempo ? new Date(u.jatuh_tempo+'T00:00:00') : null;
          const overdue = jt && !u.lunas && jt < today;
          return `<tr style="animation:fadeInUp 0.2s ease ${i*30}ms both;opacity:${u.lunas?0.55:1}">
            <td style="white-space:nowrap;font-size:0.82rem">${UI.formatDate(u.tanggal)}</td>
            <td>
              <div class="fw-600" style="font-size:0.85rem;${u.lunas?'text-decoration:line-through':''};">${u.sumber}</div>
              ${u.keterangan?`<div class="text-muted" style="font-size:0.72rem">${u.keterangan}</div>`:''}
            </td>
            <td class="text-right fw-600 ${u.lunas?'text-muted':'text-danger'}">${UI.formatRp(u.nominal)}</td>
            <td style="white-space:nowrap;font-size:0.8rem">
              ${jt ? `<span class="${overdue?'text-danger fw-600':'text-muted'}">${overdue?'⚠️ ':''} ${UI.formatDate(u.jatuh_tempo)}</span>` : '<span class="text-muted">—</span>'}
            </td>
            <td>${u.lunas?'<span class="badge badge-success">✅ Lunas</span>':'<span class="badge badge-danger">Aktif</span>'}</td>
            <td class="text-right" style="white-space:nowrap">
              ${!u.lunas?`<button class="btn btn-sm btn-success" onclick="Pages.utang._lunas('${u.id}')">Lunas</button>`:''}
              <button class="btn-icon edit" onclick="Pages.utang._edit('${u.id}')">✏️</button>
              <button class="btn-icon danger" onclick="Pages.utang._delete('${u.id}')">🗑</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot><tr style="font-weight:700;border-top:2px solid var(--border)">
        <td colspan="2">TOTAL AKTIF</td>
        <td class="text-right text-danger">${UI.formatRp(list.filter(u=>!u.lunas).reduce((s,u)=>s+(u.nominal||0),0))}</td>
        <td colspan="3"></td>
      </tr></tfoot>
    </table></div>`;
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
