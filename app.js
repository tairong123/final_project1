var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sqlite3 = require('sqlite3').verbose(); // 引入 sqlite3

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var chargeRouter = require('./routes/charge'); // 引入 chargeRouter

var app = express();

// 設置 SQLite 資料庫連線
var db = new sqlite3.Database('./db/SQLite.sql', (err) => {
  if (err) {
    console.error('資料庫連線失敗：', err.message);
  } else {
    console.log('成功連接到 SQLite 資料庫');
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.db = db; // 將資料庫物件綁定到 req，供路由存取
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/charge', chargeRouter); // 設置 /charge 路由

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// 關閉伺服器時關閉資料庫連線
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('關閉資料庫連線時發生錯誤：', err.message);
    } else {
      console.log('資料庫連線已關閉');
    }
    process.exit(0);
  });
});

module.exports = app;
