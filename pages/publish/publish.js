const app = getApp();
const Upyun = require('../../utils/upyun-sdk.js');
const upyun = new Upyun({
  bucket: 'wxphotos',
  operator: 'root',
  getSignatureUrl: `${app.host}/getSignature`
});
Page({
  data: {
    edit:false,
    formData:{
      title:'',
      desc:'',
      photos:[]
    }
  },
  onLoad (option) {
    const self = this;
    if (option.id){
      wx.request({
        url: `${app.host}/photo/api/gallery/modify/${option.id}`,
        success(res){
          self.setData({
            edit : true,
            formData : {
              _id: res.data.detail['_id'],
              title: res.data.detail.title,
              desc: res.data.detail.desc,
              photos: res.data.detail.photos
            }
          })
        }
      })
    }
  },
  titleInput(e){
    this.setData({
      'formData.title' : e.detail.value
    });
  },
  descInput(e){
    this.setData({
      'formData.desc': e.detail.value
    });
  },
  //添加图片
  selectPhoto(e){
    const self = this;
    wx.chooseImage({
      count: (9 - self.data.formData.photos.length),
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePaths = res.tempFilePaths;
        tempFilePaths.forEach((item,index)=>{
          upyun.upload({
            localPath: item,
            remotePath: '/{year}/{mon}/{day}/upload_{random32}{.suffix}',
            success: function (res) {
              console.log(res);
              self.setData({
                'formData.photos': self.data.formData.photos.concat('http://img.fairy-domain.com'+JSON.parse(res.data).url)
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
  //删除图片
  remove(e) {
    var photos = this.data.formData.photos.slice();
    photos.splice(e.currentTarget.dataset.id, 1);
    this.setData({
      'formData.photos': photos
    })
  },
  //提交表单
  formSubmit(e){
    const formData = this.data.formData;
    if (!formData.title || formData.photos.length < 3){
      wx.showModal({
        content: '标题不能为空！照片不能少于3张',
        showCancel:false,
      })
    }else{
      const sendData = this.data.edit ? { formData } : { formData, token: wx.getStorageSync('token')};
      wx.request({
        url: `${app.host}/photo/api/gallery/publish`,
        method:'post',
        data: sendData,
        success(res){
          console.log(res);
          wx.navigateBack({delta: 1});
        }
      })
    }
  }
})