Page({
  data: {
   pickerValue: ['商家1', '商家2', '商家3'],
   index:null
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