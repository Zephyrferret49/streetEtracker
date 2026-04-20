import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { STAGES } from "./src/constants.js";
import { 
  SPREADSHEET_ID, 
  getSheetData, 
  appendSheetData, 
  updateSheetRow, 
  deleteSheetRow, 
  clearDeprecatedRows, 
  formatContactRow, 
  COL_INDICES,
  setOnUpdate
} from "./sheets.js";
import { getBot, WEBHOOK_PATH, launchBot } from "./telegramBot.js";

// Firebase Admin for server-side sync
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase Admin with explicit credentials if available
if (!getApps().length) {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin initialized with service account for project:", firebaseConfig.projectId);
    } else {
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("Firebase Admin initialized with default credentials for project:", firebaseConfig.projectId);
    }
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
    initializeApp();
  }
}

// Use the specific database ID if provided, otherwise the default database
const dbId = firebaseConfig.firestoreDatabaseId;
const firestore = dbId ? getFirestore(dbId) : getFirestore();

// Test connection on startup
async function testFirestoreConnection() {
  try {
    console.log(`Testing Firestore connection to database: ${dbId || '(default)'}...`);
    // Try to list collections or get a document to verify permissions
    await firestore.listCollections();
    console.log("Firestore connection test successful.");
  } catch (error: any) {
    console.error("Firestore connection test failed:", error.message);
    if (error.message?.includes('PERMISSION_DENIED')) {
      console.warn("WARNING: PERMISSION_DENIED. This is common during initial provisioning. The sync will retry on the next write.");
    }
  }
}
testFirestoreConnection();

async function syncToFirebase(contacts: any[]) {
  if (!contacts || contacts.length === 0) {
    console.log("No contacts to sync to Firebase.");
    return;
  }
  
  try {
    const currentDbId = dbId || '(default)';
    console.log(`[Firebase Sync] Starting sync of ${contacts.length} contacts to DB: ${currentDbId}`);
    
    // Firestore batch limit is 500, let's chunk if necessary
    const batchSize = 500;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const chunk = contacts.slice(i, i + batchSize);
      const batch = firestore.batch();
      
      chunk.forEach(contact => {
        if (contact.id) {
          const docRef = firestore.collection('contacts').doc(contact.id);
          batch.set(docRef, contact);
        }
      });
      
      await batch.commit();
      console.log(`[Firebase Sync] Committed chunk of ${chunk.length} contacts (${i + chunk.length}/${contacts.length})`);
    }
    
    console.log(`[Firebase Sync] Full sync complete.`);
  } catch (error: any) {
    console.error("[Firebase Sync] Error during sync:", error.message);
    if (error.message?.includes('PERMISSION_DENIED')) {
      console.error("[Firebase Sync] PERMISSION_DENIED: Please ensure the service account has 'Cloud Datastore User' or 'Firebase Admin' permissions.");
    }
  }
}

async function syncSingleToFirebase(contact: any) {
  if (!contact || !contact.id) return;
  try {
    await firestore.collection('contacts').doc(contact.id).set(contact);
    console.log(`Synced contact ${contact.id} to Firebase.`);
  } catch (error: any) {
    console.error(`Error syncing contact ${contact.id} to Firebase:`, error.message);
  }
}

async function deleteFromFirebase(id: string) {
  try {
    await firestore.collection('contacts').doc(id).delete();
    console.log(`Deleted contact ${id} from Firebase.`);
  } catch (error: any) {
    console.error(`Error deleting contact ${id} from Firebase:`, error.message);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log("--- Application Starting ---");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("APP_URL:", process.env.APP_URL);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// --- WebSocket Setup ---
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  console.log("New WebSocket client connected. Total clients:", wss.clients.size);
  ws.on("close", () => {
    console.log("WebSocket client disconnected. Total clients:", wss.clients.size);
  });
});

function broadcastUpdate() {
  console.log("Broadcasting update to", wss.clients.size, "clients");
  const message = JSON.stringify({ type: "UPDATE_CONTACTS" });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function mapRowToContact(row: any[]) {
  const statusStr = row[7] || STAGES[0];
  let status = statusStr.split(',').map((s: string) => s.trim()).filter(Boolean);
  const highPriority = row[9] === "TRUE";
  
  // Ensure high-priority is in the status array if the boolean column is TRUE
  if (highPriority && !status.includes('high-priority')) {
    status.push('high-priority');
  }
  
  return {
    id: row[0],
    name: row[1] || "-",
    gender: row[2] || "-",
    teamMember: row[3] || "-",
    age: row[4] || "-",
    remarks: row[5] || "-",
    occupation: row[6] || "-",
    status: status.length > 0 ? status : [STAGES[0]],
    updatedAt: row[8] || new Date().toISOString(),
    highPriority: highPriority,
    socialMedia: row[10] || "-",
  };
}

async function fetchAndSyncContacts() {
  try {
    if (!SPREADSHEET_ID) return [];
    const data = await getSheetData();
    const contacts = data
      .filter((row) => row[0] && row[0].trim() !== "")
      .map(mapRowToContact);
    
    syncToFirebase(contacts).catch(err => console.error("Background sync failed:", err));
    return contacts;
  } catch (error) {
    console.error("Error fetching and syncing contacts:", error);
    return [];
  }
}

// Connect Sheets updates to WebSocket broadcast and Firebase sync
setOnUpdate(async () => {
  broadcastUpdate();
  await fetchAndSyncContacts();
});

console.log("Starting server in", process.env.NODE_ENV || "development", "mode");

// --- Telegram Bot Setup ---
const bot = getBot();
if (bot) {
  if (process.env.NODE_ENV === "production" && process.env.APP_URL) {
    console.log("Registering Telegram Webhook middleware at", WEBHOOK_PATH);
    // Register webhook middleware BEFORE express.json() to avoid body parsing issues
    app.use(bot.webhookCallback(WEBHOOK_PATH));
  }
  launchBot();
}

app.use(express.json());

// --- API Routes ---
app.get("/api/debug", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    PORT: process.env.PORT,
    K_SERVICE: process.env.K_SERVICE || "local",
    K_REVISION: process.env.K_REVISION || "local",
    HAS_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    BOT_TOKEN_PREFIX: process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.substring(0, 8) : "none",
    WEBHOOK_PATH: WEBHOOK_PATH,
    SPREADSHEET_ID: SPREADSHEET_ID ? `${SPREADSHEET_ID.substring(0, 5)}...` : "none",
  });
});

app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await fetchAndSyncContacts();
    res.json(contacts);
  } catch (error) {
    console.error("Error in GET /api/contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

app.post("/api/contacts", async (req, res) => {
  try {
    const id = Date.now().toString() + "-" + Math.floor(Math.random() * 1000);
    const row = formatContactRow(id, req.body);
    await appendSheetData(row);
    
    const newContact = { id, ...req.body, updatedAt: row[COL_INDICES.UPDATED_AT] };
    syncSingleToFirebase(newContact).catch(err => console.error("Sync failed:", err));
    
    res.json(newContact);
  } catch (error) {
    console.error("Error in POST /api/contacts:", error);
    res.status(500).json({ error: "Failed to create contact" });
  }
});

app.put("/api/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const row = formatContactRow(id, req.body);
    await updateSheetRow(id, row);
    
    const updatedContact = { id, ...req.body, updatedAt: row[COL_INDICES.UPDATED_AT] };
    syncSingleToFirebase(updatedContact).catch(err => console.error("Sync failed:", err));
    
    res.json(updatedContact);
  } catch (error) {
    console.error("Error in PUT /api/contacts/:id:", error);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

app.delete("/api/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSheetRow(id);
    deleteFromFirebase(id).catch(err => console.error("Delete sync failed:", err));
    res.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/contacts/:id:", error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

app.post("/api/contacts/clear-deprecated", async (req, res) => {
  try {
    await clearDeprecatedRows();
    res.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/contacts/clear-deprecated:", error);
    res.status(500).json({ error: "Failed to clear deprecated contacts" });
  }
});

app.post("/api/contacts/batch", async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) return res.status(400).json({ error: "Updates must be an array" });

    for (const update of updates) {
      const { id, ...data } = update;
      const row = formatContactRow(id, data);
      await updateSheetRow(id, row);
    }
    res.json({ success: true, count: updates.length });
  } catch (error) {
    console.error("Error in batch update:", error);
    res.status(500).json({ error: "Batch update failed" });
  }
});

app.get("/api/readme", (req, res) => {
  try {
    const readmePath = path.join(__dirname, "README.TXT");
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, "utf-8");
      res.json({ content });
    } else {
      res.status(404).json({ error: "README.TXT not found" });
    }
  } catch (error) {
    console.error("Error reading README.TXT:", error);
    res.status(500).json({ error: "Failed to read README.TXT" });
  }
});

// Catch-all for unknown API routes to prevent falling through to Vite HTML
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

// --- Vite Middleware / Static Serving ---
const distPath = path.join(__dirname, "dist");
const assetsPath = path.join(distPath, "assets");

console.log("Environment NODE_ENV:", process.env.NODE_ENV);
console.log("Resolved distPath:", distPath);

if (process.env.NODE_ENV === "production") {
  if (fs.existsSync(distPath)) {
    console.log("Serving static files from:", distPath);
    
    // Serve assets specifically with long-term caching (they have hashes)
    app.use("/assets", express.static(assetsPath, {
      immutable: true,
      maxAge: "1y",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript");
        }
      }
    }));

    // Serve other static files (like index.html) with no-cache to ensure updates are picked up
    app.use(express.static(distPath, {
      maxAge: "0",
      setHeaders: (res, filePath) => {
        if (path.basename(filePath) === "index.html") {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));

    // SPA fallback - ONLY for non-file requests
    app.get("*", (req, res) => {
      // If the request looks like a file (has an extension) but wasn't caught by express.static
      if (path.extname(req.path) && !req.path.endsWith(".html")) {
        console.warn(`File not found: ${req.path}`);
        return res.status(404).send("File not found");
      }
      
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        // Set headers to prevent caching of the entry point
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.sendFile(indexPath);
      } else {
        res.status(500).send("index.html missing in dist folder");
      }
    });
  } else {
    console.error("CRITICAL: dist folder not found at", distPath);
    console.warn("Falling back to Vite middleware in production. This is NOT recommended and might cause startup timeouts on Cloud Run.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
} else {
  console.log("Using Vite middleware for development");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
