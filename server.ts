import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("bookings.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add phone column if it doesn't exist (for existing databases)
try {
  db.prepare("SELECT phone FROM bookings LIMIT 1").get();
} catch (e) {
  console.log("Adding missing 'phone' column to bookings table...");
  db.exec("ALTER TABLE bookings ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // API Routes
  app.get("/api/bookings", (req, res) => {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }
    const stmt = db.prepare("SELECT time FROM bookings WHERE date = ?");
    const bookings = stmt.all(date);
    res.json(bookings);
  });

  app.post("/api/bookings", (req, res) => {
    const { name, email, phone, date, time } = req.body;
    
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ error: "All fields except email are required" });
    }

    const finalEmail = email || "";

    // Check if slot is already taken
    const checkStmt = db.prepare("SELECT id FROM bookings WHERE date = ? AND time = ?");
    const existing = checkStmt.get(date, time);
    
    if (existing) {
      return res.status(400).json({ error: "Slot already booked" });
    }

    const stmt = db.prepare("INSERT INTO bookings (name, email, phone, date, time) VALUES (?, ?, ?, ?, ?)");
    try {
      stmt.run(name, finalEmail, phone, date, time);
      
      // Broadcast the update to all clients
      broadcast({ type: "BOOKING_UPDATED", date });
      
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
