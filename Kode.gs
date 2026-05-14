var FOLDER_ID = "1VzTU37zKp8q3FuVLEAFk56gTEOL3EPFm";

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
          var blob = Utilities.newBlob(Utilities.base64Decode(fileData.base64), fileData.mimeType, timestampStr + "_" + fileData.name);
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          links[key] = file.getUrl();
        }
      }
      
      // Masukkan link file ke payload
      payload.linkST = links.st || "";
      payload.linkSPPD = links.sppd || "";
      payload.linkHotel = links.hotel || "";
      payload.linkTransport = links.transport || "";
      payload.linkBoardingPass = links.boarding || "";
      payload.linkLaporanPD = links.laporan || "";
      
      payload.docId = new Date().getTime(); 
      
      var newRow = [];
      for (var i = 0; i < headers.length; i++) {
        var headerName = headers[i];
        if (payload[headerName] !== undefined) {
          newRow.push(payload[headerName]);
        } else {
          newRow.push("");
        }
      }
      
      sheet.appendRow(newRow);
      response.success = true;
      response.docId = payload.docId;
      
    } else if (action === "update") {
      var docId = data.docId;
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var docIdIndex = headers.indexOf("docId");
      
      if (docIdIndex === -1) throw new Error("Kolom docId tidak ditemukan di header!");
      
      var rowIndex = -1;
      for (var i = 1; i < values.length; i++) {
        if (values[i][docIdIndex].toString() === docId.toString()) {
          rowIndex = i + 1; // baris di spreadsheet dimulai dari 1
          break;
        }
      }
      
      if (rowIndex !== -1) {
        if (data.statusKlaim !== undefined) {
          var colStatus = headers.indexOf("statusKlaim") + 1;
          if(colStatus > 0) sheet.getRange(rowIndex, colStatus).setValue(data.statusKlaim);
        }
        if (data.nominalAdmin !== undefined) {
          var colNominal = headers.indexOf("nominalAdmin") + 1;
          if(colNominal > 0) sheet.getRange(rowIndex, colNominal).setValue(data.nominalAdmin);
        }
        if (data.jumlahHari !== undefined) {
          var colHari = headers.indexOf("jumlahHari") + 1;
          if(colHari > 0) sheet.getRange(rowIndex, colHari).setValue(data.jumlahHari);
        }
        response.success = true;
      } else {
        throw new Error("Data tidak ditemukan");
      }
    }
  } catch (error) {
    response.error = error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var headers = values[0];
  
  var result = [];
  
  if (action === "getAll") {
    // skip baris pertama (header)
    for (var i = values.length - 1; i > 0; i--) {
      var rowObj = {};
      for (var j = 0; j < headers.length; j++) {
        rowObj[headers[j]] = values[i][j];
      }
      result.push(rowObj);
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    
  } else if (action === "search") {
    var namaQuery = (e.parameter.nama || "").toLowerCase().trim();
    // Gunakan kolom namaLengkap langsung, bukan searchName
    var namaIndex = headers.indexOf("namaLengkap"); 
    
    if (namaIndex === -1) {
       return ContentService.createTextOutput(JSON.stringify({error: "Kolom namaLengkap tidak ditemukan"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    for (var i = values.length - 1; i > 0; i--) {
      var namaPegawai = (values[i][namaIndex] || "").toString().toLowerCase().trim();
      if (namaPegawai.indexOf(namaQuery) !== -1) {
        var rowObj = {};
        for (var j = 0; j < headers.length; j++) {
          rowObj[headers[j]] = values[i][j];
        }
        result.push(rowObj);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ total: result.length, data: result })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"})).setMimeType(ContentService.MimeType.JSON);
}
