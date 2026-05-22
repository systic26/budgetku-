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
        <div class="alert-debt-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:22px;height:22px;color:var(--danger)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
        <div class="alert-debt-text">Rasio Utang/Bersih ${rasio}× — Utang melebihi saldo bersih Anda!</div>
      </div>` : ''}

      <!-- Summary Strip -->
      <div class="page-summary-strip">
        <div class="mini-stat">
          <div class="mini-stat-label">Total Utang Aktif</div>
          <div class="mini-stat-val text-danger">${UI.formatRp(totalAktif)}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${aktif.length} tagihan belum lunas</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">Sudah Dilunasi</div>
          <div class="mini-stat-val text-success">${UI.formatRp(totalLunas)}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${list.filter(u=>u.lunas).length} tagihan lunas</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">Rasio Utang</div>
          <div class="mini-stat-val ${warn?'text-danger':'text-success'}">${rasio}×</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${warn?'Berbahaya':'Aman'}</div>
        </div>
      </div>

      <!-- 2-col layout -->
      <div class="page-2col">
        <!-- Form -->
        <div class="card page-2col-form">
          <div class="card-title mb-16"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>Tambah Utang</div>
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
            <button type="submit" class="btn btn-danger btn-full"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Simpan Utang</button>
          </form>
        </div>

        <!-- List -->
        <div class="card">
          <div class="card-title mb-12"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:8px"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Daftar Utang</div>
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
    if (!list.length) return UI.emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>', 'Belum ada utang tercatat');
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
              ${jt ? `<span class="${overdue?'text-danger fw-600':'text-muted'}">${overdue?'! ':''} ${UI.formatDate(u.jatuh_tempo)}</span>` : '<span class="text-muted">—</span>'}
            </td>
            <td>${u.lunas?'<span class="badge badge-success">Lunas</span>':'<span class="badge badge-danger">Aktif</span>'}</td>
            <td class="text-right" style="white-space:nowrap">
              ${!u.lunas?`<button class="btn btn-sm btn-success" onclick="Pages.utang._lunas('${u.id}')">Lunas</button>`:''}
              <button class="btn-icon edit" onclick="Pages.utang._edit('${u.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="btn-icon danger" onclick="Pages.utang._delete('${u.id}')" title="Hapus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
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
    UI.toast('Utang ditandai lunas', 'success');
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
