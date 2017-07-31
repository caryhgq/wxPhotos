const app = getApp();
Page({
  data: {
    galleryData: [],
    cursor: 1,
    tips: '载入中...',
    isLoading: false,
    isEnd: false
  },
  onLoad() {
    const self = this;
    wx.showLoading({title: '加载中'});
    wx.request({
      url: `${app.host}/photo/api/gallery/popular/page/0`,
      success(res) {
        const galleryData = res.data.listData;
        self.setData({ galleryData });
        wx.hideLoading();
      }
    });
  },
  onPullDownRefresh: function () {
    const self = this;
    wx.request({
      url: `${app.host}/photo/api/gallery/popular/page/0`,
      success(res) {
        const galleryData = res.data.listData;
        wx.stopPullDownRefresh();
        self.setData({
          tips: '载入中...',
          isLoading: false,
          isEnd: false,
          galleryData,
          cursor: 1
        });
      }
    });
  },
  onReachBottom: function () {
    const self = this;
    let oldList = self.data.galleryData.slice();
    self.setData({
      isLoading: true
    });
    if(!self.data.isEnd){
      wx.request({
        url: `${app.host}/photo/api/gallery/popular/page/${self.data.cursor}`,
        success(res) {
          const galleryData = res.data.listData;
          if (galleryData.length > 0) {
            oldList = oldList.concat(galleryData);
            wx.stopPullDownRefresh();
            self.setData({
              tips: '载入中...',
              galleryData: oldList,
              isLoading: false,
              cursor: self.data.cursor + 1
            });
          } else {
            self.setData({
              tips: '就这些，没了',
              isLoading: true,
              isEnd: true
            });
          }
        }
      });
    }
  }
})