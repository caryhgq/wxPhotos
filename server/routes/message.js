const Router = require('koa-router');
const Render = require('../lib/render');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const db = require('../conf/db');
const privatekey = require('../conf/privatekey');

const router = new Router();

const users = db.get('users');
const message = db.get('message');

moment.locale('zh-cn');

//获取留言列表
router.get('/photo/api/gallery/message/:token',async(ctx,next)=>{
  const token = ctx.params.token;
  const decoded = jwt.verify(token, privatekey);
  const uid = ((await users.findOne({openid:decoded.openid}))._id).toString();
  let list = await message.find({squad:uid});
  list = list.map((item,index)=>{
    let guestInfo = {};
    const guestUid = (item.squad.filter((v,i)=>(v !== uid)))[0];
    const lastMessage = (item.messageList.reverse())[0];
    if(lastMessage.receiver.uid === guestUid){
      guestInfo = lastMessage.receiver;
    }else{
      guestInfo = lastMessage.sender;
    }
    delete guestInfo.openid;
    return {
      guestInfo:guestInfo,
      lastMessage:lastMessage.message,
      createTime:new Date(lastMessage.createTime).getTime()
    }
  });
  list = list.sort((a,b)=>(a.createTime < b.createTime));
  list.forEach((item,index)=>{
    item.createTime = moment(new Date(item.createTime)).fromNow();
  });
  ctx.body={
    code: 'succeed',
    list,
    message: '获取成功！',
  }
});

//添加留言
router.post('/photo/api/gallery/message/',async(ctx,next)=>{
  const receiverId = ctx.request.body.id;
  const token = ctx.request.body.token;
  const messageBody = ctx.request.body.message;
  const decoded = jwt.verify(token, privatekey);
  let receiverInfo = await users.findOne({_id:receiverId},{fields:{nickName:1,avatarUrl:1,openid:1}});
  let senderInfo   = await users.findOne({openid:decoded.openid},{fields:{nickName:1,avatarUrl:1,openid:1}});
  receiverInfo.uid = receiverInfo._id.toString();
  senderInfo.uid = senderInfo._id.toString();
  delete receiverInfo._id;
  delete senderInfo._id;
  const isExist = await message.findOne({squad:{$all:[receiverInfo.uid,senderInfo.uid]}});
  let newItem = null;
  if(isExist){
    newItem = await message.findOneAndUpdate({
      _id :isExist._id,
    },{
      $push:{messageList:{
        receiver: receiverInfo,
        sender  : senderInfo,
        message : messageBody,
        createTime : new Date(),
        isRead : false
      }},
      $set:{
        createTime: new Date()
      }
    });
  }else{
    newItem = await message.insert({
      squad :[receiverInfo.uid,senderInfo.uid],
      messageList : [{
        receiver: receiverInfo,
        sender  : senderInfo,
        message : messageBody,
        createTime : new Date(),
        isRead : false
      }],
      createTime:Date()
    });
  }
  newItem = newItem.messageList[Math.abs(newItem.messageList.length - 1)];
  newItem.passive = false;
  newItem.createTime = moment(new Date(newItem.createTime)).format("MMMDo HH:mm");
  delete newItem.receiver.openid;
  delete newItem.sender.openid;
  ctx.body={
    code: 'succeed',
    newItem,
    message: '发送成功！',
  }
});


//获取留言详情
router.get('/photo/api/gallery/message/:id/:token',async(ctx,next)=>{
  const uid = ctx.params.id;
  const decoded = jwt.verify(ctx.params.token, privatekey);
  const guestInfo = await users.findOne({openid:decoded.openid});
  let detail = await message.findOne({squad:{$all:[uid,(guestInfo._id).toString()]}});
  let messageList = [];
  if(detail){
    detail.messageList.forEach((item,index)=>{
      if(item.receiver.uid === uid){
        item.passive = false;
      }else{
        item.passive = true;
      }
      item.createTime = moment(new Date(item.createTime)).format("MMMDo HH:mm");
      delete item.receiver.openid;
      delete item.sender.openid;
    });
    ctx.body={
      code: 'succeed',
      messageList:detail.messageList,
      message: '获取成功！'
    }
  }else{
    ctx.body={
      code: 'succeed',
      messageList,
      message: '获取成功！'
    }
  }

});

router.allowedMethods();

module.exports = router;
