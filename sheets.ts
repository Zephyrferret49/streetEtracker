import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";
import { STAGES } from "./src/constants.js";

dotenv.config();

// Fallback to .env.example if .env is not present or if critical variables are missing
if ((!process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID.trim() === "") && fs.existsSync(".env.example")) {
  dotenv.config({ path: ".env.example", override: true });
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({ version: "v4", auth });

export const COL_INDICES = {
  ID: 0,
  NAME: 1,
  GENDER: 2,
  TEAM_MEMBER: 3,
  AGE: 4,
  REMARKS: 5,
  OCCUPATION: 6,
  STATUS: 7,
  UPDATED_AT: 8,
  HIGH_PRIORITY: 9,
  SOCIAL_MEDIA: 10,
};

export function formatContactRow(id: string, data: any) {
  const updatedAt = data.updatedAt || new Date().toISOString();
  const statusString = Array.isArray(data.status) ? data.status.join(', ') : (data.status || STAGES[0]);
  
  return [
    id,
    data.name || "-",
    data.gender || "-",
    data.teamMember || "-",
    data.age || "-",
    data.remarks || "-",
    data.occupation || "-",
    statusString,
    updatedAt,
    data.highPriority ? "TRUE" : "FALSE",
    data.socialMedia || "-",
  ];
}

function sanitizeSheetId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  let cleanId = id.trim();
  const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    cleanId = match[1];
  } else {
    cleanId = cleanId.replace(/\/$/, "");
  }
  return cleanId;
}

export const SPREADSHEET_ID = sanitizeSheetId(process.env.GOOGLE_SHEET_ID);

let cachedSheetName: string | null = null;
let cachedSheetId: number | null = null;

let onUpdateCallback: (() => void) | null = null;

export function setOnUpdate(callback: () => void) {
  onUpdateCallback = callback;
}

function triggerUpdate() {
  if (onUpdateCallback) {
    onUpdateCallback();
  }
}

async function getSheetMetadata() {
  if (cachedSheetName && cachedSheetId !== null) return { name: cachedSheetName, id: cachedSheetId };
  if (!SPREADSHEET_ID) {
    return { name: "Sheet1", id: 0 };
  }

  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const firstSheet = spreadsheet.data.sheets?.[0];
    cachedSheetName = firstSheet?.properties?.title || "Sheet1";
    cachedSheetId = firstSheet?.properties?.sheetId ?? 0;
    return { name: cachedSheetName, id: cachedSheetId };
  } catch (error: any) {
    console.error("Error fetching spreadsheet metadata:", error.message);
    return { name: "Sheet1", id: 0 };
  }
}

export async function getSheetName() {
  const { name } = await getSheetMetadata();
  return name;
}

export async function getSheetId() {
  const { id } = await getSheetMetadata();
  return id;
}

export async function getSheetData() {
  if (!SPREADSHEET_ID) {
    console.error("Cannot get sheet data: GOOGLE_SHEET_ID is not set.");
    return [];
  }
  try {
    const sheetName = await getSheetName();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:K`,
    });
    return response.data.values || [];
  } catch (error: any) {
    console.error("Error fetching sheet data:", error.message);
    return [];
  }
}

export async function appendSheetData(row: any[]) {
  if (!SPREADSHEET_ID) {
    console.error("Cannot append data: GOOGLE_SHEET_ID is not set.");
    return;
  }
  try {
    const sheetName = await getSheetName();
    const data = await getSheetData();
    const nextRow = data.length + 2; // +1 for header, +1 for next row

    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });
    triggerUpdate();
    return result;
  } catch (error: any) {
    console.error("Error adding to sheet:", error.message);
    throw error;
  }
}

export async function updateSheetRow(id: string, row: any[]) {
  if (!SPREADSHEET_ID) return;
  const sheetName = await getSheetName();
  const data = await getSheetData();
  
  const rowIndex = data.findIndex((r) => String(r[0]).trim() === String(id).trim());
  
  if (rowIndex === -1) {
    throw new Error(`Contact with ID ${id} not found`);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex + 2}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });
  triggerUpdate();
}

export async function deleteSheetRow(id: string) {
  if (!SPREADSHEET_ID) return;
  const sheetName = await getSheetName();
  const data = await getSheetData();
  const rowIndex = data.findIndex((r) => String(r[0]).trim() === String(id).trim());
  if (rowIndex === -1) return;

  const row = [...data[rowIndex]];
  row[7] = "deprecated"; 
  row[8] = new Date().toISOString(); 

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex + 2}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });
  triggerUpdate();
}

export async function clearDeprecatedRows() {
  if (!SPREADSHEET_ID) return;
  const data = await getSheetData();
  const sheetId = await getSheetId();
  
  const rowsToDelete = data
    .map((row, index) => ({ status: row[7], index }))
    .filter(item => item.status === 'deprecated')
    .map(item => item.index)
    .sort((a, b) => b - a);

  if (rowsToDelete.length === 0) return;

  try {
    const requests = rowsToDelete.map(index => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: "ROWS",
          startIndex: index + 1, 
          endIndex: index + 2,
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });
    triggerUpdate();
  } catch (error: any) {
    console.error("Error clearing deprecated rows:", error.message);
    throw error;
  }
}
