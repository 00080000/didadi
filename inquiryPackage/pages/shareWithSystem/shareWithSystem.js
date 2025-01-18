// quotePackage/pages/shareWithSystem/shareWithSystem.js
Page({
  data: {
    fileName:'小喇叭公司询价单',
    total:23,
    time:'2024.07.08',
    contactPickerValue: ['联系人1', '联系人2', '联系人3'],
    contactIndex:null
  },
  contactPickerChange(e){
    this.setData({
      contactIndex: e.detail.value
    })
  },
  chooseMerchant(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseMerchant/chooseMerchant',
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  }
})