// quotePackage/pages/setFormStyle/setFormStyle.js
Page({
  data: {
    template:'默认模板',
    unit:['元','万元'],
    currency:['人民币'],
    unitIndex:0,
    currencyIndex:0
  },
  unitChange(e){
    this.setData({
      unitIndex:e.detail.value
    })
  },
  currencyChange(e){
    this.setData({
      currencyIndex:e.detail.value
    })
  },
  goToChooseTemplate(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseQuotationTemplate/chooseQuotationTemplate',
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  }
})