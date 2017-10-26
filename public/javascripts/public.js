$(function(){
    //点击切换选项卡颜色
    var url = location.href;
    // console.log(url)
    $(".nav>li>a").each((index,item)=>{
        if(item.href==url){
            $(item).parent().addClass("active").siblings().removeClass("active");
            return false;
        }
    })

})