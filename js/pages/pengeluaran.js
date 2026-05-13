/* Pengeluaran Page — Balanced Layout */
Pages.pengeluaran = {
  render() {
    const el = document.getElementById('page-pengeluaran');
    const list = DB.getPengeluaran();
    const total = list.reduce((s, p) => s + (p.nominal || 0), 0);

    // Per-kategori breakdown
    const byKat = {};
    list.forEach(p => { byKat[p.kategori] = (byKat[p.kategori]||0) + (p.nominal||0); });
    const topKat = Object.entries(byKat).sort((a,b) => b[1]-a[1])[0];

    el.innerHTML = `
      <!-- Summary Strip -->
      <div class="page-summary-strip">
        <div class="mini-stat">
          <div class="mini-stat-label">💸 Total Pengeluaran</div>
          <div class="mini-stat-val text-danger">${UI.formatRp(total)}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${list.length} transaksi</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">📌 Terbesar</div>
          <div class="mini-stat-val text-warning">${topKat ? topKat[0] : '-'}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${topKat ? UI.formatRp(topKat[1]) : ''}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">📅 Bulan Ini</div>
          <div class="mini-stat-val text-primary">${UI.formatRp(this._monthTotal(list))}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">dari ${this._monthCount(list)} entri</div>
        </div>
      </div>

      <!-- 2-col: Form + List -->
      <div class="page-2col">
        <!-- Form -->
        <div class="card page-2col-form">
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

          <!-- Breakdown per kategori -->
          ${Object.keys(byKat).length ? `
          <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px">
            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px">Breakdown Kategori</div>
            ${Object.entries(byKat).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:0.8rem">${k}</span>
                <span class="text-danger fw-600" style="font-size:0.82rem">${UI.formatRp(v)}</span>
              </div>
              <div class="progress-bar" style="margin-bottom:8px">
                <div class="progress-fill danger" style="width:${Math.round((v/total)*100)}%"></div>
              </div>
            `).join('')}
          </div>` : ''}
        </div>

        <!-- List -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div class="card-title">💸 Riwayat Pengeluaran</div>
            <span class="text-danger fw-600">${UI.formatRp(total)}</span>
          </div>
          <div id="pengeluaranList">${this._renderList(list)}</div>
        </div>
      </div>
    `;

    document.getElementById('formPengeluaran').addEventListener('submit', e => {
      e.preventDefault();
      const tanggal   = document.getElementById('pngTanggal').value;
      const kategori  = document.getElementById('pngKategori').value;
      const nominal   = parseFloat(document.getElementById('pngNominal').value) || 0;
      const keterangan = document.getElementById('pngKet').value || kategori;
      if (!nominal) return UI.toast('Nominal wajib diisi', 'error');
      DB.insertPengeluaran({ tanggal, kategori, nominal, keterangan });
      UI.toast('Pengeluaran dicatat', 'success');
      Pages.pengeluaran.render();
    });
  },

  _monthTotal(list) {
    const prefix = new Date().toISOString().slice(0,7);
    return list.filter(p => p.tanggal?.startsWith(prefix)).reduce((s,p)=>s+(p.nominal||0),0);
  },
  _monthCount(list) {
    const prefix = new Date().toISOString().slice(0,7);
    return list.filter(p => p.tanggal?.startsWith(prefix)).length;
  },

  _renderList(list) {
    const rev = list.slice().sort((a, b) => {
      const diff = new Date(b.tanggal) - new Date(a.tanggal);
      return diff !== 0 ? diff : new Date(b.created_at||0) - new Date(a.created_at||0);
    });
    if (!rev.length) return UI.emptyState('💸', 'Belum ada pengeluaran dicatat');
    return `<div class="table-wrap"><table>
      <thead><tr><th>Tanggal</th><th>Kategori</th><th class="text-right">Nominal</th><th>Keterangan</th><th class="text-right">Aksi</th></tr></thead>
      <tbody>
        ${rev.map((p,i) => `<tr style="animation:fadeInUp 0.2s ease ${i*30}ms both">
          <td style="white-space:nowrap;font-size:0.82rem">${UI.formatDate(p.tanggal)}</td>
          <td><span class="badge badge-danger" style="font-size:0.68rem">${p.kategori}</span></td>
          <td class="text-right text-danger fw-600">${UI.formatRp(p.nominal)}</td>
          <td class="text-muted" style="font-size:0.78rem;max-width:150px;word-break:break-word">${p.keterangan||'-'}</td>
          <td class="text-right" style="white-space:nowrap">
            <button class="btn-icon edit" onclick="Pages.pengeluaran._edit('${p.id}')">✏️</button>
            <button class="btn-icon danger" onclick="Pages.pengeluaran._delete('${p.id}')">🗑</button>
          </td>
        </tr>`).join('')}
      </tbody>
      <tfoot><tr style="font-weight:700;border-top:2px solid var(--border)">
        <td colspan="2">TOTAL</td>
        <td class="text-right text-danger">${UI.formatRp(list.reduce((s,p)=>s+(p.nominal||0),0))}</td>
        <td colspan="2"></td>
      </tr></tfoot>
    </table></div>`;
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
            ${['Bensin','Pulsa/Data','Makan','Parkir','Lainnya'].map(k=>`<option value="${k}" ${p.kategori===k?'selected':''}>${k}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Nominal (Rp)</label><input type="number" id="epNominal" class="form-control" value="${p.nominal}" required></div>
        <div class="form-group"><label class="form-label">Keterangan</label><input type="text" id="epKet" class="form-control" value="${p.keterangan||''}"></div>
      </form>
    `, `<button class="btn btn-outline" onclick="UI.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.pengeluaran._saveEdit('${id}')">Simpan</button>`);
  },

  _saveEdit(id) {
    const tanggal    = document.getElementById('epTanggal').value;
    const kategori   = document.getElementById('epKategori').value;
    const nominal    = parseFloat(document.getElementById('epNominal').value) || 0;
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
