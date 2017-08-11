const Router = require('koa-router');
const request = require('request');
const jwt = require('jsonwebtoken');
const db = require('../conf/db');
const privatekey = require('../conf/privatekey');
const router = new Router();

const gallery = db.get('gallery');
const users = db.get('users');

//获取 session_key 和 openid
const getWXID = (code)=>{
  return new Promise((resolve, reject)=>{
    request('https://api.weixin.qq.com/sns/jscode2session?appid=wxd9b91639dcec09e2&secret=03fcc02d96acc079469d91767aa87c0c&js_code='+code+'&grant_type=authorization_code',(error, response, body)=>{
      error ? reject(error) : resolve(JSON.parse(body));
    });
  });
};

router.post('/photo/api/login', async(ctx, next) => {
  if(ctx.request.body.token){
    const decoded = jwt.verify(ctx.request.body.token,privatekey);
    if(decoded.openid){
      const currUser = await users.findOne({openid : decoded.openid},{fields:{'session_key':0,'expires_in':0,'openid':0,'fans':0,'language':0,'follow':0}});
      ctx.body = {
        code: 'succeed',
        userInfo :currUser,
        message: '登录成功！'
      };
    }else{
      ctx.body = {
        code: 'failed',
        message: '登录失败！'
      };
    }
  }else{
    const wxCode = ctx.request.body.code;
    let userInfo = ctx.request.body.userinfo;
    const wxID = await getWXID(wxCode);
    let userFullInfo = null;
    if(wxID.openid && wxID.session_key){
      userInfo = Object.assign({},userInfo,wxID,{createTime:new Date(),fans:[],favorites:[],follow:[],photoCount:0});
      const result = await users.find({openid : wxID.openid});
      if(result.length < 1){
        await users.insert(userInfo); //插入数据（防止重复插入）
      }else{
        //用户已经存在，更新用户资料
        await users.update({openid:wxID.openid},{$set:{nickName:userInfo.nickName,avatarUrl:userInfo.avatarUrl}});
        await gallery.update({openid:wxID.openid},{$set:{nickName:userInfo.nickName,avatarUrl:userInfo.avatarUrl}},{multi:true});
      }
      const token = jwt.sign({ nickName:userInfo.nickName,openid:userInfo.openid}, privatekey);
      userFullInfo = await users.findOne({openid:userInfo.openid},{fields:{'session_key':0,'expires_in':0,'openid':0,'fans':0,'language':0,'follow':0}});
      ctx.body = {
        code: 'succeed',
        token,
        userInfo:userFullInfo,
        message: '登录成功！'
      };
    }else{
      ctx.body = {
        code: 'failed',
        message: '登录失败！'
      };
    }
  }
});

router.allowedMethods();

module.exports = router;
