const app = getApp();
Page({
  data: {
    listData: []
  },
  onShow() {
    const self = this;
    if (wx.getStorageSync('token')) {
      this.getData();
    }
    else {
      wx.openSetting({
        success(res) {
          app.login(() => {
            self.getData();
          });
        }, fail(res) {
          console.log(res)
        }
      })
    }
  },
  getData(cb) {
    const self = this;
    wx.request({
      url: `${app.host}/photo/api/gallery/message/${wx.getStorageSync('token')}`,
      success(res) {
        self.setData({
          listData: res.data.list
        });
        cb && cb();
      }
    })
  },
  onPullDownRefresh() {
    this.getData(() => {
      wx.stopPullDownRefresh();
    });
  }
})