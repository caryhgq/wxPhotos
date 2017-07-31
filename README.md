## 多彩画册

#### 微信相册小程序 - 《多彩画册》

小程序学习之作，代码比较糙！后台使用 NodeJs + MongoDB + Nginx，源码在文件夹server内！


后台服务

图片的上传使用了 又拍云的服务，图片存储在云端

```js

//文件 routes/login.js 

//获取 session_key 和 openid ；appid 和secret 请替换为自己的
const getWXID = (code)=>{
  return new Promise((resolve, reject)=>{
    request('https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code='+code+'&grant_type=authorization_code',(error, response, body)=>{
      error ? reject(error) : resolve(JSON.parse(body));
    });
  });
};


//文件 routes/getSignature.js 又拍云的账号，请参考又拍云api

router.post('/getSignature',(ctx, next) => {
  if(ctx.request.body.data){
    const signature = base64Sha1(ctx.request.body.data, md5('自己的密码'));
    ctx.body = {code:'succeed',signature:signature};
  }else{
    ctx.body = {code:'failed',message:'参数不正确！'};
  }
});
```

<img style="width:240px;" src="http://img.fairy-domain.com/2017/wxPhotos.jpg" alt="多彩画册">

#### 主要功能

- 1.照片上传
- 2.照片管理 （删除，更改，设置公开或私密）
- 3.评论 （可评论他人，仅支持一层评论）
- 4.关注，点赞
- 5.评论
- 6.发私信 (简单的留言功能)
- 7.查看粉丝，查看关注



