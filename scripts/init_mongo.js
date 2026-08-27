// MongoDB NoSQL Database Initialization for Raw OCR Text & Pipeline Logs
db = db.getSiblingDB('sentry_ocr_logs');

db.createCollection('raw_ocr_documents');
db.createCollection('pipeline_execution_logs');

db.raw_ocr_documents.insertMany([
  {
    caseId: "DOC-88229",
    rawText: "P<CZENOVAK<<PAVEL<<<<<<<<<<<<<<<<<<<<<<<<<<<\nC402177557CZE8903142M3106025<<<<<<<<<<<<<<02",
    parsedFields: {
      name: "Pavel Novak",
      docNumber: "C40217755",
      nationality: "CZE"
    },
    timestamp: new Date()
  }
]);
