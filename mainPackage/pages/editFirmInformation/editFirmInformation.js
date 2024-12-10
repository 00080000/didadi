// mainPackage/pages/editFirmInformation/editFirmInformation.js
Page({
  data: {
   pickerValue: ['小规模纳税人', '一般纳税人', '个体工商户', '不涉及'],
   index:0
  },
  pickerChange(e){
    this.setData({
      index: e.detail.value
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  }
})