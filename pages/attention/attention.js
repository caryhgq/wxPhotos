const app = getApp();
Page({
  data: {
    noticer: [],
  },
  onShow(){
    const self = this;
    wx.showLoading({ title: '加载中' });
    wx.request({
      url: `${app.host}/photo/api/user/${wx.getStorageSync('token')}/noticer`,
      method: 'get',
      success(res) {
        self.setData({
          noticer: res.data.noticerList
        });
        wx.hideLoading();
      }
    })
  },
  removeTap(e){
    const self = this;
    let oldData = self.data.noticer.slice();
    wx.request({
      url: `${app.host}/photo/api/user/follow`,
      method: 'put',
      data: {
        uid: e.target.dataset.id,
        token: wx.getStorageSync('token')
      },
      success(res) {
        oldData[e.target.dataset.index].isFollow = !oldData[e.target.dataset.index].isFollow;
        self.setData({
          noticer: oldData
        });
      }
    });
  }
})