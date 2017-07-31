var app = getApp();
Page({
  data: {
    userId: '',
    messageList: [],
    isInput: false,
    replyText: ''
  },
  onLoad(options) {
    const self = this;
    wx.request({
      url: `${app.host}/photo/api/gallery/message/${options.id}/${wx.getStorageSync('token')}`,
      success(res) {
        if (res.data.messageList.length > 0) {
          self.setData({
            messageList: res.data.messageList
          });
        }
        self.setData({
          userId: options.id,
          toView: 'v' + (res.data.messageList.length - 1)
        });
      }
    });
  },
  openInput() {
    this.setData({
      isInput: true,
      replyText: ''
    });
  },
  closeInput() {
    this.setData({
      isInput: false
    });
  },
  replyInput(event) {
    const self = this;
    const message = event.detail.value.trim();
    let oldData = self.data.messageList.slice();
    if (message.length > 2) {
      let newList = this.data.messageList.slice();
      wx.request({
        url: `${app.host}/photo/api/gallery/message`,
        method: 'post',
        data: {
          id: self.data.userId,
          token: wx.getStorageSync('token'),
          message: message,
        },
        success(res) {
          oldData.push(res.data.newItem);
          self.setData({
            messageList: oldData,
            toView: 'v' + (oldData.length - 1)
          });
          self.setData({
            toView: 'v' + (oldData.length - 1)
          });
          self.closeInput();
        }
      })
    }else{
      self.closeInput();
    }
  }
})