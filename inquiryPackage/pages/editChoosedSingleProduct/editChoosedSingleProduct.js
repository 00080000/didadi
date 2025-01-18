// quotePackage/pages/editChoosedSingleProduct/editChoosedSingleProduct.js
Page({
  data: {
    pickerValue: ['渠道价', '销售价', '代理价'],
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