// mainPackage/pages/personalInformation/personalInformation.js
Page({
  data: {
    name:"用户",
    phone:11111111111,
    email:null,
    sex:0
  },
  setMale(){
    this.setData({
      sex:1
    })
  },
  setFemale(){
    this.setData({
      sex:0
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  }
})