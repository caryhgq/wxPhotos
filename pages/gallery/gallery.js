const app = getApp();
Page({
  data: {
    galleryData: [],
    isLoad : false,
    cursor: 1,
    tips: '载入中...',
    isLoading: false,
    isEnd: false
  },
  onLoad(){
    const self = this;
    wx.showLoading({ title: '加载中' });
    wx.request({
      url: `${app.host}/photo/api/gallery/${wx.getStorageSync('token')}/page/0`,
      success(res){
        self.setData({
          galleryData: res.data.userGallery,
          isLoad:true
        });
        wx.hideLoading();
      }
    })
  },
  onPullDownRefresh(){
    const self = this;
    wx.request({
      url: `${app.host}/photo/api/gallery/${wx.getStorageSync('token')}/page/0`,
      success(res) {
        wx.stopPullDownRefresh();
        self.setData({
          tips: '载入中...',
          isLoading: false,
          isEnd: false,
          galleryData: res.data.userGallery
        });
      }
    })
  },
  onReachBottom: function () {
    const self = this;
    let oldList = self.data.galleryData.slice();
    self.setData({
      isLoading: true
    });
    if(!self.data.isEnd){
      wx.request({
        url: `${app.host}/photo/api/gallery/${wx.getStorageSync('token')}/page/${self.data.cursor}`,
        success(res) {
          if (res.data.userGallery.length > 0) {
            oldList = oldList.concat(res.data.userGallery);
            wx.stopPullDownRefresh();
            self.setData({
              galleryData: oldList,
              tips: '载入中...',
              isLoading: false,
              cursor: self.data.cursor + 1
            });
          } else {
            self.setData({
              tips: '就这些，没了',
              isEnd: true,
              isLoading: true
            });
          }
        }
      })
    }
  },
  modifyAttr(index){
    const self = this;
    const id = this.data.galleryData[index]['_id'];
    const secret = this.data.galleryData[index]['secret'];
    wx.request({
      url: `${app.host}/photo/api/gallery/`,
      method:'put',
      data: {id, secret},
      success(res){
        wx.showToast({
          title: '状态已修改',
          icon: 'success',
          duration: 1000
        });
      }
    })
  },
  deleteOne(index){
    const self = this;
    const id = this.data.galleryData[index]['_id'];
    let newData = self.data.galleryData.slice();
    newData.splice(index,1);
    wx.request({
      url:`${app.host}/photo/api/gallery/`,
      method:'delete',
      data:{id},
      success(res){
        self.setData({
          galleryData:newData
        });
      }
    })
  },
  showOptsMenu(e) {
    const itemList = e.currentTarget.dataset.private ? ['编辑', '删除', '设为公开'] : ['编辑', '删除', '设为私密'];
    const self = this;
    const thiskey = self.data.galleryData.slice();
    thiskey[Number(e.currentTarget.dataset.id)].secret = !e.currentTarget.dataset.private;
    wx.showActionSheet({
      itemList: itemList,
      success: function (res) {
        if (res.tapIndex == 0) {
          wx.navigateTo({
            url: '../publish/publish?id=' + self.data.galleryData[e.currentTarget.dataset.id]['_id']
          })
        } else if (res.tapIndex == 1){
          self.deleteOne(e.currentTarget.dataset.id);
        } else if (res.tapIndex == 2){
          self.modifyAttr(e.currentTarget.dataset.id);
          self.setData({
            galleryData: thiskey
          });
        }
      }
    })
  }
})