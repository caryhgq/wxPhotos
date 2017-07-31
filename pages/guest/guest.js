const app = getApp();
Page({
  data: {
    userInfo:{
      avatarUrl:'',
      nickName:''
    },
    isFollow: false,
    galleryData: [],
    isLoad:false,
  },
  onLoad(options) {
    const self = this;
    wx.showLoading({title: '加载中'});
    wx.request({
      url: `${app.host}/photo/api/gallery/guest/${options.id}/${wx.getStorageSync("token")}`,
      success(res) {
        const listData = res.data.listData;
        const guestInfo = res.data.guestInfo;
        self.setData({
          'userInfo.nickName': guestInfo.nickName,
          'userInfo.avatarUrl': guestInfo.avatarUrl,
          'userInfo.uid': guestInfo._id,
          'galleryData': listData,
          'isFollow': res.data.isFollow,
          'isLoad':true
        });
        wx.hideLoading();
      }
    })
  },
  followYou(e){
    const self = this;
    wx.request({
      url: `${app.host}/photo/api/user/follow`,
      method: 'put',
      data: {
        uid: e.currentTarget.dataset.uid,
        token: wx.getStorageSync('token')
      },
      success(res) {
        console.log(res.data);
        self.setData({
          'isFollow': !self.data.isFollow
        })
      }
    });
  }
})