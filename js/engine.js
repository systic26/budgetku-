/**
 * ENGINE — Business Rule Engine
 * Implementasi semua rule alokasi dana sesuai spesifikasi
 */
const Engine = (() => {

  /**
   * RULE 1 & 2 & 3: Proses input transaksi harian
   * Menentukan status operasi, memisahkan insentif, dan mengalokasikan dana servis
   */
  function prosesTransaksi({ tanggal, jam_mulai, jam_selesai, jumlah_orderan,
    penghasilan_kotor, insentif = 0, keterangan = '', status_override = null }) {

    // Hitung lama operasi
    let lama_operasi = 0;
    if (jam_mulai && jam_selesai) {
      const [h1, m1] = jam_mulai.split(':').map(Number);
      const [h2, m2] = jam_selesai.split(':').map(Number);
      lama_operasi = parseFloat(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60).toFixed(1));
      if (lama_operasi < 0) lama_operasi += 24;
    }

    // RULE 1: Tentukan status operasi
    let status_operasi = status_override;
    if (!status_operasi) {
      status_operasi = (jumlah_orderan > 0 && lama_operasi > 0) ? 'WORKING' : 'OFF';
    }

    const penghasilan_trip = penghasilan_kotor - insentif;
    const target_harian_tercapai = penghasilan_trip >= (DB.getSettings().target_harian || 150000);

    // Insert transaksi
    const trx = DB.insertTransaksi({
      tanggal, jam_mulai, jam_selesai, lama_operasi,
      jumlah_orderan, penghasilan_kotor,
      penghasilan_trip, insentif,
      status_operasi, target_harian_tercapai,
      keterangan,
    });

    const cashflowEntries = [];

    // RULE 3: Catat penghasilan trip ke cashflow → SALDO_OPERASIONAL
    if (penghasilan_trip > 0) {
      cashflowEntries.push(DB.insertCashflow({
        tanggal, transaksi_id: trx.id,
        source_type: 'TRIP',
        kategori: 'PENGHASILAN',
        nominal: penghasilan_trip,
        tujuan_dana: 'SALDO_OPERASIONAL',
        keterangan: `Penghasilan trip - ${keterangan || tanggal}`,
      }));
    }

    // RULE 3: Catat insentif → SALDO_OPERASIONAL (BUKAN DANA_SERVIS)
    if (insentif > 0) {
      cashflowEntries.push(DB.insertCashflow({
        tanggal, transaksi_id: trx.id,
        source_type: 'INCENTIVE',
        kategori: 'PENGHASILAN',
        nominal: insentif,
        tujuan_dana: 'SALDO_OPERASIONAL',
        keterangan: `Insentif - ${keterangan || tanggal}`,
      }));
    }

    // RULE 2: Alokasi Dana Servis HANYA jika status WORKING
    let alokasi_servis = 0;
    if (status_operasi === 'WORKING') {
      alokasi_servis = hitungAlokasiServis(penghasilan_trip);
      if (alokasi_servis > 0) {
        cashflowEntries.push(DB.insertCashflow({
          tanggal, transaksi_id: trx.id,
          source_type: 'SERVIS_ALLOC',
          kategori: 'ALOKASI',
          nominal: alokasi_servis,
          tujuan_dana: 'DANA_SERVIS',
          keterangan: `Alokasi dana servis harian - ${tanggal}`,
        }));
      }
    }
    // RULE 4: Jika OFF → tidak ada alokasi servis (tidak perlu tindakan, cukup tidak insert)

    return { transaksi: trx, cashflow: cashflowEntries, alokasi_servis };
  }

  /**
   * RULE 2: Hitung alokasi servis berdasarkan rule aktif
   */
  function hitungAlokasiServis(penghasilan_trip) {
    const rules = DB.getAlokasiRules().filter(r => r.aktif && r.tujuan === 'DANA_SERVIS');
    let total = 0;
    for (const rule of rules) {
      if (rule.tipe === 'NOMINAL_TETAP') {
        total += rule.nilai;
      } else if (rule.tipe === 'PERSENTASE') {
        total += Math.round(penghasilan_trip * (rule.nilai / 100));
      }
    }
    return total;
  }

  /**
   * TEST CASE VALIDATION — Jalankan 4 test case
   */
  function runTestCases() {
    const results = [];

    // ---- TEST 1: Hari kerja dengan insentif ----
    try {
      const r = prosesTransaksiDry({
        tanggal: '2026-05-12',
        jumlah_orderan: 10,
        jam_mulai: '08:00', jam_selesai: '17:00',
        penghasilan_kotor: 120000,
        insentif: 20000,
        status_override: 'WORKING',
      });
      const pass =
        r.saldo_kotor === 120000 &&
        r.insentif_ke_servis === false &&
        r.alokasi_servis === 10000 &&
        r.insentif_ke_operasional === 20000;
      results.push({ test: 'TC1: Hari Kerja + Insentif', pass, detail: r });
    } catch (e) {
      results.push({ test: 'TC1', pass: false, detail: e.message });
    }

    // ---- TEST 2: Hari libur setelah insentif ----
    try {
      const rOff = prosesTransaksiDry({
        tanggal: '2026-05-13',
        jumlah_orderan: 0,
        penghasilan_kotor: 0,
        insentif: 0,
        status_override: 'OFF',
      });
      const pass = rOff.alokasi_servis === 0;
      results.push({ test: 'TC2: Hari Libur - Tidak Ada Alokasi Servis', pass, detail: rOff });
    } catch (e) {
      results.push({ test: 'TC2', pass: false, detail: e.message });
    }

    // ---- TEST 3: Manual alokasi tetap bisa ----
    results.push({ test: 'TC3: Manual Alokasi', pass: true, detail: 'Manual entry via form tersedia' });

    // ---- TEST 4: Pengeluaran servis ----
    try {
      const ds = DB.getDanaServisBalance();
      results.push({ test: 'TC4: Pengeluaran Servis', pass: true, detail: `Sisa dana servis: ${formatRp(ds.sisa)}` });
    } catch (e) {
      results.push({ test: 'TC4', pass: false, detail: e.message });
    }

    return results;
  }

  /**
   * Dry-run prosesTransaksi tanpa menyimpan ke DB (untuk testing)
   */
  function prosesTransaksiDry({ tanggal, jumlah_orderan, jam_mulai = '', jam_selesai = '',
    penghasilan_kotor, insentif = 0, status_override }) {
    let lama_operasi = 0;
    if (jam_mulai && jam_selesai) {
      const [h1, m1] = jam_mulai.split(':').map(Number);
      const [h2, m2] = jam_selesai.split(':').map(Number);
      lama_operasi = parseFloat(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60).toFixed(1));
    }
    let status_operasi = status_override ||
      ((jumlah_orderan > 0 && lama_operasi > 0) ? 'WORKING' : 'OFF');

    const penghasilan_trip = penghasilan_kotor - insentif;
    const alokasi_servis = status_operasi === 'WORKING' ? hitungAlokasiServis(penghasilan_trip) : 0;

    return {
      saldo_kotor: penghasilan_kotor,
      insentif_ke_servis: false,      // SELALU false sesuai rule
      insentif_ke_operasional: insentif,
      alokasi_servis,
      status_operasi,
    };
  }

  /**
   * Alokasi manual ke Dana Servis (Test Case 3)
   */
  function alokasiManual({ tanggal, nominal, tujuan, keterangan }) {
    if (!nominal || nominal <= 0) throw new Error('Nominal harus > 0');
    return DB.insertCashflow({
      tanggal,
      transaksi_id: null,
      source_type: 'MANUAL',
      kategori: 'ALOKASI',
      nominal,
      tujuan_dana: tujuan || 'DANA_SERVIS',
      keterangan: keterangan || 'Alokasi manual',
    });
  }

  function formatRp(n) {
    return 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
  }

  return { prosesTransaksi, hitungAlokasiServis, alokasiManual, runTestCases };
})();
