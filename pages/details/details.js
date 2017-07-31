const app = getApp();
Page({
  data: {
    details: {
      id: '',
      title: '',
      avatar: '',
      nickName: '',
      createTime: '',
      isFollow: true,
      desc: '',
      photos: [],
      favorer: [],
      comments: [],
      isLike: false,
      isFavor: false,
      isSelf : false
    },
    isInput: false,
    replyText: '',
    replyHint: '说点什么（至少2个字哦）',
    commentReply:false,
    commentReplier:'',
    viewTo:'',
    isLoad : false
  },
  onLoad(options) {
    const self = this;
    wx.showLoading({title: '加载中'});
    wx.request({
      url: `${app.host}/photo/api/gallery/details/${options.id}/${wx.getStorageSync('token')}`,
      success(res) {
        const detail = res.data.detail;
        var isLike = true;
        detail.favorer && detail.favorer.forEach((item, index) => {
          if (app.userInfo.nickName == item.nickName) {
            isLike = true;
          }
        });
        self.setData({
          'details.id': detail._id,
          'details.title': detail.title,
          'details.nickName': detail.nickName,
          'details.avatar': detail.avatarUrl,
          'details.createTime': detail.createTime,
          'details.desc': detail.desc,
          'details.photos': detail.photos,
          'details.favorer': detail.favorer,
          'details.isFavor': detail.isFavor,
          'details.isLike': detail.isLike,
          'details.comments': detail.comments,
          'details.uid': detail.uid,
          'details.isFollow': detail.isFollow,
          'details.isSelf': detail.isSelf,
          isLoad: true
        });
        wx.hideLoading();
      }
    });
  },
  previewImage(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.imgurl,
      urls: e.currentTarget.dataset.imglist
    })
  },
  userInfo(e) {
    const uid = e.currentTarget.dataset.uid;
    if (app.userInfo._id == uid) {
      wx.switchTab({ url: '/pages/me/me' });
    } else {
      wx.navigateTo({ url: `/pages/guest/guest?id=${uid}` });
    }
  },
  openInput() {
    this.setData({
      isInput: true,
      replyText: '',
      commentReply: false,
      commentReplier: '',
      replyHint: '说点什么（至少2个字哦）'
    });
  },
  closeInput() {
    this.setData({
      isInput: false
    });
  },
  replyInput(event) {
    const self = this;
    let commentMessage = (event.detail.value).trim();
    if (commentMessage.length >= 2){
      if (self.data.commentReply){
        self.sendReply(commentMessage);
      }else{
        self.sendComment(commentMessage);
      }
    }else{
      self.closeInput();
    }
  },
  followTap() {
    const self = this;
    wx.request({
      url: `${app.host}/photo/api/user/follow`,
      method:'put',
      data:{
        uid: self.data.details.uid,
        token:wx.getStorageSync('token')
      },
      success(res){
        console.log(res.data);
        self.setData({
          'details.isFollow': !self.data.details.isFollow
        })
      }
    });
  },
  likeTap() {
    const self = this;
    wx.request({
      url: `${app.host}/photo/api/gallery/details`,
      method: 'put',
      data: {
        token: wx.getStorageSync('token'),
        id: self.data.details.id
      },
      success(res) {
        self.setData({
          'details.favorer': res.data.favorer,
          'details.isLike': !self.data.details.isLike
        })
      }
    })
  },
  favorTap() {
    const self = this;
    wx.request({
      url: `${app.host}/photo/api/gallery/favorites`,
      method: 'put',
      data: {
        token: wx.getStorageSync('token'),
        id: self.data.details.id,
      },
      success(res) {
        self.setData({
          'details.isFavor': !self.data.details.isFavor
        })
      }
    })
  },
  dropItem(e){
    const self = this;
    const uid = e.currentTarget.dataset.uid;
    const commentid = e.currentTarget.dataset.commentid;
    if (uid === app.userInfo._id){
      wx.showActionSheet({
        itemList: ['删除'],
        success: function (res) {
          if (res.tapIndex === 0) {
            console.log("删除评论", uid, commentid);
            wx.request({
              url: `${app.host}/photo/api/gallery/del/details/comment`,
              method:'delete',
              data:{
                detailsid: self.data.details.id,
                commentid: commentid
              },
              success(res){
                self.setData({
                  'details.comments': res.data.comments,
                });
                self.setData({
                  viewTo: 'lastOne'
                });
              }
            })
          }
        }
      })
    }
  },
  replyItem(e){
    const nickname = e.currentTarget.dataset.nickname;
    const commentid = e.currentTarget.dataset.commentid;
    this.setData({
      isInput: true,
      replyText: '',
      commentReply:true,
      commentReplier: commentid,
      replyHint: '回复'+nickname+'（至少2个字哦）'
    });
  },
  sendComment(commentMessage){
    const self = this;
    //发送评论
    wx.request({
      url: `${app.host}/photo/api/gallery/details/comment`,
      method: 'post',
      data: {
        id: self.data.details.id,
        token: wx.getStorageSync('token'),
        message: commentMessage
      },
      success(res) {
        const oldList = (self.data.details.comments).slice();
        oldList.push(res.data.newItem);
        self.setData({
          'details.comments': oldList,
        });
        self.setData({
          viewTo: 'lastOne'
        });
        self.closeInput();
      }
    });
  },
  sendReply(commentMessage){
    const self = this;
    //发送回复
    wx.request({
      url: `${app.host}/photo/api/gallery/del/details/comment/reply`,
      method:'PUT',
      data:{
        detailsid:self.data.details.id,
        commentid: self.data.commentReplier,
        token: wx.getStorageSync('token'),
        message: commentMessage
      },
      success(res){
        self.setData({
          'details.comments': res.data.comments,
        });
        self.setData({
          viewTo: 'lastOne'
        });
        self.closeInput();
      }
    })
  }
})