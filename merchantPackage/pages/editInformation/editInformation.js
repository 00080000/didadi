Page({
  data: {
   pickerValue: ['采购方', '供应商', '两者皆是'],
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