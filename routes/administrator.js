var express = require("express");
var router = express.Router();
var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var CONN_DB_STR = "mongodb://localhost:27017/cd1706";
var async = require("async");
var multiparty = require("multiparty");


// 管理员
router.get("/",(req,res)=>{
    console.log('asdasdasdad')
    var username = req.session.username;
    if(username){
      mongoClient.connect(CONN_DB_STR,(err,db)=>{
        if(err) throw err;
        console.log("数据库连接成功");
        var user = db.collection("user");
        user.find({},{_id:0}).toArray((err,result)=>{
          if(err) throw err;
          console.log("用户查询成功");
        //   console.log(result)
          res.render("administrator",{username:username,result:result});
        })
      })
    }else{
      res.send(`<script>alert('登录超时,请重新登录!');location.href='/login'</script>`)
    }
})


// 用户评论
router.get('/adcomment', function(req, res){
    var username = req.session.username;
    console.log("username="+username);
    var uid = req.query.uid;
    console.log(uid+"========")
    if(uid==undefined){
        uid = req.session.uid
    }else{
        req.session.uid = uid;
    }
    // console.log(uid)
    // console.log(username);
    if(username){
      var pageSize = 5;  //每页评论数
      var iNow = req.query["iNow"];      //当前页数
      iNow = iNow?iNow:1;
    //   console.log("iNow")
    //   console.log(iNow)
      mongoClient.connect(CONN_DB_STR,(err,db)=>{
        if(err) throw err;
        console.log("数据库连接成功")
        var comment = db.collection("comment");
        var movie = db.collection("movie");
        async.waterfall([
          function(callback){
            comment.find({username:uid},{_id:0,content:1,mid:1,uid:1,time:1,username:1}).toArray((err,result)=>{
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
            console.log(mids)
            movie.find({$or:mids},{title:1,_id:0,id:1}).toArray((err,result1)=>{
              if(err){
                console.log("失败")
                // throw err;
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
          res.render('adcomment',{
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

// 删除用户
router.get("/delete",(req,res)=>{
    var username = req.session.username;
    var uid = req.query.uid;
    if(username){
        mongoClient.connect(CONN_DB_STR,(err,db)=>{
            if(err) throw err;
            console.log("数据库连接成功");
            var user = db.collection("user");
            var comment = db.collection("comment");
            async.waterfall([
                function(callback){
                    user.deleteOne({username:uid},(err,result)=>{
                        if(err) throw err;
                        console.log("用户删除成功");
                        callback(null,true);
                    })
                },
                function(arg,callback){
                    comment.deleteMany({username:uid},(err,result)=>{
                        if(err) throw err;
                        console.log("用户评论删除成功");
                        callback(null,true);
                    })
                }
            ],function(err,result){
                if(err) throw err;
                console.log("清除成功")
                res.send(`<script>alert("删除成功");self.location=document.referrer;</script>`)
                db.close();
            })
            
        })
    }else{
        res.send(`<script>alert('登录超时,请重新登录!');location.href='/login'</script>`);
    }
})

// 删除评论
router.get("/comdelete",(req,res)=>{
    var username = req.session.username;
    var uid = req.query.uid*1;
    console.log(uid);
    mongoClient.connect(CONN_DB_STR,(err,db)=>{
        if(err) throw err;
        console.log("数据库连接成功");
        var comment = db.collection("comment");
        comment.deleteOne({uid:uid},(err,result)=>{
            if(err) throw err;
            console.log("删除成功");
            res.send(`<script>alert("删除成功");self.location=document.referrer;</script>`)
            db.close();
        })
    })
})



module.exports=router;