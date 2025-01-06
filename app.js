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

module.exports = app;
