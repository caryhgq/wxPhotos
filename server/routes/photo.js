const Router = require('koa-router');
const Render = require('../lib/render');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const db = require('../conf/db');
const privatekey = require('../conf/privatekey');
const monk = require('monk');

const router = new Router();

const gallery = db.get('gallery');
const users = db.get('users');

moment.locale('zh-cn');

router.get('/',(ctx, next) => {
  ctx.body = Render('index',{
    title : 'api接口！';
  });
});

//发布和修改
router.post('/photo/api/gallery/publish', async(ctx, next) => {
  let formData = ctx.request.body.formData;
  let token = ctx.request.body.token;
  let photoCount = 0;
  if (token) {
    const decoded = jwt.verify(token, privatekey);
    let userInfo = await users.findOne({openid: decoded.openid}, {fields: {_id: 1,nickName: 1,gender: 1,avatarUrl: 1,openid: 1,photoCount: 1}});
    const subjoin = {
      uid: (userInfo._id).toString(),
      secret: false, //是否为私密
      views: 0, //浏览次数
      favorer: [], //点赞者列表
      createTime: new Date(), //创建时间
      comments:[],//评论列表
      favorer:[]//收藏列表
    };
    photoCount = userInfo.photoCount + 1;
    await users.update({openid: decoded.openid}, {$set: {photoCount}});
    delete userInfo._id;
    delete userInfo.photoCount;
    const createItem = Object.assign({}, formData, userInfo, subjoin);
    await gallery.insert(createItem);
    ctx.body = {
      code: 'succeed',
      message: '发布成功！'
    }
  } else {
    await gallery.update({_id: formData['_id']}, {$set: {title: formData.title,desc: formData.desc,photos: formData.photos,createTime: new Date()}});
    ctx.body = {
      code: 'succeed',
      message: '修改成功！'
    }
  }
});

//编辑相册详情
router.get('/photo/api/gallery/modify/:id', async(ctx, next) => {
  const id = ctx.params.id;
  let detail = await gallery.findOne({_id: id}, {fields: {title: 1,desc: 1,photos: 1}});
  ctx.body = {
    code: 'succeed',
    message: '获取详情成功！',
    detail
  }
});

//获取相册列表
router.get('/photo/api/gallery/page/:num', async(ctx, next) => {
  let page = (Number(ctx.params.num) || 0) * 8;
  let listData = await gallery.find({secret: false}, {sort: {createTime: -1},limit: 8,skip: page,fields: {openid: 0,desc: 0,secret: 0,comments:0}});
  listData.map((item, index) => {
    item.photos = item.photos.splice(0, 3);
    item.createTime = moment(new Date(item.createTime)).fromNow();
    item.favorer.forEach((v,i)=>{
      delete v.openid;
    });
  });
  ctx.body = {
    code: 'succeed',
    listData,
    message: '获取列表成功！'
  }
});

//获取热门相册列表
router.get('/photo/api/gallery/popular/page/:num', async(ctx, next) => {
  let page = (Number(ctx.params.num) || 0) * 8;
  let listData = await gallery.find({views: {$gt: 5},secret: false}, {sort: {views: -1},limit: 8,skip: page,fields: {openid: 0,desc: 0,secret: 0,comments:0}});
  listData.map((item, index) => {
    item.photos = item.photos.splice(0, 3);
    item.createTime = moment(new Date(item.createTime)).fromNow();
    item.favorer.forEach((v,i)=>{
      delete v.openid;
    });
  });
  ctx.body = {
    code: 'succeed',
    listData,
    message: '获取列表成功！'
  }
});

//获取个人相册
router.get('/photo/api/gallery/:token/page/:num', async(ctx, next) => {
  let page = (Number(ctx.params.num) || 0) * 8;
  const decoded = jwt.verify(ctx.params.token, privatekey);
  if (decoded.openid) {
    let userGallery = await gallery.find({openid: decoded.openid}, {sort: {createTime: -1},limit: 8,skip: page,fields: {openid: 0,desc: 0,comments:0}});
    userGallery.forEach((item, index) => {
      item.photos = item.photos.splice(0, 3);
      item.createTime = moment(new Date(item.createTime)).fromNow();
      item.favorer.forEach((v,i)=>{
        delete v.openid;
      });
    });
    ctx.body = {
      code: 'succeed',
      message: '获取列表成功！',
      userGallery
    }
  } else {
    ctx.body = {
      code: 'failed',
      message: '获取列表失败,token错误！',
      userGallery
    }
  }
});

//获取个人统计信息
router.get('/photo/api/gallery/user/:token', async(ctx, next) => {
  const decoded = jwt.verify(ctx.params.token, privatekey);
  const shareCount = await gallery.count({openid: decoded.openid,secret: false});
  console.log(decoded.openid);
  const favorites = (await users.findOne({openid: decoded.openid})).favorites;
  console.log(favorites);
  const collectCount = favorites ? favorites.length : 0
  ctx.body = {
    code: 'succeed',
    message: '获取成功！',
    shareCount,
    collectCount
  }
});

//获取相册详情
router.get('/photo/api/gallery/details/:id/:token', async(ctx, next) => {
  const id = ctx.params.id;
  const decoded = jwt.verify(ctx.params.token, privatekey);
  const userInfo = await users.findOne({openid: decoded.openid});
  let detail = await gallery.findOne({_id: id});
  let authorInfo = await users.findOne({openid: detail.openid});
  detail.views = detail.views ? detail.views + 1 : 1;
  await gallery.update({_id: id}, detail);
  detail.createTime = moment(new Date(detail.createTime)).fromNow();
  //判断用户是否已经收藏
  detail.isFavor = (userInfo.favorites.indexOf(id) !== -1);
  //判断用户是否点赞了
  if (detail.favorer.length > 0) {
    const currUserArr = detail.favorer.filter((item, index) => {
      return item.openid === decoded.openid
    });
    if (currUserArr.length > 0) {
      detail.isLike = true;
    } else {
      detail.isLike = false;
    }
  } else {
    detail.isLike = false;
  }
  detail.isSelf = (detail.openid === decoded.openid);
  //判断用户是否关注
  detail.isFollow = (authorInfo.fans.indexOf(decoded.openid) !== -1);
  //清理数据
  detail.favorer.forEach((item, index) => {
    delete item.openid;
  });
  detail.comments.forEach((item, index) => {
    item.createTime = moment(new Date(item.createTime)).fromNow();
    delete item.openid;
    item.replys.forEach((v,i)=>{
      v.createTime = moment(new Date(v.createTime)).fromNow();
      delete v.openid;
    });
  });
  delete detail.openid;
  ctx.body = {
    code: 'succeed',
    message: '获取详情成功！',
    detail
  }
});

//修改相册可见性
router.put('/photo/api/gallery/', async(ctx, next) => {
  const id = ctx.request.body['id'];
  const secret = ctx.request.body['secret'];
  await gallery.update({_id: id}, {$set: {secret: secret}});
  ctx.body = {
    code: 'succeed',
    message: '修改成功！'
  }
});

//删除个人相册
router.delete('/photo/api/gallery/', async(ctx, next) => {
  const id = ctx.request.body['id'];
  const openid = (await gallery.findOne({_id:id},{fields:{openid:1}})).openid;
  let oldData = await users.findOne({openid:openid});
  let oldCount = oldData.photoCount;
  let oldFavorites = oldData.favorites;
  oldFavorites.splice(oldFavorites.indexOf(id),1);
  await gallery.remove({_id: id});
  await users.update({openid:openid},{$set:{photoCount:(oldCount-1),favorites:oldFavorites}});
  ctx.body = {
    code: 'succeed',
    message: '删除成功！'
  }
});

//获取访客信息
router.get('/photo/api/gallery/guest/:uid/:token', async(ctx, next) => {
  const uid = ctx.params.uid;
  const decoded = jwt.verify(ctx.params.token, privatekey);
  const userInfo = await users.findOne({openid: decoded.openid});
  let listData = await gallery.find({uid: uid,secret: false}, {sort: {createTime: -1},fields: {openid: 0,comments:0}});
  let guestInfo = await users.findOne({_id:uid},{fields: {avatarUrl: 1,nickName:1}});
  listData.forEach((item, index) => {
    item.createTime = moment(new Date(item.createTime)).fromNow();
    item.photos = item.photos.splice(0, 3);
    item.favorer.forEach((item,index)=>{
      delete item.openid;
    });
  });

  //判断用户是否关注
  const isFollow = (userInfo.follow.indexOf(uid) !== -1);
  ctx.body = {
    code: 'succeed',
    listData,
    isFollow,
    guestInfo,
    message: '信息拉去成功！'
  }
});

//收藏更改
router.put('/photo/api/gallery/favorites', async(ctx, next) => {
  const token = ctx.request.body.token;
  const articleId = ctx.request.body.id;
  const decoded = jwt.verify(token, privatekey);
  let userFavorites = (await users.findOne({openid: decoded.openid})).favorites;
  if (userFavorites.indexOf(articleId) === -1) {
    userFavorites.push(articleId);
  } else {
    userFavorites.splice(userFavorites.indexOf(articleId), 1);
  }
  await users.update({openid: decoded.openid}, {$set: {favorites: userFavorites}}, {upsert: true});
  ctx.body = {
    code: 'succeed',
    message: '收藏成功！'
  }
});

//获取用户收藏列表
router.get('/photo/api/gallery/user/:token/favorites/page/:num', async(ctx, next) => {
  const decoded = jwt.verify(ctx.params.token, privatekey);
  let page = (Number(ctx.params.num) || 0) * 8;
  let multiQuery = [];
  let userFavorites = [];
  const favorites = (await users.findOne({openid: decoded.openid})).favorites;
  if(favorites.length > 0){
    multiQuery = favorites.map((item, index) => ({_id: item}));
    userFavorites = await gallery.find({$or: multiQuery}, {sort: {createTime: -1},limit: 8,skip: page}, {fields: {openid: 0}});
    userFavorites.forEach((item, index) => {
      item.createTime = moment(new Date(item.createTime)).fromNow();
    });
  }
  ctx.body = {
    code: 'succeed',
    userFavorites,
    message: '拉取收藏成功！'
  };
});

//相册点赞
router.put('/photo/api/gallery/details', async(ctx, next) => {
  const token = ctx.request.body.token;
  const id = ctx.request.body.id;
  const decoded = jwt.verify(token, privatekey);
  const userInfo = await users.findOne({openid: decoded.openid});
  let list = (await gallery.findOne({_id: id})).favorer;
  let userIndex = null;
  if (list && list.length > 0) {
    const userArr = list.filter((item, index) => {
      if (item.openid === userInfo.openid) {
        userIndex = index;
        return true;
      } else {
        return false;
      }
    });
    if (userArr.length > 0) {
      list.splice(userIndex, 1);
    } else {
      list.push({
        userAvatar: userInfo.avatarUrl,
        nickName: userInfo.nickName,
        gender: userInfo.gender,
        openid: userInfo.openid,
        _id: userInfo._id
      });
    }
  } else {
    list.push({
      userAvatar: userInfo.avatarUrl,
      nickName: userInfo.nickName,
      gender: userInfo.gender,
      openid: userInfo.openid,
      _id: userInfo._id
    });
  }
  await gallery.findOneAndUpdate({_id: id}, {$set: {favorer: list}});

  ctx.body = {code: 'succeed',favorer: list,message: '点赞成功！'};
});

//添加和取消关注
router.put('/photo/api/user/follow/', async(ctx, next) => {
  const followerId = ctx.request.body.uid;
  const token = ctx.request.body.token;
  const decoded = jwt.verify(token, privatekey);
  let fansList = (await users.findOne({_id: followerId}, {fields: {fans: 1}})).fans;
  let followList = (await users.findOne({openid: decoded.openid}, {fields: {follow: 1}})).follow;
  let message = '';
  if ((fansList.indexOf(decoded.openid) === -1) && (followList.indexOf(followerId) === -1)) {
    fansList.push(decoded.openid);
    followList.push(followerId);
    message = '关注成功！';
  } else {
    fansList.splice(fansList.indexOf(decoded.openid), 1);
    followList.splice(followList.indexOf(followerId), 1);
    message = '关注取消！';
  }
  await users.findOneAndUpdate({_id: followerId}, {$set: {fans: fansList}});
  await users.findOneAndUpdate({openid: decoded.openid}, {$set: {follow: followList}});
  ctx.body = {code: 'succeed',message};
});

//获取关注列表
router.get('/photo/api/user/:token/noticer', async(ctx, next) => {
  const token = ctx.params.token;
  const decoded = jwt.verify(token, privatekey);
  const userInfo = await users.findOne({openid: decoded.openid});
  let noticerList = await users.find({_id:{$in:userInfo.follow}},{fields:{nickName:1,avatarUrl:1,fans:1,photoCount:1}});
  noticerList.forEach((item,index)=>{
    item.fansCount = item.fans.length;
    item.isFollow = true;
    delete item.fans;
  });
  ctx.body = {
    code: 'succeed',
    noticerList,
    message: '关注者列表拉去成功！'
  }
});

//获取粉丝列表
router.get('/photo/api/user/:token/fans', async(ctx, next) => {
  const token = ctx.params.token;
  const decoded = jwt.verify(token, privatekey);
  const userInfo = await users.findOne({openid: decoded.openid});
  const fansList = await users.find({openid:{$in:userInfo.fans}},{fields:{nickName:1,avatarUrl:1,fans:1,photoCount:1}});
  fansList.forEach((item,index)=>{
    item.isFollow = (item.fans.indexOf(userInfo.openid) !== -1);
    item.fansCount = item.fans.length;
    delete item.fans;
  });
  ctx.body = {
    code: 'succeed',
    fansList,
    message: '关注者列表拉去成功！'
  }
});

//发布评论
router.post('/photo/api/gallery/details/comment',async(ctx,next)=>{
  const articleId = ctx.request.body.id;
  const token = ctx.request.body.token;
  const message = ctx.request.body.message;
  const decoded = jwt.verify(token, privatekey);
  const userInfo = await users.findOne({openid:decoded.openid});
  const newId = monk.id();
  await gallery.findOneAndUpdate({_id:articleId},{$push:{comments:{
    _id:newId,
    openid : decoded.openid,
    uid:userInfo._id,
    nickName : decoded.nickName,
    avatarUrl: userInfo.avatarUrl,
    comment  :  message,
    replys   : [],
    createTime : new Date()
  }}});
  ctx.body = {
    code: 'succeed',
    newItem:{
      _id:newId,
      uid:userInfo._id,
      nickName:decoded.nickName,
      avatarUrl: userInfo.avatarUrl,
      comment  :  message,
      replys   : [],
      createTime : moment(new Date()).fromNow()
    },
    message: '评论成功！'
  }
});

//删除评论
router.delete('/photo/api/gallery/del/details/comment',async(ctx,next)=>{
  const detailsid = ctx.request.body.detailsid;
  const commentid = ctx.request.body.commentid;
  await gallery.update({_id:detailsid},{$pull:{comments:{_id:commentid}}});//删除操作
  let newList = await gallery.findOne({_id:detailsid},{fields:{comments:1}});//返回新的评论列表
  newList.comments.forEach((item, index) => {
    item.createTime = moment(new Date(item.createTime)).fromNow();
    delete item.openid;
  });
  ctx.body = {
    code: 'succeed',
    comments:newList.comments,
    message: '评论删除成功！'
  }
});

//评论回复
router.put('/photo/api/gallery/del/details/comment/reply',async(ctx,next)=>{
  const detailsid = ctx.request.body.detailsid;
  const commentid = ctx.request.body.commentid;
  const token = ctx.request.body.token;
  const replyMsg = ctx.request.body.message;
  const decoded = jwt.verify(token, privatekey);
  let details = await gallery.findOne({_id:detailsid});

  details.comments.forEach((item,index)=>{
    if(item._id == commentid){
      item.replys.push({
        nickName:decoded.nickName,
        openid:decoded.openid,
        message :replyMsg,
        createTime : new Date()
      });
    }
  });

  await gallery.update({_id:detailsid},{$set:{comments:details.comments}});
  let newDetails = await gallery.findOne({_id:detailsid});
  newDetails.comments.forEach((item,index)=>{
    item.createTime = moment(new Date(item.createTime)).fromNow();
    delete item.openid;
    item.replys.forEach((v,i)=>{
      v.createTime = moment(new Date(v.createTime)).fromNow();
      delete v.openid;
    });
  });
  ctx.body = {
    code: 'succeed',
    comments:newDetails.comments,
    message: '评论回复成功！'
  }
});

router.allowedMethods();

module.exports = router;
