var express = require('express');
var path = require('path');         // node模块
var favicon = require('serve-favicon');  // 处理 favicon.ico
var logger = require('morgan');     // 日志处理
var cookieParser = require('cookie-parser'); //  方便操作cookies
var bodyParser = require('body-parser');  // 获取 请求的参数
var session = require("express-session");

var index = require('./routes/index');
var users = require('./routes/users');
var comment = require('./routes/comment');  // 评论模块 

var app = express();   // app  集成express 各种功能

// view engine setup
app.set('views', path.join(__dirname, 'views')); // __dirname 根目录 views 里面的文件路径替换到根目录   
app.set('view engine', 'ejs');  //模板 引擎 ejs

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));  如果有favicon.icn
app.use(logger('dev'));
app.use(bodyParser.json());  // 接口 http://localhost:7000/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // 静态文件 忽视public
// 配置session 中间键 
// session  会话 
app.use(session({
  secret:"recommend 128 bytes random string",
  cookie:{maxAge:1000*60*20},   //会话的有效时长  20min
  resave:true, //自动保存
  saveUninitialized:true  
}));


// 配置中间键
app.use('/', index);
app.use('/users', users);
app.use("/comment",comment);  // /comment 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
