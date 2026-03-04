import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import bcrypt from "bcryptjs";
import session from "express-session";
import cookieParser from "cookie-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const db = new Database("bhakti.db");

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
});

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail TEXT,
    author TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add status column if it doesn't exist
const tableInfo = db.prepare("PRAGMA table_info(content)").all() as any[];
const hasStatus = tableInfo.some(col => col.name === 'status');
if (!hasStatus) {
  console.log("Adding status column to content table...");
  db.exec("ALTER TABLE content ADD COLUMN status TEXT DEFAULT 'pending'");
  // Update existing content to approved
  db.exec("UPDATE content SET status = 'approved'");
}

// Migration: Add password column to users if it doesn't exist
const userTableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const hasPassword = userTableInfo.some(col => col.name === 'password');
if (!hasPassword && userTableInfo.length > 0) {
  console.log("Adding password column to users table...");
  // Since we can't add NOT NULL without default to existing table
  db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'temporary_password'");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES content(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    favorite_deity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'history', 'liked', 'watch_later'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (content_id) REFERENCES content(id),
    UNIQUE(user_id, content_id, type)
  );
`);

// Seed initial data if empty
const count = db.prepare("SELECT count(*) as count FROM content").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO content (title, description, type, url, thumbnail, author, likes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insert.run("Achyutam Keshavan Krishna Damodaram", "A beautiful bhajan dedicated to Lord Krishna, bringing peace and serenity to the soul.", "video", "https://www.youtube.com/embed/dQw4w9WgXcQ", "https://picsum.photos/seed/bhajan1/800/450", "Krishna Devotee", 1200, "approved");
  insert.run("Divine Morning Aarti", "Experience the divine energy of the morning aarti.", "reel", "https://assets.mixkit.co/videos/preview/mixkit-meditation-in-the-mountains-4453-large.mp4", "https://picsum.photos/seed/reel1/400/700", "Bhakti Channel", 5400, "approved");
  insert.run("Morning Spiritual Vibes", "Start your day with these divine visuals and sacred energy.", "photo", "https://picsum.photos/seed/spirit1/800/1200", "https://picsum.photos/seed/spirit1/400/600", "Sadhaka", 850, "approved");
  insert.run("The Story of Hanuman", "An inspiring tale of devotion, strength, and the legendary leap of faith by Lord Hanuman.", "story", "#", "https://picsum.photos/seed/hanuman/400/300", "Puranic Tales", 2100, "approved");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: "bhakti-sacred-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: true, 
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPassword, name);
      const user = db.prepare("SELECT id, email, name, avatar, favorite_deity FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
      (req.session as any).userId = user.id;
      res.json(user);
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    (req.session as any).userId = user.id;
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = db.prepare("SELECT id, email, name, avatar, favorite_deity FROM users WHERE id = ?").get(userId);
    res.json(user);
  });

  // Library Routes
  app.get("/api/user/:userId/library", (req, res) => {
    const { userId } = req.params;
    const library = db.prepare(`
      SELECT ul.type, c.* 
      FROM user_library ul 
      JOIN content c ON ul.content_id = c.id 
      WHERE ul.user_id = ?
      ORDER BY ul.created_at DESC
    `).all(userId) as any[];

    const result = {
      history: library.filter(i => i.type === 'history'),
      liked: library.filter(i => i.type === 'liked'),
      watch_later: library.filter(i => i.type === 'watch_later')
    };
    res.json(result);
  });

  app.post("/api/user/:userId/library", (req, res) => {
    const { userId } = req.params;
    const { contentId, type, action } = req.body; // action: 'add' or 'remove'

    if (action === 'add') {
      try {
        // For history, we might want to update the timestamp if it already exists
        if (type === 'history') {
          db.prepare("DELETE FROM user_library WHERE user_id = ? AND content_id = ? AND type = ?").run(userId, contentId, type);
        }
        db.prepare("INSERT INTO user_library (user_id, content_id, type) VALUES (?, ?, ?)").run(userId, contentId, type);
      } catch (e) {
        // Ignore unique constraint errors for likes/watch_later
      }
    } else {
      db.prepare("DELETE FROM user_library WHERE user_id = ? AND content_id = ? AND type = ?").run(userId, contentId, type);
    }
    res.json({ success: true });
  });

  // API Routes
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  app.get("/api/content", (req, res) => {
    const { search, status } = req.query;
    let content;
    
    // If status is provided, filter by it (admin view)
    // Otherwise, default to 'approved'
    const filterStatus = status || 'approved';

    if (search) {
      const query = `%${search}%`;
      content = db.prepare("SELECT * FROM content WHERE (title LIKE ? OR type LIKE ?) AND status = ? ORDER BY created_at DESC").all(query, query, filterStatus);
    } else {
      content = db.prepare("SELECT * FROM content WHERE status = ? ORDER BY created_at DESC").all(filterStatus);
    }
    res.json(content);
  });

  app.patch("/api/content/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    db.prepare("UPDATE content SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  app.post("/api/content", (req, res) => {
    const { title, description, type, url, thumbnail, author } = req.body;
    if (!title || !type || !url || !author) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Simple logic to extract YT embed if it's a normal YT link
    let finalUrl = url;
    const ytParams = "?modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&controls=1";
    if ((type === 'video' || type === 'reel') && url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      finalUrl = `https://www.youtube.com/embed/${videoId}${ytParams}`;
    } else if ((type === 'video' || type === 'reel') && url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      finalUrl = `https://www.youtube.com/embed/${videoId}${ytParams}`;
    } else if ((type === 'video' || type === 'reel') && url.includes('youtube.com/embed/')) {
      // If it's already an embed link but doesn't have our params
      if (!url.includes('modestbranding')) {
        finalUrl = url.includes('?') ? `${url}&${ytParams.slice(1)}` : `${url}${ytParams}`;
      }
    }

    const insert = db.prepare("INSERT INTO content (title, description, type, url, thumbnail, author, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const result = insert.run(title, description || "", type, finalUrl, thumbnail || `https://picsum.photos/seed/${Math.random()}/800/450`, author, 'pending');
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/content/:id/like", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE content SET likes = likes + 1 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/content/:id/comments", (req, res) => {
    const { id } = req.params;
    const comments = db.prepare("SELECT * FROM comments WHERE content_id = ? ORDER BY created_at DESC").all(id);
    res.json(comments);
  });

  app.post("/api/content/:id/comments", (req, res) => {
    const { id } = req.params;
    const { text, author } = req.body;
    db.prepare("INSERT INTO comments (content_id, text, author) VALUES (?, ?, ?)").run(id, text, author || "Anonymous");
    res.json({ success: true });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
