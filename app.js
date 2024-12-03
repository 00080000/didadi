// app.js
App({
  onLaunch: function () {
    // 检查用户是否已经登录
    if (!this.globalData.authenticated) {
      // 如果未登录，重定向到登录页面
      wx.redirectTo({
        url: '/pages/login/login'
      });
    }
  },
  globalData: {
    userInfo: null,
    authenticated:false
  }
})
