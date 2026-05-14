var FOLDER_ID = "1VzTU37zKp8q3FuVLEAFk56gTEOL3EPFm";

// Peta: nama header di spreadsheet → key payload
// Mendukung berbagai format header (camelCase maupun human-readable)
var HEADER_TO_FIELD = {
  "idKlaim": "idKlaim",       "ID Klaim": "idKlaim",
  "timestamp": "timestamp",   "Waktu": "timestamp",
  "namaLengkap": "namaLengkap", "Nama Pegawai": "namaLengkap",
  "jabatan": "jabatan",       "Jabatan": "jabatan",
  "kegiatan": "kegiatan",     "Kegiatan": "kegiatan",
  "tujuan": "tujuan",         "Tujuan": "tujuan",
  "jumlahPeserta": "jumlahPeserta", "Peserta": "jumlahPeserta",
  "jumlahHari": "jumlahHari", "Jumlah Hari": "jumlahHari",
  "linkST": "linkST",         "Link ST": "linkST",
  "linkSPPD": "linkSPPD",     "Link SPD / SPPD": "linkSPPD", "Link SPPD": "linkSPPD",
  "linkHotel": "linkHotel",   "Link Hotel": "linkHotel",
  "linkTransport": "linkTransport", "Link Transport": "linkTransport",
  "linkBoardingPass": "linkBoardingPass", "Link Boarding Pass": "linkBoardingPass",
  "linkLaporanPD": "linkLaporanPD",     "Link Laporan PD": "linkLaporanPD",
  "statusKlaim": "statusKlaim", "Status Klaim": "statusKlaim",
  "nominalAdmin": "nominalAdmin", "Nominal": "nominalAdmin", "Nominal Klaim": "nominalAdmin",
  "docId": "docId",           "Doc ID": "docId",
  "searchName": "searchName"
};

// Cari index kolom dengan berbagai kemungkinan nama header
function findColIndex(headers, fieldName) {
  // Cari exact match dulu
  var idx = headers.indexOf(fieldName);
  if (idx !== -1) return idx;
  // Cari dari semua entry HEADER_TO_FIELD yang menuju fieldName
  for (var h in HEADER_TO_FIELD) {
    if (HEADER_TO_FIELD[h] === fieldName && headers.indexOf(h) !== -1) {
      return headers.indexOf(h);
    }
  }
  return -1;
}

function doPost(e) {
  var response = { success: false };
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (action === "insert") {
      var payload = data.payload;
      var files = data.files;

      var folder = DriveApp.getFolderById(FOLDER_ID);
      var links = {};
      var timestampStr = new Date().getTime().toString().slice(-5);

      for (var key in files) {
        if (files[key]) {
          var fileData = files[key];
          var blob = Utilities.newBlob(
            Utilities.base64Decode(fileData.base64),
            fileData.mimeType,
            timestampStr + "_" + fileData.name
          );
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          links[key] = file.getUrl();
        }
      }

      // Masukkan link file ke payload
      payload.linkST            = links.st       || "";
      payload.linkSPPD          = links.sppd     || "";
      payload.linkHotel         = links.hotel    || "";
      payload.linkTransport     = links.transport || "";
      payload.linkBoardingPass  = links.boarding  || "";
      payload.linkLaporanPD     = links.laporan   || "";
      payload.docId             = new Date().getTime();

      // Build baris sesuai urutan header di spreadsheet
      var newRow = [];
      for (var i = 0; i < headers.length; i++) {
        var headerName = headers[i];
        var fieldName  = HEADER_TO_FIELD[headerName] || headerName;
        newRow.push(payload[fieldName] !== undefined ? payload[fieldName] : "");
      }

      sheet.appendRow(newRow);
      response.success = true;
      response.docId   = payload.docId;

    } else if (action === "update") {
      var docId      = data.docId;
      var dataRange  = sheet.getDataRange();
      var values     = dataRange.getValues();
      var docIdIndex = findColIndex(headers, "docId");

      if (docIdIndex === -1) throw new Error("Kolom docId tidak ditemukan di header!");

      var rowIndex = -1;
      for (var i = 1; i < values.length; i++) {
        if (values[i][docIdIndex].toString() === docId.toString()) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex !== -1) {
        if (data.statusKlaim !== undefined) {
          var colStatus = findColIndex(headers, "statusKlaim") + 1;
          if (colStatus > 0) sheet.getRange(rowIndex, colStatus).setValue(data.statusKlaim);
        }
        if (data.nominalAdmin !== undefined) {
          var colNominal = findColIndex(headers, "nominalAdmin") + 1;
          if (colNominal > 0) sheet.getRange(rowIndex, colNominal).setValue(data.nominalAdmin);
        }
        if (data.jumlahHari !== undefined && data.jumlahHari !== "") {
          var colHari = findColIndex(headers, "jumlahHari") + 1;
          if (colHari > 0) sheet.getRange(rowIndex, colHari).setValue(data.jumlahHari);
        }
        response.success = true;
      } else {
        throw new Error("Data tidak ditemukan");
      }
    }
  } catch (error) {
    response.error = error.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action    = e.parameter.action;
  var sheet     = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var dataRange = sheet.getDataRange();
  var values    = dataRange.getValues();
  var headers   = values[0];

  var result = [];

  if (action === "getAll") {
    for (var i = values.length - 1; i > 0; i--) {
      var rowObj = {};
      for (var j = 0; j < headers.length; j++) {
        var hdr       = headers[j];
        var fieldName = HEADER_TO_FIELD[hdr] || hdr;
        // Simpan dengan KEDUA nama: header asli & canonical fieldName
        rowObj[hdr]       = values[i][j];
        rowObj[fieldName] = values[i][j];
      }
      result.push(rowObj);
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } else if (action === "search") {
    var namaQuery = (e.parameter.nama || "").toLowerCase().trim();
    var namaIndex = findColIndex(headers, "namaLengkap");

    if (namaIndex === -1) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: "Kolom namaLengkap tidak ditemukan" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    for (var i = values.length - 1; i > 0; i--) {
      var namaPegawai = (values[i][namaIndex] || "").toString().toLowerCase().trim();
      if (namaPegawai.indexOf(namaQuery) !== -1) {
        var rowObj = {};
        for (var j = 0; j < headers.length; j++) {
          var hdr       = headers[j];
          var fieldName = HEADER_TO_FIELD[hdr] || hdr;
          rowObj[hdr]       = values[i][j];
          rowObj[fieldName] = values[i][j];
        }
        result.push(rowObj);
      }
    }
    return ContentService.createTextOutput(
      JSON.stringify({ total: result.length, data: result })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}
