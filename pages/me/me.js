const app = getApp();
Page({
  data: {
    userInfo: null,
    shareCount:0,
    collectCount:0
  },
  onShow(){
    const self = this;
    if (!app.userInfo.nickName) {
      wx.openSetting({
        success(res) {
          app.login(() => {
            app.userInfo.nickName && self.getCount();
          });
        }, fail(res) {
          console.log(res)
        }
      })
    }else{
      app.userInfo.nickName && self.getCount();
    }
  },
  getCount(){
    const self = this;
    self.setData({
      'userInfo': app.userInfo
    });
    wx.request({
      url: `${app.host}/photo/api/gallery/user/${wx.getStorageSync('token')}`,
      success(res){
        self.setData({
          'shareCount': res.data.shareCount,
          'collectCount': res.data.collectCount
        });
      },
      fail(){
        wx.showModal({
          title: '网络出错',
          content: '抱歉，刷线试试！',
          success: function (res) {
            if (res.confirm) {
              self.getCount();
            }
          }
        })
      }
    })
  }
})