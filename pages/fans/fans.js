const app = getApp();
Page({
  data: {
    fans: [],
  },
  onShow() {
    const self = this;
    wx.showLoading({ title: '加载中' });
    wx.request({
      url: `${app.host}/photo/api/user/${wx.getStorageSync('token')}/fans`,
      method: 'get',
      success(res) {
        self.setData({
          fans: res.data.fansList
        });
        wx.hideLoading();
      }
    })
  },
  removeTap(e) {
    const self = this;
    let oldData = self.data.fans.slice();
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
          fans: oldData
        });
      }
    });
  }
})