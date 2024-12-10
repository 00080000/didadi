// mainPackage/pages/systemManage/systemManage.js
Page({
  data: {
    name:"用户",
    phone:11111111111,
    newMessageAmount:3
  },
  goToPersonalInformation(){
    wx.navigateTo({
      url: '/mainPackage/pages/personalInformation/personalInformation',
    })
  },
  goToEdiFirmInformation(){
    wx.navigateTo({
      url: '/mainPackage/pages/editFirmInformation/editFirmInformation',
    })
  },
  goToEditPassword(){
    wx.navigateTo({
      url: '/mainPackage/pages/editPassword/editPassword',
    })
  },
  goToMessage(){
    wx.navigateTo({
      url: '/mainPackage/pages/message/message',
    })
  },
  exit(){
    const app = getApp();
    app.globalData.userInfo = null;
    app.globalData.authenticated = false;
    wx.redirectTo({
      url: '/pages/login/login',
    })
  }
})