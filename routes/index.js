var express = require('express');
var router = express.Router();
var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var CONN_DB_STR = "mongodb://127.0.0.1:27017/cd1706";

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render 渲染 模板  读取 html
  res.render('index.ejs', { title: 'Express',
  word:'哈哈',
  username:req.session.username
  });
  console.log(req.session);
});
//注册
router.get('/register',(req,res)=>{
  res.render("register.ejs")
})
//登录
router.get('/login',(req,res)=>{
  res.render('login')
})
//注销
router.get('/logout',(req,res)=>{
  req.session.destroy((err)=>{
    if(err) throw err;
    res.redirect('/')
  });
})
//所有电影
router.get('/movie',(req,res)=>{
  var username = req.session.username;
  if(username){    // 判断用户名是否过期
    console.log("username存在")
    var findData = function(db,callback){  // 查询数据库中所有电影
      var conn = db.collection("movie");
      conn.find({},{year:1,title:1,"rating.average":1,"images.medium":1,_id:0,id:1}).toArray((err,result)=>{
        if(err) throw err;
        callback(result);
      }) 
    }
    mongoClient.connect(CONN_DB_STR,(err,db)=>{ //连接数据库
      if(err) throw err;
      console.log("数据库连接成功");
      findData(db,(result)=>{
        // console.log(result)
        res.render('movie',{result:result,username:username});   //将查询到的数据返回给movie页面
      })
    })

  }else{
    res.send(`<script>alert("登录后才能查看所有电影哟!");location.href='/login'</script>`)
  }

  
})


router.get("/boot",(req,res)=>{
  res.render("boot");
})

module.exports = router;
