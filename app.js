const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// 初始化 Express 應用
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 資料庫檔案路徑
const dbFile = './db/SQLite.db';
const sqlScript = './db/SQLite.sql';

// 初始化資料庫
if (!fs.existsSync(dbFile)) {
  console.log('資料庫檔案不存在，正在初始化...');
  const db = new sqlite3.Database(dbFile);

  try {
    const initSQL = fs.readFileSync(sqlScript, 'utf8'); // 讀取 SQL 腳本
    db.exec(initSQL, (err) => {
      if (err) {
        console.error('執行 SQL 腳本失敗：', err.message);
      } else {
        console.log('資料庫初始化成功');
      }
    });
  } catch (err) {
    console.error('讀取 SQL 腳本失敗：', err.message);
  }

  db.close();
} else {
  console.log('資料庫檔案已存在');
}

// 你的其他 API 路由
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.post('/api/charge_add', (req, res) => {
  const { cost, type, year, month, day } = req.body;

  if (!cost || !type || !year || !month || !day) {
    return res.status(400).json({ error: '所有欄位皆為必填' });
  }

  const db = new sqlite3.Database(dbFile); // 打開資料庫
  const query = `INSERT INTO charge (cost, type, year, month, day) VALUES (?, ?, ?, ?, ?)`;

  db.run(query, [cost, type, year, month, day], function (err) {
    if (err) {
      console.error('新增資料失敗：', err.message);
      return res.status(500).json({ error: '新增資料失敗' });
    }

    res.status(200).json({ message: '資料新增成功', id: this.lastID });
  });

  db.close(); // 關閉資料庫
});

app.post('/api/get_month_total_money', (req, res) => {
  const { month, year } = req.body;

  // Debugging: Log the received month and year
  console.log(`Received month: ${month}, year: ${year}`);

  const query = `SELECT * FROM charge WHERE month=? AND year=?`;
  const totalCostQuery = `SELECT SUM(cost) AS totalCost FROM charge WHERE month=? AND year=?`;

  const db = new sqlite3.Database(dbFile);

  db.all(query, [month, year], (err, rows) => {
    if (err) {
      console.error('獲取記錄錯誤:', err);
      return res.status(500).json({ error: '無法獲取記錄' });
    }

    if (rows.length === 0) {
      // No records found for the given month and year
      console.log('No records found for the given month and year.');
      return res.json({ records: [], totalCost: 0 });
    }

    // Debugging: Log the rows returned by the query
    console.log('Found records:', rows);

    db.get(totalCostQuery, [month, year], (err, totalResult) => {
      if (err) {
        console.error('計算總花費錯誤:', err);
        return res.status(500).json({ error: '無法計算總花費' });
      }

      // Return the records and total cost
      res.json({
        records: rows,
        totalCost: totalResult ? totalResult.totalCost : 0,
      });
    });
  });

  db.close();
});

app.post('/api/get_total_money', (req, res) => {

  const query = `SELECT * FROM charge`;
  const totalCostQuery = `SELECT SUM(cost) AS totalCost FROM charge`;

  const db = new sqlite3.Database(dbFile);

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('獲取記錄錯誤:', err);
      return res.status(500).json({ error: '無法獲取記錄' });
    }

    if (rows.length === 0) {
      // No records found for the given month and year
      console.log('No records found for the given month and year.');
      return res.json({ totalCost: 0 });
    }

    // Debugging: Log the rows returned by the query
    console.log('Found records:', rows);

    db.get(totalCostQuery, [], (err, totalResult) => {
      if (err) {
        console.error('計算總花費錯誤:', err);
        return res.status(500).json({ error: '無法計算總花費' });
      }

      // Return the records and total cost
      res.json({
        totalCost: totalResult ? totalResult.totalCost : 0,
      });
    });
  });

  db.close();
});

app.post('/api/get_month_income', (req, res) => {
  const { month, year } = req.body;

  // Debugging: Log the received month and year
  console.log(`Received month: ${month}, year: ${year}`);

  const query = `SELECT * FROM charge WHERE month=? AND year=? AND cost > 0`;  // Only include positive costs
  const totalCostQuery = `SELECT SUM(cost) AS totalCost FROM charge WHERE month=? AND year=? AND cost > 0`;  // Only sum positive costs

  const db = new sqlite3.Database(dbFile);

  db.all(query, [month, year], (err, rows) => {
    if (err) {
      console.error('獲取記錄錯誤:', err);
      return res.status(500).json({ error: '無法獲取記錄' });
    }

    if (rows.length === 0) {
      // No records found for the given month and year
      console.log('No records found for the given month and year.');
      return res.json({ records: [], totalCost: 0 });
    }

    // Debugging: Log the rows returned by the query
    console.log('Found records:', rows);

    db.get(totalCostQuery, [month, year], (err, totalResult) => {
      if (err) {
        console.error('計算總花費錯誤:', err);
        return res.status(500).json({ error: '無法計算總花費' });
      }

      // Return the records and total cost
      res.json({
        records: rows,
        totalCost: totalResult ? totalResult.totalCost : 0,
      });
    });
  });

  db.close();
});

app.post('/api/get_month_cost', (req, res) => {
  const { month, year } = req.body;

  // Debugging: Log the received month and year
  console.log(`Received month: ${month}, year: ${year}`);

  const query = `SELECT * FROM charge WHERE month=? AND year=? AND cost < 0`;  // Only include positive costs
  const totalCostQuery = `SELECT SUM(cost) AS totalCost FROM charge WHERE month=? AND year=? AND cost < 0`;  // Only sum positive costs

  const db = new sqlite3.Database(dbFile);

  db.all(query, [month, year], (err, rows) => {
    if (err) {
      console.error('獲取記錄錯誤:', err);
      return res.status(500).json({ error: '無法獲取記錄' });
    }

    if (rows.length === 0) {
      // No records found for the given month and year
      console.log('No records found for the given month and year.');
      return res.json({ records: [], totalCost: 0 });
    }

    // Debugging: Log the rows returned by the query
    console.log('Found records:', rows);

    db.get(totalCostQuery, [month, year], (err, totalResult) => {
      if (err) {
        console.error('計算總花費錯誤:', err);
        return res.status(500).json({ error: '無法計算總花費' });
      }

      // Return the records and total cost
      res.json({
        records: rows,
        totalCost: totalResult ? totalResult.totalCost : 0,
      });
    });
  });

  db.close();
});

app.post('/api/get_type_month_cost', (req, res) => {
  const { month, year } = req.body;

  // Debugging: Log the received month and year
  console.log(`Received month: ${month}, year: ${year}`);

  const totalCostQuery = `
    SELECT type, SUM(cost) AS totalCost
    FROM charge
    WHERE month=? AND year=?
    GROUP BY type`;  // Group by type and sum costs

  const db = new sqlite3.Database(dbFile);

  db.all(totalCostQuery, [month, year], (err, totalResult) => {
    if (err) {
      console.error('計算總花費錯誤:', err);
      return res.status(500).json({ error: '無法計算總花費' });
    }

    if (totalResult.length === 0) {
      // No records found for the given month and year
      console.log('No records found for the given month and year.');
      return res.json({ totalCostByType: [] });
    }

    // Return the total cost grouped by type
    res.json({
      totalCostByType: totalResult || [],
    });
  });

  db.close();
});




module.exports = app;
