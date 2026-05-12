/**
 * DB — LocalStorage-based database layer
 * Semua data disimpan di localStorage dengan key prefiks "bk_"
 */
const DB = (() => {
  const KEYS = {
    transaksi:    'bk_transaksi',
    cashflow:     'bk_cashflow',
    dana_servis:  'bk_dana_servis',
    servis:       'bk_servis',
    pengeluaran:  'bk_pengeluaran',
    utang:        'bk_utang',
    alokasi:      'bk_alokasi',
    settings:     'bk_settings',
  };

  /* ---- SUPABASE SYNC SETUP ---- */
  const SUPABASE_URL = 'https://yabxsvdehmgsujtzbdar.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYnhzdmRlaG1nc3VqdHpiZGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTk0MjcsImV4cCI6MjA5NDA5NTQyN30.ubyyNwzKqsw-UW-PqhRPGjiAPd9M1UUSSihgJ8G68R8';
  let supabase = null;
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  function _sync(table, data, action = 'UPSERT') {
    if (!supabase) {
      if (window.UI) UI.toast('Supabase SDK tidak termuat. Periksa koneksi internet.', 'error');
      return;
    }
    setTimeout(async () => {
      try {
        let err = null;
        if (action === 'UPSERT') {
          const { error } = await supabase.from(table).upsert(data);
          err = error;
        } else if (action === 'DELETE') {
          const { error } = await supabase.from(table).delete().eq('id', data.id);
          err = error;
        }
        if (err) {
          console.error('Sync failed for', table, err);
          if (window.UI) UI.toast(`Gagal Sync ke Supabase (${table}): ` + err.message, 'error');
        }
      } catch (e) {
        console.error(e);
        if (window.UI) UI.toast('Error jaringan saat sync: ' + e.message, 'error');
      }
    }, 100);
  }


  /* ---- GENERIC ---- */
  function _load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }
  function _loadObj(key, def = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || def; }
    catch { return def; }
  }
  function _save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  function _nextId() {
    return crypto.randomUUID();
  }

  /* ---- SETTINGS ---- */
  function getSettings() {
    return _loadObj(KEYS.settings, {
      alokasi_servis_harian: 10000,
      alokasi_tipe: 'NOMINAL_TETAP', // atau 'PERSENTASE'
      alokasi_persen: 10,
      nama_driver: 'Driver',
      target_harian: 150000,
    });
  }
  function saveSettings(data) {
    const newSettings = { ...getSettings(), ...data };
    _save(KEYS.settings, newSettings);
    // _sync('settings', { ...newSettings, id: newSettings.id || _nextId() });
  }

  /* ---- ALOKASI RULES ---- */
  function getAlokasiRules() {
    let rules = _load(KEYS.alokasi);
    if (rules.length === 0) {
      // Default rule
      rules = [{
        id: 1,
        nama_alokasi: 'Dana Servis Harian',
        tipe: 'NOMINAL_TETAP',
        nilai: 10000,
        sumber_dana: 'PENGHASILAN_TRIP',
        tujuan: 'DANA_SERVIS',
        aktif: true,
        hanya_hari_kerja: true,
        created_at: new Date().toISOString(),
      }];
      _save(KEYS.alokasi, rules);
    }
    return rules;
  }
  function saveAlokasiRule(rule) {
    const rules = getAlokasiRules();
    const idx = rules.findIndex(r => r.id === rule.id);
    if (idx >= 0) rules[idx] = rule;
    else rules.push({ ...rule, id: _nextId(rules) });
    _save(KEYS.alokasi, rules);
  }

  /* ---- TRANSAKSI ---- */
  function getTransaksi() { return _load(KEYS.transaksi); }
  function getTransaksiById(id) { return getTransaksi().find(t => t.id === id); }
  function insertTransaksi(data) {
    const list = getTransaksi();
    const rec = { ...data, id: _nextId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    list.push(rec);
    _save(KEYS.transaksi, list);
    _sync('transaksi', rec);
    return rec;
  }
  function updateTransaksi(id, data) {
    const list = getTransaksi();
    const idx = list.findIndex(t => t.id === id);
    if (idx < 0) throw new Error('Transaksi tidak ditemukan');
    list[idx] = { ...list[idx], ...data, updated_at: new Date().toISOString() };
    _save(KEYS.transaksi, list);
    _sync('transaksi', list[idx]);
    return list[idx];
  }
  function deleteTransaksi(id) {
    const list = getTransaksi().filter(t => t.id !== id);
    _save(KEYS.transaksi, list);
    _sync('transaksi', { id }, 'DELETE');
    // Delete related cashflow
    const cf = getCashflow().filter(c => c.transaksi_id !== id);
    _save(KEYS.cashflow, cf);
  }

  /* ---- CASHFLOW ---- */
  function getCashflow() { return _load(KEYS.cashflow); }
  function insertCashflow(data) {
    const list = getCashflow();
    const rec = { ...data, id: _nextId(), created_at: new Date().toISOString() };
    list.push(rec);
    _save(KEYS.cashflow, list);
    _sync('cashflow', rec);
    return rec;
  }
  function deleteCashflowByTransaksi(transaksiId) {
    const list = getCashflow().filter(c => c.transaksi_id !== transaksiId);
    _save(KEYS.cashflow, list);
  }
  function deleteCashflow(id) {
    const list = getCashflow().filter(c => c.id !== id);
    _save(KEYS.cashflow, list);
    _sync('cashflow', { id }, 'DELETE');
  }
  function updateCashflow(id, data) {
    const list = getCashflow();
    const idx = list.findIndex(c => c.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], ...data };
    _save(KEYS.cashflow, list);
    _sync('cashflow', list[idx]);
  }

  /* ---- DANA SERVIS BALANCE ---- */
  function getDanaServisBalance() {
    // Hitung dari cashflow
    const cf = getCashflow();
    const masuk = cf
      .filter(c => c.tujuan_dana === 'DANA_SERVIS' && c.kategori !== 'PENGELUARAN_SERVIS')
      .reduce((s, c) => s + (c.nominal || 0), 0);
    const keluar = cf
      .filter(c => c.kategori === 'PENGELUARAN_SERVIS')
      .reduce((s, c) => s + (c.nominal || 0), 0);
    return { masuk, keluar, sisa: masuk - keluar };
  }

  /* ---- RIWAYAT SERVIS ---- */
  function getServis() { return _load(KEYS.servis); }
  function insertServis(data) {
    const list = getServis();
    const rec = { ...data, id: _nextId(), created_at: new Date().toISOString() };
    list.push(rec);
    _save(KEYS.servis, list);
    _sync('servis', rec);
    // Insert cashflow pengeluaran servis
    insertCashflow({
      tanggal: data.tanggal,
      transaksi_id: null,
      source_type: 'SERVIS',
      kategori: 'PENGELUARAN_SERVIS',
      nominal: data.biaya,
      tujuan_dana: 'DANA_SERVIS',
      keterangan: data.nama_servis,
      servis_id: rec.id,
    });
    return rec;
  }
  function deleteServis(id) {
    const s = getServis().find(s => s.id === id);
    if (!s) return;
    const list = getServis().filter(s => s.id !== id);
    _save(KEYS.servis, list);
    _sync('servis', { id }, 'DELETE');
    // Remove related cashflow
    const cf = getCashflow().filter(c => c.servis_id !== id);
    _save(KEYS.cashflow, cf);
  }
  function updateServis(id, data) {
    const list = getServis();
    const idx = list.findIndex(s => s.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], ...data };
    _save(KEYS.servis, list);
    _sync('servis', list[idx]);
    
    const cf = getCashflow();
    const cfIdx = cf.findIndex(c => c.servis_id === id);
    if (cfIdx >= 0) {
      if (data.biaya) cf[cfIdx].nominal = data.biaya;
      if (data.tanggal) cf[cfIdx].tanggal = data.tanggal;
      if (data.nama_servis) cf[cfIdx].keterangan = data.nama_servis;
      _save(KEYS.cashflow, cf);
    }
  }

  /* ---- PENGELUARAN ---- */
  function getPengeluaran() { return _load(KEYS.pengeluaran); }
  function insertPengeluaran(data) {
    const list = getPengeluaran();
    const rec = { ...data, id: _nextId(), created_at: new Date().toISOString() };
    list.push(rec);
    _save(KEYS.pengeluaran, list);
    _sync('pengeluaran', rec);
    // Insert cashflow
    insertCashflow({
      tanggal: data.tanggal,
      transaksi_id: null,
      source_type: 'PENGELUARAN',
      kategori: 'PENGELUARAN',
      nominal: data.nominal,
      tujuan_dana: null,
      keterangan: data.keterangan,
      pengeluaran_id: rec.id,
    });
    return rec;
  }
  function deletePengeluaran(id) {
    const list = getPengeluaran().filter(p => p.id !== id);
    _save(KEYS.pengeluaran, list);
    _sync('pengeluaran', { id }, 'DELETE');
    const cf = getCashflow().filter(c => c.pengeluaran_id !== id);
    _save(KEYS.cashflow, cf);
  }
  function updatePengeluaran(id, data) {
    const list = getPengeluaran();
    const idx = list.findIndex(p => p.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], ...data };
    _save(KEYS.pengeluaran, list);
    _sync('pengeluaran', list[idx]);
    
    const cf = getCashflow();
    const cfIdx = cf.findIndex(c => c.pengeluaran_id === id);
    if (cfIdx >= 0) {
      if (data.nominal) cf[cfIdx].nominal = data.nominal;
      if (data.tanggal) cf[cfIdx].tanggal = data.tanggal;
      if (data.keterangan) cf[cfIdx].keterangan = data.keterangan;
      _save(KEYS.cashflow, cf);
    }
  }

  /* ---- UTANG ---- */
  function getUtang() { return _load(KEYS.utang); }
  function insertUtang(data) {
    const list = getUtang();
    const rec = { ...data, id: _nextId(), lunas: false, created_at: new Date().toISOString() };
    list.push(rec);
    _save(KEYS.utang, list);
    _sync('utang', rec);
    return rec;
  }
  function updateUtang(id, data) {
    const list = getUtang();
    const idx = list.findIndex(u => u.id === id);
    if (idx < 0) throw new Error('Utang tidak ditemukan');
    list[idx] = { ...list[idx], ...data };
    _save(KEYS.utang, list);
    _sync('utang', list[idx]);
    return list[idx];
  }
  function deleteUtang(id) {
    const list = getUtang().filter(u => u.id !== id);
    _save(KEYS.utang, list);
    _sync('utang', { id }, 'DELETE');
  }

  /* ---- DASHBOARD SUMMARY ---- */
  function getDashboardSummary() {
    const cf = getCashflow();

    // Penghasilan dari trip
    const tripIncome = cf
      .filter(c => c.source_type === 'TRIP' && c.kategori === 'PENGHASILAN')
      .reduce((s, c) => s + c.nominal, 0);

    // Penghasilan dari insentif
    const insentifIncome = cf
      .filter(c => c.source_type === 'INCENTIVE' && c.kategori === 'PENGHASILAN')
      .reduce((s, c) => s + c.nominal, 0);

    // Total penghasilan kotor
    const saldoKotor = tripIncome + insentifIncome;

    // Total pengeluaran operasional (bukan servis)
    const totalPengeluaran = cf
      .filter(c => c.kategori === 'PENGELUARAN')
      .reduce((s, c) => s + c.nominal, 0);

    // Alokasi servis (keluar dari saldo operasional)
    const alokasiServis = cf
      .filter(c => c.source_type === 'SERVIS_ALLOC')
      .reduce((s, c) => s + c.nominal, 0);

    // Saldo bersih = kotor - pengeluaran - alokasi servis
    const saldoBersih = saldoKotor - totalPengeluaran - alokasiServis;

    // Dana servis
    const ds = getDanaServisBalance();

    // Utang
    const utangList = getUtang();
    const totalUtang = utangList.filter(u => !u.lunas).reduce((s, u) => s + u.nominal, 0);

    // Statistik
    const transaksiList = getTransaksi();
    const hariKerja = transaksiList.filter(t => t.status_operasi === 'WORKING').length;
    const rataRataPendapatan = hariKerja > 0 ? saldoKotor / hariKerja : 0;
    const totalHari = transaksiList.length;
    const rataRataPengeluaran = totalHari > 0 ? totalPengeluaran / totalHari : 0;
    const marginBersih = saldoKotor > 0 ? ((saldoBersih / saldoKotor) * 100).toFixed(2) : '0.00';
    const rasioUtang = saldoBersih > 0 ? (totalUtang / saldoBersih).toFixed(2) : '0.00';

    return {
      saldoKotor, tripIncome, insentifIncome,
      totalPengeluaran, alokasiServis,
      saldoBersih,
      danaServis: ds,
      totalUtang,
      hariKerja,
      rataRataPendapatan, rataRataPengeluaran,
      marginBersih, rasioUtang,
      totalTransaksi: transaksiList.length,
    };
  }

  /* ---- AUTH / USERS ---- */
  const KEYS_AUTH = {
    users: 'bk_users',
    currentUser: 'bk_current_user'
  };

  function getUsers() {
    return _load(KEYS_AUTH.users);
  }

  function registerUser(username, password, fullName) {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
      throw new Error('Username sudah terdaftar');
    }
    const newUser = { id: _nextId(), username, password, full_name: fullName, created_at: new Date().toISOString() };
    users.push(newUser);
    _save(KEYS_AUTH.users, users);
    _sync('users', newUser);
    return newUser;
  }

  function loginUser(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      throw new Error('Username atau password salah');
    }
    _save(KEYS_AUTH.currentUser, user);
    return user;
  }

  function getCurrentUser() {
    return _loadObj(KEYS_AUTH.currentUser, null);
  }

  function logoutUser() {
    localStorage.removeItem(KEYS_AUTH.currentUser);
  }

  return {
    getSettings, saveSettings,
    getAlokasiRules, saveAlokasiRule,
    getTransaksi, getTransaksiById, insertTransaksi, updateTransaksi, deleteTransaksi,
    getCashflow, insertCashflow, deleteCashflowByTransaksi, updateCashflow, deleteCashflow,
    getDanaServisBalance,
    getServis, insertServis, updateServis, deleteServis,
    getPengeluaran, insertPengeluaran, updatePengeluaran, deletePengeluaran,
    getUtang, insertUtang, updateUtang, deleteUtang,
    getDashboardSummary,
    registerUser, loginUser, getCurrentUser, logoutUser,
  };
})();
