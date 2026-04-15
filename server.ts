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
import { OAuth2Client } from "google-auth-library";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";

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
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT,
      author TEXT NOT NULL,
      author_id INTEGER,
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
  `);

  // Migration: Add status column if it doesn't exist
  const tableInfo = db.prepare("PRAGMA table_info(content)").all() as any[];
  const hasStatus = tableInfo.some(col => col.name === 'status');
  if (!hasStatus) {
    console.log("Adding status column to content table...");
    db.exec("ALTER TABLE content ADD COLUMN status TEXT DEFAULT 'pending'");
    db.exec("UPDATE content SET status = 'approved'");
  }

  const hasAuthorId = tableInfo.some(col => col.name === 'author_id');
  if (!hasAuthorId) {
    console.log("Adding author_id column to content table...");
    db.exec("ALTER TABLE content ADD COLUMN author_id INTEGER");
  }

  const hasViews = tableInfo.some(col => col.name === 'views');
  if (!hasViews) {
    console.log("Adding views column to content table...");
    db.exec("ALTER TABLE content ADD COLUMN views INTEGER DEFAULT 0");
  }

  // Migration: Add password column to users if it doesn't exist
  const userTableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const hasPassword = userTableInfo.some(col => col.name === 'password');
  if (!hasPassword && userTableInfo.length > 0) {
    console.log("Adding password column to users table...");
    db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'temporary_password'");
  }

  const hasGoogleId = userTableInfo.some(col => col.name === 'google_id');
  if (!hasGoogleId && userTableInfo.length > 0) {
    console.log("Adding google_id column to users table...");
    db.exec("ALTER TABLE users ADD COLUMN google_id TEXT");
  }

  const hasUsername = userTableInfo.some(col => col.name === 'username');
  if (!hasUsername && userTableInfo.length > 0) {
    console.log("Adding username column to users table...");
    db.exec("ALTER TABLE users ADD COLUMN username TEXT UNIQUE");
  }

  const hasBio = userTableInfo.some(col => col.name === 'bio');
  if (!hasBio && userTableInfo.length > 0) {
    console.log("Adding bio column to users table...");
    db.exec("ALTER TABLE users ADD COLUMN bio TEXT");
  }

  // Migration: Add avatar column to comments if it doesn't exist
  const commentTableInfo = db.prepare("PRAGMA table_info(comments)").all() as any[];
  const hasCommentAvatar = commentTableInfo.some(col => col.name === 'avatar');
  if (!hasCommentAvatar && commentTableInfo.length > 0) {
    console.log("Adding avatar column to comments table...");
    db.exec("ALTER TABLE comments ADD COLUMN avatar TEXT");
  }

  // Migration: Add sender_username to messages if it doesn't exist
  const messageTableInfo = db.prepare("PRAGMA table_info(messages)").all() as any[];
  const hasSenderUsername = messageTableInfo.some(col => col.name === 'sender_username');
  if (!hasSenderUsername && messageTableInfo.length > 0) {
    console.log("Adding sender_username column to messages table...");
    db.exec("ALTER TABLE messages ADD COLUMN sender_username TEXT");
  }

  const friendTableInfo = db.prepare("PRAGMA table_info(friends)").all() as any[];
  const hasRequesterId = friendTableInfo.some(col => col.name === 'requester_id');
  if (!hasRequesterId && friendTableInfo.length > 0) {
    console.log("Adding requester_id column to friends table...");
    db.exec("ALTER TABLE friends ADD COLUMN requester_id INTEGER");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      author TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (content_id) REFERENCES content(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      password TEXT,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      google_id TEXT UNIQUE,
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

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      sender_name TEXT NOT NULL,
      sender_username TEXT,
      sender_avatar TEXT,
      text TEXT,
      content_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (content_id) REFERENCES content(id)
    );

    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id1 INTEGER NOT NULL,
      user_id2 INTEGER NOT NULL,
      status TEXT NOT NULL, -- 'pending', 'accepted'
      requester_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id1) REFERENCES users(id),
      FOREIGN KEY (user_id2) REFERENCES users(id),
      UNIQUE(user_id1, user_id2)
    );

    CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
  `);
} catch (err) {
  console.error("Database initialization failed:", err);
}

// Seed initial data if empty
try {
  const count = db.prepare("SELECT count(*) as count FROM content").get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare("INSERT INTO content (title, description, type, url, thumbnail, author, likes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    insert.run("Achyutam Keshavan Krishna Damodaram", "A beautiful bhajan dedicated to Lord Krishna, bringing peace and serenity to the soul.", "video", "https://www.youtube.com/embed/dQw4w9WgXcQ", "https://picsum.photos/seed/bhajan1/800/450", "Krishna Devotee", 1200, "approved");
    insert.run("Divine Morning Aarti", "Experience the divine energy of the morning aarti.", "reel", "https://assets.mixkit.co/videos/preview/mixkit-meditation-in-the-mountains-4453-large.mp4", "https://picsum.photos/seed/reel1/400/700", "Bhakti Channel", 5400, "approved");
    insert.run("Morning Spiritual Vibes", "Start your day with these divine visuals and sacred energy.", "photo", "https://picsum.photos/seed/spirit1/800/1200", "https://picsum.photos/seed/spirit1/400/600", "Sadhaka", 850, "approved");
    insert.run("The Story of Hanuman", "An inspiring tale of devotion, strength, and the legendary leap of faith by Lord Hanuman.", "story", "#", "https://picsum.photos/seed/hanuman/400/300", "Puranic Tales", 2100, "approved");
  }
} catch (err) {
  console.error("Seeding failed:", err);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Chat state (last 50 messages)
  const getMessages = () => {
    return db.prepare(`
      SELECT m.*, c.title as content_title, c.thumbnail as content_thumbnail, c.type as content_type 
      FROM messages m 
      LEFT JOIN content c ON m.content_id = c.id 
      ORDER BY m.created_at DESC LIMIT 50
    `).all().reverse();
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // Send recent messages to new user
    socket.emit("chat-init", getMessages());

    socket.on("send-message", (data) => {
      const { senderId, senderName, senderUsername, senderAvatar, text, contentId } = data;
      const insert = db.prepare("INSERT INTO messages (sender_id, sender_name, sender_username, sender_avatar, text, content_id) VALUES (?, ?, ?, ?, ?, ?)");
      const result = insert.run(senderId, senderName, senderUsername || null, senderAvatar, text || null, contentId || null);
      
      const newMessage = db.prepare(`
        SELECT m.*, c.title as content_title, c.thumbnail as content_thumbnail, c.type as content_type 
        FROM messages m 
        LEFT JOIN content c ON m.content_id = c.id 
        WHERE m.id = ?
      `).get(result.lastInsertRowid) as any;

      io.emit("new-message", newMessage);
    });

    socket.on("send-private-message", (data) => {
      const { senderId, receiverId, text } = data;
      const insert = db.prepare("INSERT INTO private_messages (sender_id, receiver_id, text) VALUES (?, ?, ?)");
      const result = insert.run(senderId, receiverId, text);
      
      const newMessage = db.prepare(`
        SELECT pm.*, u.name as sender_name, u.username as sender_username, u.avatar as sender_avatar
        FROM private_messages pm
        JOIN users u ON pm.sender_id = u.id
        WHERE pm.id = ?
      `).get(result.lastInsertRowid) as any;

      // Emit to both sender and receiver
      io.emit(`private-message-${senderId}-${receiverId}`, newMessage);
      io.emit(`private-message-${receiverId}-${senderId}`, newMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  app.set('trust proxy', true);
  console.log("Configuring middleware...");
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
    const { email: rawEmail, password, name, username } = req.body;
    const email = rawEmail?.toLowerCase().trim();
    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const formattedUsername = username ? username.toLowerCase().trim().replace(/\s+/g, '_') : null;

    try {
      if (formattedUsername) {
        const existingUsername = db.prepare("SELECT id FROM users WHERE username = ?").get(formattedUsername);
        if (existingUsername) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare("INSERT INTO users (email, password, name, username) VALUES (?, ?, ?, ?)").run(email, hashedPassword, name, formattedUsername);
      const user = db.prepare("SELECT id, email, name, username, avatar, bio, favorite_deity FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
      (req.session as any).userId = user.id;
      res.json(user);
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        if (err.message.includes("users.email")) return res.status(400).json({ error: "Email already exists" });
        if (err.message.includes("users.username")) return res.status(400).json({ error: "Username already taken" });
        return res.status(400).json({ error: "User already exists" });
      }
      console.error("Signup error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email: rawEmail, password } = req.body;
    const identifier = rawEmail?.toLowerCase().trim();
    if (!identifier || !password) return res.status(400).json({ error: "Email/Username and password required" });

    const user = db.prepare("SELECT * FROM users WHERE email = ? OR username = ?").get(identifier, identifier) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log(`Failed login attempt for identifier: ${identifier}`);
      return res.status(401).json({ error: "Invalid credentials. If you don't have an account, please sign up." });
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

    const user = db.prepare("SELECT id, email, name, username, avatar, bio, favorite_deity FROM users WHERE id = ?").get(userId);
    res.json(user);
  });

  app.post("/api/user/update", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { name, username, bio } = req.body;
    const formattedUsername = username ? username.toLowerCase().trim().replace(/\s+/g, '_') : null;

    try {
      if (formattedUsername) {
        const existing = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(formattedUsername, userId);
        if (existing) return res.status(400).json({ error: "Username already taken" });
      }

      db.prepare("UPDATE users SET name = ?, username = ?, bio = ? WHERE id = ?").run(name, formattedUsername, bio, userId);
      const user = db.prepare("SELECT id, email, name, username, avatar, bio, favorite_deity FROM users WHERE id = ?").get(userId);
      res.json(user);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/user/avatar", upload.single("avatar"), (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const avatarUrl = `/uploads/${req.file.filename}`;
    try {
      db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(avatarUrl, userId);
      res.json({ avatar: avatarUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update avatar" });
    }
  });

  app.post("/api/auth/guest", (req, res) => {
    try {
      // Find or create a guest user
      let guestUser = db.prepare("SELECT * FROM users WHERE email = ?").get("guest@example.com") as any;
      
      if (!guestUser) {
        const result = db.prepare("INSERT INTO users (email, name, avatar) VALUES (?, ?, ?)").run(
          "guest@example.com", 
          "Guest User", 
          "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest"
        );
        guestUser = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      }

      (req.session as any).userId = guestUser.id;
      const { password: _, ...userWithoutPassword } = guestUser;
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Guest login error:", err);
      res.status(500).json({ error: "Failed to login as guest" });
    }
  });

  app.get("/api/users/search", (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== "string") return res.json([]);

    const userId = (req.session as any).userId;
    const query = `%${q.toLowerCase()}%`;
    
    // Search users and include friendship status if logged in
    let users;
    if (userId) {
      users = db.prepare(`
        SELECT u.id, u.name, u.username, u.avatar, u.bio,
               f.status as friendship_status,
               f.requester_id
        FROM users u
        LEFT JOIN friends f ON (f.user_id1 = ? AND f.user_id2 = u.id) OR (f.user_id1 = u.id AND f.user_id2 = ?)
        WHERE (LOWER(u.username) LIKE ? OR LOWER(u.name) LIKE ?) AND u.id != ?
        LIMIT 10
      `).all(userId, userId, query, query, userId);
    } else {
      users = db.prepare(`
        SELECT id, name, username, avatar, bio 
        FROM users 
        WHERE LOWER(username) LIKE ? OR LOWER(name) LIKE ? 
        LIMIT 10
      `).all(query, query);
    }
    res.json(users);
  });

  // Friend Endpoints
  app.post("/api/friends/request", (req, res) => {
    const userId = (req.session as any).userId;
    const { targetId } = req.body;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    if (userId === targetId) return res.status(400).json({ error: "Cannot add yourself" });

    try {
      const [id1, id2] = userId < targetId ? [userId, targetId] : [targetId, userId];
      db.prepare("INSERT INTO friends (user_id1, user_id2, status, requester_id) VALUES (?, ?, ?, ?)").run(id1, id2, 'pending', userId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Request already exists" });
    }
  });

  app.post("/api/friends/accept", (req, res) => {
    const userId = (req.session as any).userId;
    const { targetId } = req.body;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const [id1, id2] = userId < targetId ? [userId, targetId] : [targetId, userId];
    db.prepare("UPDATE friends SET status = 'accepted' WHERE user_id1 = ? AND user_id2 = ?").run(id1, id2);
    res.json({ success: true });
  });

  app.post("/api/friends/reject", (req, res) => {
    const userId = (req.session as any).userId;
    const { targetId } = req.body;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const [id1, id2] = userId < targetId ? [userId, targetId] : [targetId, userId];
    db.prepare("DELETE FROM friends WHERE user_id1 = ? AND user_id2 = ?").run(id1, id2);
    res.json({ success: true });
  });

  app.get("/api/friends", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const friends = db.prepare(`
      SELECT u.id, u.name, u.username, u.avatar, u.bio, f.status, f.requester_id
      FROM friends f
      JOIN users u ON (f.user_id1 = u.id AND f.user_id2 = ?) OR (f.user_id2 = u.id AND f.user_id1 = ?)
    `).all(userId, userId);
    res.json(friends);
  });

  // Private Message Endpoints
  app.get("/api/messages/private/:otherUserId", (req, res) => {
    const userId = (req.session as any).userId;
    const { otherUserId } = req.params;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const messages = db.prepare(`
      SELECT pm.*, u.name as sender_name, u.username as sender_username, u.avatar as sender_avatar
      FROM private_messages pm
      JOIN users u ON pm.sender_id = u.id
      WHERE (pm.sender_id = ? AND pm.receiver_id = ?) OR (pm.sender_id = ? AND pm.receiver_id = ?)
      ORDER BY pm.created_at ASC
    `).all(userId, otherUserId, otherUserId, userId);
    res.json(messages);
  });

  app.get("/api/content/trending", (req, res) => {
    const trending = db.prepare(`
      SELECT * FROM content 
      WHERE status = 'approved' 
      ORDER BY likes DESC 
      LIMIT 20
    `).all();
    res.json(trending);
  });

  app.get("/api/auth/config", (req, res) => {
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || null,
      isConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      googleRedirectUri: getRedirectUri(req, 'google')
    });
  });

  // Google OAuth
  const getRedirectUri = (req: any, provider: string) => {
    // In this environment, we are always behind an HTTPS proxy
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${protocol}://${host}/api/auth/${provider}/callback`;
  };

  app.get("/api/auth/google/url", (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: "Google OAuth credentials not configured" });
    }
    const googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    const redirectUri = getRedirectUri(req, 'google');
    const url = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
      redirect_uri: redirectUri
    });
    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const redirectUri = getRedirectUri(req, 'google');

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).send('Google OAuth credentials not configured');
    }

    const googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    try {
      const { tokens } = await googleClient.getToken({
        code: code as string,
        redirect_uri: redirectUri
      });
      googleClient.setCredentials(tokens);

      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const userInfo = await userInfoRes.json() as any;

      let user = db.prepare("SELECT * FROM users WHERE google_id = ? OR email = ?").get(userInfo.sub, userInfo.email) as any;

      if (!user) {
        const result = db.prepare("INSERT INTO users (email, name, avatar, google_id) VALUES (?, ?, ?, ?)").run(
          userInfo.email,
          userInfo.name,
          userInfo.picture,
          userInfo.sub
        );
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      } else if (!user.google_id) {
        db.prepare("UPDATE users SET google_id = ?, avatar = ? WHERE id = ?").run(userInfo.sub, userInfo.picture, user.id);
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
      }

      (req.session as any).userId = user.id;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Google OAuth error:', err);
      res.status(500).send('Authentication failed');
    }
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
    const { search, status, limit, offset, type } = req.query;
    let content;
    
    const filterStatus = status || 'approved';
    const l = parseInt(limit as string) || 20;
    const o = parseInt(offset as string) || 0;

    let sql = "SELECT * FROM content WHERE status = ?";
    const params: any[] = [filterStatus];

    if (search) {
      sql += " AND (title LIKE ? OR type LIKE ?)";
      const query = `%${search}%`;
      params.push(query, query);
    }

    if (type) {
      sql += " AND type = ?";
      params.push(type);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(l, o);

    content = db.prepare(sql).all(...params);
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

    const insert = db.prepare("INSERT INTO content (title, description, type, url, thumbnail, author, author_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const result = insert.run(title, description || "", type, finalUrl, thumbnail || `https://picsum.photos/seed/${Math.random()}/800/450`, author, (req.session as any).userId || null, 'pending');
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/content/:id/view", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE content SET views = views + 1 WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update views" });
    }
  });

  app.get("/api/user/content", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const userContent = db.prepare(`
      SELECT * FROM content 
      WHERE author_id = ? 
      ORDER BY created_at DESC
    `).all(userId);
    res.json(userContent);
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
    const { text, author, avatar } = req.body;
    db.prepare("INSERT INTO comments (content_id, text, author, avatar) VALUES (?, ?, ?, ?)").run(id, text, author || "Anonymous", avatar || null);
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
