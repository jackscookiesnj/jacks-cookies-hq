function doPost(event) {
  var expectedToken = PropertiesService.getScriptProperties().getProperty("DRIVE_SAVE_TOKEN");
  var payload = JSON.parse(event.postData.contents || "{}");

  if (!expectedToken || payload.token !== expectedToken) {
    return jsonResponse({ error: "Unauthorized" });
  }

  var folder = payload.folderId
    ? DriveApp.getFolderById(payload.folderId)
    : findOrCreateFolder(payload.rootFolderId, payload.folderName);
  var docName = (payload.fileName || "invoice.html").replace(/\.html$/i, "");
  var existing = folder.getFilesByName(docName);

  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  var doc = DocumentApp.create(docName);
  writeInvoiceDoc(doc, payload.invoice || {});
  doc.saveAndClose();

  var file = DriveApp.getFileById(doc.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  return jsonResponse({
    id: file.getId(),
    name: file.getName(),
    url: file.getUrl()
  });
}

function findOrCreateFolder(rootFolderId, folderName) {
  var root = DriveApp.getFolderById(rootFolderId);
  var folders = root.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : root.createFolder(folderName);
}

function authorizeDriveAndDocs() {
  var doc = DocumentApp.create("Jack's Cookies Authorization Test");
  DriveApp.getFileById(doc.getId()).setTrashed(true);
}

function writeInvoiceDoc(doc, invoice) {
  var body = doc.getBody();
  body.clear();

  body.appendParagraph("Jack's Cookies HQ").setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph("Invoice").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(invoice.invoiceReference || "");
  body.appendParagraph(invoice.deliveryDate || "");
  body.appendParagraph((invoice.paymentStatus || "").toUpperCase());
  body.appendHorizontalRule();

  body.appendParagraph("Bill To").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(invoice.customerName || "");
  (invoice.customerDetails || []).forEach(function(detail) {
    body.appendParagraph(detail);
  });

  body.appendParagraph("Order").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  var table = body.appendTable([
    ["Description", "Qty", "Unit", "Amount"],
    [
      invoice.description || "",
      String(invoice.quantity || ""),
      invoice.unitPrice || "",
      invoice.total || ""
    ],
    ["", "", "Total", invoice.total || ""]
  ]);
  table.getRow(0).editAsText().setBold(true);
  table.getRow(2).editAsText().setBold(true);

  if (invoice.notes) {
    body.appendParagraph("Notes").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(invoice.notes);
  }
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
