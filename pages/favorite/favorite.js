const app = getApp();
Page({
  data: {
    galleryData: [{
      title: '',
      nickname: '',
      photos: [],
      createtime: '',
      views: 0,
      liking: 0
    }],
    cursor: 1,
    end: false
  },
  onShow() {
    const self = this;
    wx.request({
      url: `${app.host}/photo/api/gallery/user/${wx.getStorageSync('token')}/favorites/page/0`,
      success(res) {
        const galleryData = res.data.userFavorites;
        self.setData({ galleryData });
      }
    });
  },
  onReachBottom: function () {
    const self = this;
    let oldList = self.data.galleryData.slice();
    if(!self.data.end){
      wx.request({
        url: `${app.host}/photo/api/gallery/user/${wx.getStorageSync('token')}/favorites/page/${self.data.cursor}`,
        success(res) {
          const galleryData = res.data.userFavorites;
          if (galleryData.length > 0) {
            oldList = oldList.concat(galleryData);
            wx.stopPullDownRefresh();
            self.setData({
              galleryData: oldList,
              cursor: self.data.cursor + 1
            });
          } else {
            self.setData({
              end: true
            });
          }
        }
      });
    }
  }
})