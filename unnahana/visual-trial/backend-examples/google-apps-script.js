// Google Apps Script backend helper for Unnahana Visual Trial
// Deploy this as a Web App and paste the Web App URL into the Cloudflare Worker secret:
// GOOGLE_SCRIPT_WEB_APP_URL
//
// What it does:
// - Appends each submission to a Google Sheet
// - Emails the admin a readable intake summary
//
// Setup:
// 1. Create a Google Sheet named "Unnahana Visual Trial Submissions".
// 2. Open Extensions > Apps Script.
// 3. Paste this file.
// 4. Replace SPREADSHEET_ID and ADMIN_EMAIL.
// 5. Deploy > New deployment > Web app.
// 6. Execute as: Me. Who has access: your chosen secure setting.

const SPREADSHEET_ID = "PASTE_GOOGLE_SHEET_ID_HERE";
const SHEET_NAME = "Submissions";
const ADMIN_EMAIL = "hello@geyvak.com";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet_();
    ensureHeader_(sheet);

    const briefText = briefToText_(body.brief);
    sheet.appendRow([
      new Date(),
      body.source || "geyvak.com/unnahana/visual-trial",
      body.name || "",
      body.email || "",
      body.contactBackup || "",
      body.location || "",
      body.occasion || "",
      body.budget || "",
      body.projectType || "",
      body.coloursLoved || "",
      body.coloursAvoided || "",
      body.styleFeeling || "",
      body.existingItems || "",
      body.bodyComfort || "",
      body.respectNotes || "",
      body.deadline || "",
      body.referenceLinks || "",
      body.photoConsent === true ? "YES" : "NO",
      body.aiConsent === true ? "YES" : "NO",
      briefText
    ]);

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: "New Unnahana Visual Trial submission",
      body: makeEmailBody_(body, briefText)
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
    "Timestamp",
    "Source",
    "Name",
    "Email",
    "Backup contact",
    "Location",
    "Occasion",
    "Budget",
    "Project type",
    "Colours loved",
    "Colours avoided",
    "Style feeling",
    "Existing items",
    "Body comfort",
    "Respect notes",
    "Deadline",
    "Reference links",
    "Photo/reference consent",
    "AI consent",
    "Generated brief"
  ]);
}

function briefToText_(brief) {
  if (!brief) return "";
  const items = Array.isArray(brief.items)
    ? brief.items.map(function(item) { return item[0] + ": " + item[1]; }).join("\n\n")
    : "";
  return [brief.title || "Unnahana style brief", brief.intro || "", items].join("\n\n");
}

function makeEmailBody_(body, briefText) {
  return [
    "New Unnahana Visual Trial submission",
    "",
    "Name: " + (body.name || ""),
    "Email: " + (body.email || ""),
    "Backup contact: " + (body.contactBackup || ""),
    "Location: " + (body.location || ""),
    "Occasion: " + (body.occasion || ""),
    "Budget: " + (body.budget || ""),
    "Project type: " + (body.projectType || ""),
    "Colours loved: " + (body.coloursLoved || ""),
    "Colours avoided: " + (body.coloursAvoided || ""),
    "Style feeling: " + (body.styleFeeling || ""),
    "Existing items: " + (body.existingItems || ""),
    "Body comfort: " + (body.bodyComfort || ""),
    "Respect notes: " + (body.respectNotes || ""),
    "Deadline: " + (body.deadline || ""),
    "Reference links: " + (body.referenceLinks || ""),
    "Photo/reference consent: " + (body.photoConsent === true ? "YES" : "NO"),
    "AI consent: " + (body.aiConsent === true ? "YES" : "NO"),
    "",
    "Generated brief:",
    briefText,
    "",
    "Reminder: this is creative direction only. Final design requires human review."
  ].join("\n");
}
