
var express = require("express");

var router = express.Router();

var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var CONN_DB_STR = "mongodb://localhost:27017/cd1706";
var async = require("async");
var multiparty = require("multiparty");
var fs = require("fs");

router.get('/index',(req,res)=>{
    var username = req.session.username;
    if(username){
      var id = req.query.id
      mongoClient.connect(CONN_DB_STR,(err,db)=>{
        if(err) throw err;
        console.log("数据库连接成功")
        var conn = db.collection("movie");
        conn.find({id:id},{_id:0,id:1,title:1,"images.large":1}).toArray((err,result)=>{
          if(err) throw err;
          console.log("电影查询成功");
          console.log(result);
          res.render('comment',{result:result[0],username:username})
        })
      })
    }else{
      res.send(`<script>alert("登录超时，请重新登录");location.href='/login'</script>`)
    }
  })

router.post("/submit",(req,res)=>{
    var username = req.session.username;
    if(username){
        var data = req.body;  //获取post提交的值
        var con = data.content;
        var mid = req.query.id; //获取电影id

        mongoClient.connect(CONN_DB_STR,(err,db)=>{
            if(err) throw err;
            console.log("数据库连接成功")
            var comment = db.collection('comment');
            var ids = db.collection('ids');

            async.waterfall([
                function(callback){
                    ids.findAndModify({name:"comment"},[["_id","desc"]],{$inc:{id:1}},(err,result)=>{
                        if(err) throw err;
                        console.log(result)
                        console.log("评论ID")
                        callback(null,result.value.id);
                    })
                },
                function(uid,callback){
                    var time = new Date;
                    var d = time.toLocaleString()
                    console.log("时间!!!!!!!!!")
                    console.log(d)
                    var data = {uid:uid,username:username,content:con,mid:mid,time:d}
                    comment.insert(data,(err,result)=>{
                        if(err) throw err;
                        console.log("评论插入成功");
                        console.log(result)
                        callback(null,result);
                    })
                }
            ],function(err,result){
                if(err) throw err;
                res.redirect('/comment/allcomment?id='+mid)
                db.close();
            })
        })
    }else{
        res.send(`<script>alert("登录超时，请重新登录");location.href='/login'</script>`)
    }
})

router.get("/allcomment",(req,res)=>{
    var username = req.session.username;
    if(username){
        
        mongoClient.connect(CONN_DB_STR,(err,db)=>{
            if(err) throw err;
            var mid = req.query.id;
            var conn = db.collection("comment");
            var movie = db.collection("movie");
            async.waterfall([
                function(callback){
                    conn.find({mid:mid},{_id:0,uid:1,username:1,content:1,time:1}).toArray((err,result)=>{
                        if(err) throw err;
                        console.log("评论查询成功");
                        result.forEach((item,index)=>{
                            item.floor = index+1;
                        })
                        result=result.reverse();
                        callback(null,result);
                    })
                },
                function(result,callback){
                    movie.find({id:mid},{_id:0,title:1,"images.large":1,id:1}).toArray((err,result1)=>{
                        if(err) throw err;
                        console.log("电影查询成功");
                        console.log(result1[0])
                        callback(null,[result,result1[0]]);
                    })
                }
            ],function(err,result){
                if(err) throw err;
                console.log(result[1])
                res.render("allcomment",{result:result[0],moviebox:result[1],username:username});
                db.close();
            })
            
        })
        
    }else{
        res.send(`<script>alert("登录超时，请重新登录");location.href='/login'</script>`)
    }
})

//上传图片
router.post("/uploadImg",(req,res)=>{
	console.log(req.session.username);
	var form =new multiparty.Form();   //实例化 multiparty

	// 设置编码
	form.encoding = "utf-8";
	//  设置文件的存储路径(临时)
	form.uploadDir = "./uploadtemp";
	// 设置文件的大小限制
	form.maxFilesSize = 2*1024*1014;

	form.parse(req,function(err,fields,files){
		// if(err) throw err;
		//  fields 上传的文件被解析的域
		// files 对应的文件
		console.log(fields)
		var uploadUrl = "/images/upload/";  //文件上传真实的后台路径
		file = files["filedata"];  // 富文本编辑框 xheditor
		originalFilename = file[0].originalFilename;  //文件初始名 后缀名
		tempath = file[0].path;   //临时文件的路径  进行删除 进行读取
		console.log(tempath);

		var timestamp = new Date().getTime();  //获取时间戳
		uploadUrl += timestamp + originalFilename; //213233212311.png
		newPath = "./public"+uploadUrl;
		console.log(newPath);

		// 通过文件流读写上传图片
		var fileReadStream = fs.createReadStream(tempath);   //读图片
		var fileWriteStream = fs.createWriteStream(newPath); // 写入图片

		fileReadStream.pipe(fileWriteStream);

		// 监听文件上传关闭
		fileWriteStream.on("close",function(){
			fs.unlinkSync(tempath)  //删除临时文件
            // req.session.username
            console.log("========")


















			console.log(req.session.username);
			res.send('{"err":"","msg":"'+uploadUrl+'"}')
            
		})
	})
});


module.exports=router;