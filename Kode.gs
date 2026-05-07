// ================================================================
// SIPERDIN BBPK JAKARTA - Backend Google Apps Script
// Versi: 2.0 | Support: jumlahHari, revisi, search
// ================================================================

var SHEET_NAME = "DataKlaim";
var FOLDER_NAME = "Upload_Dokumen_SIPERDIN";

// Kolom Sheet (URUTAN WAJIB SAMA DENGAN setupDatabase)
var COLS = {
  TIMESTAMP:      1,
  ID_KLAIM:       2,
  NAMA:           3,
  JABATAN:        4,
  KEGIATAN:       5,
  TUJUAN:         6,
  JML_PESERTA:    7,
  JML_HARI:       8,   // <-- BARU
  LINK_ST:        9,
  LINK_SPPD:      10,
  LINK_HOTEL:     11,
  LINK_TRANSPORT: 12,
  STATUS:         13,
  NOMINAL:        14
};

// ----------------------------------------------------------------
// ENTRY POINT
// ----------------------------------------------------------------
function doGet(e) {
  var action = e.parameter.action;

  if (action === "getAll") {
    return jsonResponse(getAllKlaim());
  }
  if (action === "search") {
    return jsonResponse(searchKlaim(e.parameter.nama));
  }

  // Default: sajikan HTML
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('SIPERDIN BBPK Jakarta')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "insert") return jsonResponse(insertKlaim(data));
    if (action === "update") return jsonResponse(updateKlaim(data));

    return jsonResponse({ error: "Action tidak dikenal: " + action });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ----------------------------------------------------------------
// SETUP DATABASE (Jalankan sekali dari GAS Editor)
// ----------------------------------------------------------------
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (sheet) {
    SpreadsheetApp.getUi().alert("Sheet '" + SHEET_NAME + "' sudah ada. Tidak perlu setup ulang.");
    return;
  }

  sheet = ss.insertSheet(SHEET_NAME);
  var headers = [
    "Timestamp", "ID Klaim", "Nama Lengkap", "Jabatan",
    "Kegiatan", "Tujuan", "Jumlah Peserta", "Jumlah Hari",
    "Link Surat Tugas", "Link SPPD", "Link Kwitansi Hotel", "Link Kwitansi Transport",
    "Status Saat Ini", "Nominal Klaim (Rp)"
  ];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#eef2ff");
  sheet.setFrozenRows(1);

  // Buat folder Drive jika belum ada
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (!folders.hasNext()) DriveApp.createFolder(FOLDER_NAME);

  SpreadsheetApp.getUi().alert("✅ Database SIPERDIN berhasil disiapkan!");
}

// ----------------------------------------------------------------
// MIGRASI: Tambah kolom Jumlah Hari ke sheet yang SUDAH ADA
// Jalankan SEKALI jika sheet sudah ada tapi belum punya kolom Jumlah Hari
// ----------------------------------------------------------------
function migrasiKolomJumlahHari() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert("❌ Sheet 'DataKlaim' tidak ditemukan. Jalankan setupDatabase() dulu.");
    return;
  }

  // Cek apakah kolom ke-8 sudah "Jumlah Hari"
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headerRow[7] && String(headerRow[7]).toLowerCase().includes("hari")) {
    SpreadsheetApp.getUi().alert("✅ Kolom 'Jumlah Hari' sudah ada. Tidak perlu migrasi.");
    return;
  }

  // Sisipkan kolom baru di posisi 8 (setelah Jumlah Peserta)
  sheet.insertColumnAfter(7);
  sheet.getRange(1, 8).setValue("Jumlah Hari");
  sheet.getRange(1, 8).setFontWeight("bold").setBackground("#eef2ff");

  // Isi baris lama dengan nilai default 1
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var defaultRange = sheet.getRange(2, 8, lastRow - 1, 1);
    defaultRange.setValue(1);
  }

  SpreadsheetApp.getUi().alert("✅ Kolom 'Jumlah Hari' berhasil ditambahkan ke semua " + (lastRow - 1) + " baris data!");
}


// ----------------------------------------------------------------
// INSERT KLAIM BARU
// ----------------------------------------------------------------
function insertKlaim(data) {
  var sheet = getSheet();
  var payload = data.payload;
  var files   = data.files || {};

  var ts = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
  var nama = payload.namaLengkap || "Pegawai";

  var linkST        = uploadFile(files.st,        "ST_"        + nama + "_" + ts);
  var linkSPPD      = uploadFile(files.sppd,      "SPPD_"      + nama + "_" + ts);
  var linkHotel     = uploadFile(files.hotel,     "Hotel_"     + nama + "_" + ts);
  var linkTransport = uploadFile(files.transport, "Transport_" + nama + "_" + ts);

  var row = [
    new Date(),                          // 1  TIMESTAMP
    payload.idKlaim        || "",        // 2  ID_KLAIM
    payload.namaLengkap    || "",        // 3  NAMA
    payload.jabatan        || "",        // 4  JABATAN
    payload.kegiatan       || "",        // 5  KEGIATAN
    payload.tujuan         || "",        // 6  TUJUAN
    payload.jumlahPeserta  || 1,         // 7  JML_PESERTA
    payload.jumlahHari     || 1,         // 8  JML_HARI  <-- BARU
    linkST,                              // 9  LINK_ST
    linkSPPD,                            // 10 LINK_SPPD
    linkHotel,                           // 11 LINK_HOTEL
    linkTransport,                       // 12 LINK_TRANSPORT
    "PJ Keuangan",                       // 13 STATUS
    "-"                                  // 14 NOMINAL
  ];

  sheet.appendRow(row);
  return { success: true, idKlaim: payload.idKlaim };
}

// ----------------------------------------------------------------
// UPDATE STATUS / NOMINAL / JUMLAH HARI oleh Admin
// ----------------------------------------------------------------
function updateKlaim(data) {
  var sheet = getSheet();
  var docId = data.docId; // = ID Klaim (kolom 2)

  // Cari baris berdasarkan ID Klaim
  var values = sheet.getDataRange().getValues();
  var targetRow = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][COLS.ID_KLAIM - 1]).trim() === String(docId).trim()) {
      targetRow = i + 1; // 1-based row index di sheet
      break;
    }
  }

  if (targetRow === -1) {
    return { error: "Data tidak ditemukan untuk ID: " + docId };
  }

  // Update kolom STATUS
  if (data.statusKlaim !== undefined && data.statusKlaim !== null) {
    sheet.getRange(targetRow, COLS.STATUS).setValue(data.statusKlaim);
  }

  // Update kolom NOMINAL
  if (data.nominalAdmin !== undefined && data.nominalAdmin !== null && data.nominalAdmin !== "") {
    sheet.getRange(targetRow, COLS.NOMINAL).setValue(data.nominalAdmin);
  }

  // Update kolom JUMLAH HARI (baru)
  if (data.jumlahHari !== undefined && data.jumlahHari !== null && data.jumlahHari !== "") {
    sheet.getRange(targetRow, COLS.JML_HARI).setValue(data.jumlahHari);
  }

  return { success: true };
}

// ----------------------------------------------------------------
// GET ALL KLAIM (untuk Admin)
// ----------------------------------------------------------------
function getAllKlaim() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var results = [];
  for (var i = 1; i < data.length; i++) {
    results.push(rowToObject(data[i], i + 1));
  }
  return results.reverse();
}

// ----------------------------------------------------------------
// SEARCH KLAIM berdasarkan Nama
// ----------------------------------------------------------------
function searchKlaim(nama) {
  if (!nama) return { total: 0, data: [] };

  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var keyword = nama.toLowerCase().trim();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var namaSheet = String(data[i][COLS.NAMA - 1]).toLowerCase().trim();
    if (namaSheet.includes(keyword)) {
      results.push(rowToObject(data[i], i + 1));
    }
  }

  return { total: results.length, data: results.reverse() };
}

// ================================================================
// HELPERS
// ================================================================

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Sheet '" + SHEET_NAME + "' belum dibuat. Jalankan setupDatabase() terlebih dahulu.");
  return sheet;
}

function rowToObject(row, rowNum) {
  return {
    docId:         String(row[COLS.ID_KLAIM - 1]).trim(),
    timestamp:     row[COLS.TIMESTAMP - 1] ? new Date(row[COLS.TIMESTAMP - 1]).toISOString() : "",
    idKlaim:       String(row[COLS.ID_KLAIM - 1]).trim(),
    namaLengkap:   row[COLS.NAMA - 1]           || "",
    jabatan:       row[COLS.JABATAN - 1]         || "",
    kegiatan:      row[COLS.KEGIATAN - 1]        || "",
    tujuan:        row[COLS.TUJUAN - 1]          || "",
    jumlahPeserta: row[COLS.JML_PESERTA - 1]     || "",
    jumlahHari:    row[COLS.JML_HARI - 1]        || "",   // <-- BARU
    linkST:        row[COLS.LINK_ST - 1]         || "",
    linkSPPD:      row[COLS.LINK_SPPD - 1]       || "",
    linkHotel:     row[COLS.LINK_HOTEL - 1]      || "",
    linkTransport: row[COLS.LINK_TRANSPORT - 1]  || "",
    statusKlaim:   row[COLS.STATUS - 1]          || "PJ Keuangan",
    nominalAdmin:  row[COLS.NOMINAL - 1]         || "-",
    searchName:    String(row[COLS.NAMA - 1]).toLowerCase().trim()
  };
}

function uploadFile(fileObj, filename) {
  if (!fileObj || !fileObj.base64) return "";
  try {
    var folders = DriveApp.getFoldersByName(FOLDER_NAME);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);
    var decoded = Utilities.base64Decode(fileObj.base64);
    var blob = Utilities.newBlob(decoded, fileObj.mimeType, filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log("Upload error: " + e.toString());
    return "";
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
