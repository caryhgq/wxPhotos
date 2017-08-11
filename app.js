const host = 'https://www.xxxx.com/';
App({
  onShow() {
    const self = this;
    wx.checkSession({
      success() {
        wx.getUserInfo({
          success: function (res) {
            if ((self.userInfo.nickName !== res.userInfo.nickName) || (self.userInfo.avatarUrl !== res.userInfo.avatarUrl)) {
              wx.clearStorageSync();
              self.login();
            }
          }
        })
      },
      fail() {
        wx.clearStorageSync();
        self.login();
      }
    })
  },
  getUserInfo(code, cb) {
    const self = this;
    wx.getUserInfo({
      success(res) {
        wx.request({
          url: `${host}/photo/api/login`,
          method: 'post',
          data: {
            code: code,
            userinfo: res.userInfo
          },
          success(data) {
            wx.setStorageSync('token', data.data.token);
            self.userInfo = data.data.userInfo;
            cb && cb();
            wx.hideLoading();
          },
          fail(res) {
            console.log(res);
          }
        });
      },
      fail(res) {
        console.log(res);
      }
    })
  },
  login(cb) {
    const self = this;
    wx.showLoading({ title: '登录中' });
    if (wx.getStorageSync('token')) {
      wx.request({
        url: `${host}/photo/api/login`,
        method: 'post',
        data: {
          token: wx.getStorageSync('token')
        },
        success(res) {
          self.userInfo = res.data.userInfo;
          wx.hideLoading();
        },
        fail(res) {
          console.log(res)
        }
      });
    } else {
      wx.login({
        success(res) {
          res.code && self.getUserInfo(res.code, cb);
        },
        fail(res) {
          console.log('WeChat登录失败');
        }
      })
    }
  },
  host,
  userInfo: {}
})
