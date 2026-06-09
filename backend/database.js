const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'amber.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('clerk', 'craftsman')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rough_stones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stone_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    origin TEXT,
    initial_weight REAL NOT NULL,
    color TEXT,
    transparency TEXT,
    description TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sandpaper (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grit INTEGER UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS polishing_paste (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT,
    stock_quantity REAL DEFAULT 0,
    min_stock REAL DEFAULT 10,
    unit TEXT DEFAULT 'g',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS work_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    stone_id INTEGER NOT NULL,
    customer_id INTEGER,
    current_stage TEXT DEFAULT 'cutting' CHECK(current_stage IN ('cutting', 'grinding', 'polishing', 'drilling', 'recheck', 'completed')),
    delivery_date DATE,
    status TEXT DEFAULT 'processing' CHECK(status IN ('processing', 'completed', 'overdue', 'rework')),
    rework_reason TEXT,
    rework_count INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stone_id) REFERENCES rough_stones(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS stage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    stage TEXT NOT NULL,
    craftsman_id INTEGER,
    weight_before REAL,
    weight_after REAL,
    weight_loss REAL,
    crack_risk TEXT,
    notes TEXT,
    sandpaper_id INTEGER,
    sandpaper_used REAL,
    polishing_paste_id INTEGER,
    polishing_paste_used REAL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    FOREIGN KEY (order_id) REFERENCES work_orders(id),
    FOREIGN KEY (craftsman_id) REFERENCES users(id),
    FOREIGN KEY (sandpaper_id) REFERENCES sandpaper(id),
    FOREIGN KEY (polishing_paste_id) REFERENCES polishing_paste(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS material_usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    material_type TEXT NOT NULL CHECK(material_type IN ('sandpaper', 'polishing_paste')),
    material_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    used_by INTEGER,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES work_orders(id),
    FOREIGN KEY (used_by) REFERENCES users(id)
  )`);

  db.get("SELECT COUNT(*) as count FROM users WHERE username = 'admin'", (err, row) => {
    if (row.count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run("INSERT INTO users (username, password, role) VALUES ('admin', ?, 'clerk')", [hashedPassword]);
      db.run("INSERT INTO users (username, password, role) VALUES ('craftsman1', ?, 'craftsman')", [hashedPassword]);
    }
  });

  db.get("SELECT COUNT(*) as count FROM sandpaper", (err, row) => {
    if (row.count === 0) {
      const grits = [180, 240, 320, 400, 600, 800, 1000, 1200, 1500, 2000, 3000, 5000, 7000];
      grits.forEach(grit => {
        db.run("INSERT INTO sandpaper (grit, description) VALUES (?, ?)", [grit, `${grit}目砂纸`]);
      });
    }
  });

  db.get("SELECT COUNT(*) as count FROM polishing_paste", (err, row) => {
    if (row.count === 0) {
      const pastes = [
        { name: '钻石膏 0.5μ', type: 'fine', stock: 50, min: 10 },
        { name: '钻石膏 1μ', type: 'fine', stock: 50, min: 10 },
        { name: '钻石膏 3μ', type: 'medium', stock: 50, min: 10 },
        { name: '钻石膏 6μ', type: 'medium', stock: 50, min: 10 },
        { name: '钻石膏 14μ', type: 'coarse', stock: 50, min: 10 },
        { name: '氧化铈抛光粉', type: 'final', stock: 30, min: 5 }
      ];
      pastes.forEach(p => {
        db.run("INSERT INTO polishing_paste (name, type, stock_quantity, min_stock) VALUES (?, ?, ?, ?)", 
          [p.name, p.type, p.stock, p.min]);
      });
    }
  });
});

module.exports = db;
