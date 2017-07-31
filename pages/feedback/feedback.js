const app = getApp();
const Upyun = require('../../utils/upyun-sdk.js');
const upyun = new Upyun({
  bucket: 'wxphotos',
  operator: 'root',
  getSignatureUrl: `${app.host}/getSignature`
});
Page({
  data: {
    items: [
      {
        name: 'bug',
        value: '程序错误',
        checked: true
      }, {
        name: 'suggest',
        value: '功能建议',
      }
    ],
    formData: {
      genre: 'bug',
      detail: '',
      screenshot: []
    }
  },
  radioChange(e) {
    let selectList = this.data.items.slice();
    selectList.forEach((item, index) => {
      item.checked = (item.name === e.detail.value);
    });
    this.setData({
      'items': selectList,
      'formData.genre': e.detail.value
    });
  },
  feedbackMessage(e) {
    this.setData({
      'formData.detail': e.detail.value
    });
  },
  selectScreenshot() {
    const self = this;
    wx.chooseImage({
      count: (4 - self.data.formData.screenshot.length),
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePaths = res.tempFilePaths;
        tempFilePaths.forEach((item, index) => {
          upyun.upload({
            localPath: item,
            remotePath: '/{year}/{mon}/{day}/upload_{random32}{.suffix}',
            success: function (res) {
              self.setData({
                'formData.screenshot': self.data.formData.screenshot.concat('http://img.fairy-domain.com' + JSON.parse(res.data).url)
              });
            },
            fail: function ({errMsg}) {
              console.log('uploadImage fail, errMsg is', errMsg)
            }
          })
        });
      }
    })
  },
  remove(e){
    var screenshot = this.data.formData.screenshot.slice();
    screenshot.splice(e.currentTarget.dataset.id,1);
    this.setData({
      'formData.screenshot': screenshot
    })
  },
  submitForm(){
    const selected = this.data.items.filter((item, index) => (item.checked));
    this.data.formData.genre = selected[0].value;
    const formData = this.data.formData;
    wx.request({
      url: `${app.host}/photo/api/gallery/feedback`,
      method:'post',
      data: { token:wx.getStorageSync('token'),formData},
      success(res){
        wx.navigateBack({delta: 1});
      }
    })
  }
})