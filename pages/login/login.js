Page({
  // 微信授权登录
  loginWithWechat(){
    // 业务逻辑
    const app = getApp();
    app.globalData.userInfo = {};
    app.globalData.authenticated = true;
    wx.redirectTo({
      url:'/mainPackage/pages/home/home'
    })
  },
  // 跳转至短信验证码登录界面
  loginWithPhone(){
    wx.navigateTo({
      url: '/pages/phone-login/phone-login',
    })
  },
  // 跳转至密码登录界面
  loginWithPassword(){
    wx.navigateTo({
      url: '/pages/password-login/password-login',
    })
  }
})

