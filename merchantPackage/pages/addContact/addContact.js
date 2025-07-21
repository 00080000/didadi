Page({
  data: {
   pickerValue: ['商家1', '商家2', '商家3'],
   index:null
  },
  onLoad(options) {
    const Id = options.id; // 获取传递的id
    console.log('联系人ID:', Id);
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