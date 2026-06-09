const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = 8063;
const JWT_SECRET = 'amber_workshop_secret_key_2024';

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: '用户不存在' });
    
    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: '密码错误' });
    }
  });
});

app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, role, created_at FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', authenticateToken, (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
    [username, hashedPassword, role], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, username, role });
    }
  );
});

app.get('/api/rough-stones', authenticateToken, (req, res) => {
  db.all('SELECT * FROM rough_stones ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/rough-stones', authenticateToken, (req, res) => {
  const { stone_no, name, origin, initial_weight, color, transparency, description } = req.body;
  
  db.run(`INSERT INTO rough_stones (stone_no, name, origin, initial_weight, color, transparency, description, created_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    [stone_no, name, origin, initial_weight, color, transparency, description, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/customers', authenticateToken, (req, res) => {
  db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', authenticateToken, (req, res) => {
  const { name, phone, email, address } = req.body;
  
  db.run('INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)', 
    [name, phone, email, address],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/sandpaper', authenticateToken, (req, res) => {
  db.all('SELECT * FROM sandpaper ORDER BY grit', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/polishing-paste', authenticateToken, (req, res) => {
  db.all('SELECT * FROM polishing_paste ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/polishing-paste/:id', authenticateToken, (req, res) => {
  const { stock_quantity, min_stock } = req.body;
  
  db.run('UPDATE polishing_paste SET stock_quantity = ?, min_stock = ? WHERE id = ?', 
    [stock_quantity, min_stock, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.get('/api/work-orders', authenticateToken, (req, res) => {
  const query = `
    SELECT wo.*, rs.name as stone_name, rs.initial_weight, c.name as customer_name
    FROM work_orders wo
    LEFT JOIN rough_stones rs ON wo.stone_id = rs.id
    LEFT JOIN customers c ON wo.customer_id = c.id
    ORDER BY wo.created_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const today = new Date().toISOString().split('T')[0];
    rows.forEach(order => {
      if (order.status === 'processing' && order.delivery_date && order.delivery_date < today) {
        order.status = 'overdue';
      }
    });
    
    res.json(rows);
  });
});

app.post('/api/work-orders', authenticateToken, (req, res) => {
  const { stone_id, customer_id, delivery_date } = req.body;
  const order_no = 'WO' + Date.now();
  
  db.run(`INSERT INTO work_orders (order_no, stone_id, customer_id, delivery_date, created_by) 
          VALUES (?, ?, ?, ?, ?)`, 
    [order_no, stone_id, customer_id, delivery_date, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, order_no });
    }
  );
});

app.get('/api/work-orders/:id', authenticateToken, (req, res) => {
  db.get(`
    SELECT wo.*, rs.name as stone_name, rs.initial_weight, c.name as customer_name, c.phone as customer_phone
    FROM work_orders wo
    LEFT JOIN rough_stones rs ON wo.stone_id = rs.id
    LEFT JOIN customers c ON wo.customer_id = c.id
    WHERE wo.id = ?
  `, [req.params.id], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(`
      SELECT sr.*, s.grit, pp.name as paste_name, u.username as craftsman_name
      FROM stage_records sr
      LEFT JOIN sandpaper s ON sr.sandpaper_id = s.id
      LEFT JOIN polishing_paste pp ON sr.polishing_paste_id = pp.id
      LEFT JOIN users u ON sr.craftsman_id = u.id
      WHERE sr.order_id = ?
      ORDER BY sr.start_time
    `, [req.params.id], (err, records) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...order, records });
    });
  });
});

app.post('/api/work-orders/:id/advance-stage', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const { stage, weight_before, weight_after, crack_risk, notes, sandpaper_id, sandpaper_used, polishing_paste_id, polishing_paste_used } = req.body;
  
  if (weight_after !== undefined && weight_after !== null && weight_after > weight_before) {
    return res.status(400).json({ error: '修整后重量不能大于修整前重量' });
  }
  
  if (sandpaper_used && sandpaper_used > 0 && !sandpaper_id) {
    return res.status(400).json({ error: '填写了砂纸用量但未选择砂纸' });
  }
  
  if (polishing_paste_used && polishing_paste_used > 0 && !polishing_paste_id) {
    return res.status(400).json({ error: '填写了抛光膏用量但未选择抛光膏' });
  }
  
  const checkAndAdvance = (pasteStock) => {
    if (polishing_paste_used && polishing_paste_used > 0 && pasteStock !== null && polishing_paste_used > pasteStock) {
      return res.status(400).json({ error: `抛光膏用量(${polishing_paste_used}g)超过当前库存(${pasteStock}g)` });
    }
    
    const stages = ['cutting', 'grinding', 'polishing', 'drilling', 'recheck', 'completed'];
    const currentStageIndex = stages.indexOf(stage);
    const nextStage = currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : 'completed';
    const weight_loss = weight_after ? (weight_before - weight_after) : 0;
    
    db.run(`INSERT INTO stage_records 
            (order_id, stage, craftsman_id, weight_before, weight_after, weight_loss, crack_risk, notes, 
             sandpaper_id, sandpaper_used, polishing_paste_id, polishing_paste_used, end_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [orderId, stage, req.user.id, weight_before, weight_after, weight_loss, crack_risk, notes, 
       sandpaper_id, sandpaper_used, polishing_paste_id, polishing_paste_used],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        if (sandpaper_used && sandpaper_used > 0) {
          db.run('INSERT INTO material_usage_log (order_id, material_type, material_id, quantity, used_by) VALUES (?, ?, ?, ?, ?)',
            [orderId, 'sandpaper', sandpaper_id, sandpaper_used, req.user.id]);
        }
        
        if (polishing_paste_used && polishing_paste_used > 0) {
          db.run('INSERT INTO material_usage_log (order_id, material_type, material_id, quantity, used_by) VALUES (?, ?, ?, ?, ?)',
            [orderId, 'polishing_paste', polishing_paste_id, polishing_paste_used, req.user.id]);
          
          db.run('UPDATE polishing_paste SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [polishing_paste_used, polishing_paste_id]);
        }
        
        const newStatus = nextStage === 'completed' ? 'completed' : 'processing';
        db.run('UPDATE work_orders SET current_stage = ?, status = ? WHERE id = ?', 
          [nextStage, newStatus, orderId],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, nextStage });
          }
        );
      }
    );
  };
  
  if (polishing_paste_used && polishing_paste_used > 0 && polishing_paste_id) {
    db.get('SELECT stock_quantity FROM polishing_paste WHERE id = ?', [polishing_paste_id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(400).json({ error: '所选抛光膏不存在' });
      checkAndAdvance(row.stock_quantity);
    });
  } else {
    checkAndAdvance(null);
  }
});

app.post('/api/work-orders/:id/rework', authenticateToken, (req, res) => {
  const { reason, back_to_stage } = req.body;
  
  db.run('UPDATE work_orders SET current_stage = ?, status = ?, rework_reason = ?, rework_count = rework_count + 1 WHERE id = ?',
    [back_to_stage, 'rework', reason, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  db.all(`
    SELECT current_stage as name, COUNT(*) as value 
    FROM work_orders 
    GROUP BY current_stage
  `, (err, stageData) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(`
      SELECT pp.name, SUM(mul.quantity) as value
      FROM material_usage_log mul
      JOIN polishing_paste pp ON mul.material_id = pp.id
      WHERE mul.material_type = 'polishing_paste'
      GROUP BY mul.material_id
      ORDER BY value DESC
      LIMIT 10
    `, (err, materialData) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.all(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM work_orders
        WHERE created_at >= DATE('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date
      `, (err, trendData) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(`
          SELECT rework_reason as name, COUNT(*) as value
          FROM work_orders
          WHERE rework_reason IS NOT NULL AND rework_reason != ''
          GROUP BY rework_reason
        `, (err, reworkData) => {
          if (err) return res.status(500).json({ error: err.message });
          
          res.json({
            stageDistribution: stageData,
            materialConsumption: materialData,
            deliveryTrend: trendData,
            reworkReasons: reworkData
          });
        });
      });
    });
  });
});

app.get('/api/alerts', authenticateToken, (req, res) => {
  db.all(`
    SELECT * FROM work_orders 
    WHERE status = 'processing' 
    AND delivery_date < DATE('now')
  `, (err, overdueOrders) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(`
      SELECT * FROM polishing_paste 
      WHERE stock_quantity < min_stock
    `, (err, lowStockMaterials) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        overdueOrders,
        lowStockMaterials
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
