var express = require('express');
var router = express.Router();
var mongodb = require("mongodb");
var CONN_DB_STR = "mongodb://localhost:27017/cd1706";
var MongoClient = mongodb.MongoClient;
var async = require("async");

// 注册 
router.post("/register",(req,res)=>{
    var username = req.body.username;
    var password = req.body.password;
    var phone = req.body.phone;
  
    var insertData = function(db,callback){
        var conn = db.collection("user");   
        async.waterfall([
          function(callback){
             conn.find({username:username}).toArray((err,result)=>{
                 if(err) throw err;
                 console.log(result);
                 if(result.length>0){
                   callback(null,true);   //true表示用户名已经被注册
                 }else{
                   callback(null,false);
                 }
             })
          },
          function(arg,callback){
            if(!arg){
              console.log("没注册,可以插入");
              var date = new Date();
              var d = date.toLocaleString();
              conn.insert({username:username,password:password,phone:phone,time:d},(err,result)=>{
                if(err) throw err;
                console.log(result);
                callback(null,"0")
              })
            }else{
              callback(null,"1")
            }
          }
        ],function(err,result){
            if(err) throw err;
            callback(result);    //result为0表示插入成功 1为失败
        })
    }
  
    //  连接数据库
    MongoClient.connect(CONN_DB_STR,(err,db)=>{
        if(err) throw err;
        console.log("数据库连接成功!");
        insertData(db,function(result){
          console.log(result);
          if(result=="0"){
            console.log("插入成功!")
            req.session.username = username;
            res.send(`<script>location.href='/'</script>`);
            
          }else{
            console.log("插入失败!")          
            res.send(`<script>alert('用户名已存在请重新注册!');location.href='/register'</script>`);
          }
          db.close();
        })
    })
  
  
    // res.send("注册成功");
})
  
/* GET users listing. */

router.get("/username",(req,res)=>{
  var username = req.query.username;
  MongoClient.connect(CONN_DB_STR,(err,db)=>{
    if(err) throw err;
    console.log("数据库连接成功准备查询");
    var comment = db.collection("user");
    comment.find({username:username},{username:1}).toArray((err,result)=>{
      if(err) throw err;
      console.log("查询成功");
      console.log(result)
      if(result[0]){
        res.send('0');  // 表示用户名已注册
      }else{
        res.send('1');
      }
    })
  })
})

// 个人中心
router.get('/', function(req, res){
  var username = req.session.username;
  console.log(username);
  if(username){
    var pageSize = 5;  //每页评论数
    
    var iNow = req.query["iNow"];      //当前页数
    iNow = iNow?iNow:1;
    MongoClient.connect(CONN_DB_STR,(err,db)=>{
      if(err) throw err;
      console.log("数据库连接成功")
      var comment = db.collection("comment");
      var movie = db.collection("movie");
      async.waterfall([
        function(callback){
          comment.find({username:username},{_id:0,content:1,mid:1,uid:1,time:1}).toArray((err,result)=>{
            if(err) throw err;
            console.log("查询到评论");
            var mids = [];
            result.forEach((item,index)=>{
              var idss = {};
              idss.id = item.mid;
              mids.push(idss);
            })
            callback(null,mids,result);
          });
        },
        function(mids,result,callback){
          
          movie.find({$or:mids},{title:1,_id:0,id:1}).toArray((err,result1)=>{
            if(err){
              console.log("失败")
            }
            console.log("查询到电影")
            callback(null,[result,result1]);
          })
        }
      ],function(err,result){
        if(err) throw err;
        result[0].forEach((item,index)=>{
          result[1].forEach((val,index)=>{
            if(item.mid==val.id){
              item.mname = val.title;
            }
          })
        })
        result[0] = result[0].reverse()
        var count = result[0].length;     //全部评论数
        var total = Math.ceil(count/pageSize);     //总评论页数                            
        var ipage = result[0].slice(pageSize*(iNow-1),iNow*pageSize)
        console.log("查询成功!");
        console.log(ipage);
        iNow = parseInt(iNow);
        res.render('user',{
          result:ipage,
          username:username,
          all:result[0],
          iNow:iNow,
          count:count,
          total:total
        });
      })
    })
  }else{
    res.send(`<script>alert('登录超时,请重新登录!');location.href='/login'</script>`)
  }
});

// 登录
router.post("/login",(req,res)=>{
  var username = req.body.username;
  var password = req.body.password;
  var data = {username:username,password:password};
  // var findData = function(db,callback){
  //   var conn = db.collection("user");
  //   var data = {username:username,password:password};
  //   conn.find(data).toArray((err,result)=>{
  //     if(err) throw err;
  //     callback(result);
  //   })
  // }

  MongoClient.connect(CONN_DB_STR,(err,db)=>{
    if(err) throw err;
    console.log("数据库连接成功")
    // findData(db,(result)=>{
    //   if(result.length>0){
    //     console.log("查询到数据");
        
    //     req.session.username = username;
    //     console.log(req.session)
    //     res.redirect("/");
    //   }else{
    //     console.log("未查询到数据");
    //     res.send(`<script>alert('用户名或密码错误');location.href='/login'</script>`)
    //   }
    // })
    var user = db.collection("user");
    var adm = db.collection("adm");
    async.waterfall([
      function(callback){
        //先进行管理员账号查询
        adm.find(data,{_id:0}).toArray((err,result)=>{
          if(err) throw err;
          console.log("管理员账号查询结果");
          console.log(result);
          if(result.length>0){
            callback(null,true);  //true表示存在此管理员账号
          }else{
            callback(null,false);  //false表示不存在此管理员账号
          }
        })
      },
      function(arg,callback){
        if(arg){
          callback(null,2)      // 2表示可以登录管理员
        }else{
          user.find(data,{_id:0}).toArray((err,result)=>{
            if(err) throw err;
            console.log("普通用户账号查询结果");
            console.log(result);
            if(result.length>0){
              callback(null,1);  // 1表示可以登录普通用户
            }else{
              callback(null,false); // false表示登录失败
            }
          })
        }
      }
    ],function(err,result){
      if(err) throw err;
      console.log("登录判断")
      console.log(result);
      if(result==2){
        req.session.username=username;
        res.redirect("/administrator/");
      }else if(result==1){
        req.session.username=username;
        res.redirect("/");
      }else{
        res.send(`<script>alert('用户名或密码错误');location.href='/login'</script>`);
      }
    })
  })
})


// 删除评论
router.get("/delete",(req,res)=>{
  var username = req.session.username;
  var uid = req.query.uid*1;   // 将字符串转为number
  console.log(uid)
  if(username){
    MongoClient.connect(CONN_DB_STR,(err,db)=>{
      if(err) throw err;
      console.log("数据库连接成功")
      var comment = db.collection("comment");
      comment.deleteOne({uid:uid},(err,result)=>{
        if(err) throw err;
        console.log("删除成功");
        // res.redirect("/users");
        res.send(`<script>alert("删除成功");self.location=document.referrer;</script>`)
        db.close();
      })
    })
  }else{
    res.send(`<script>alert("登录超时，请重新登录");location.href='/login'</script>`)
  }
  
})

// 修改评论
router.post("/recomment",(req,res)=>{
  var username = req.session.username;
  var uid = req.body.uid*1;
  var content = req.body.content;
  console.log(content);
  console.log("==uid==")
  console.log(uid)
  if(username){
    MongoClient.connect(CONN_DB_STR,(err,db)=>{
      var comment = db.collection("comment");
      var time = new Date;
      var d = time.toLocaleString()
      comment.update({uid:uid},{$set:{content:content,time:d}},(err,result)=>{
        if(err) throw err;
        console.log("评论修改成功");
        res.send(`<script>alert("评论修改成功");location.reload();</script>`)
      })
    })
  }else{
    res.send(`<script>alert("登录超时，请重新登录");location.href='/login'</script>`)
  }
})


module.exports = router;
