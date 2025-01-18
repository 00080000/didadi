// quotePackage/pages/editFileInformation/editFileInformation.js
Page({
  data: {
    file:{
      fileName:'小喇叭公司报价单（初稿）',
      projectName:'系统集成扩容二期采购项目',
      date:'2023-12-23',
      validity:'7天',
      description:''
    },
    pickerValue:['7天','14天','1个月','3个月','6个月','1年'],
    index:0
  },
  selectorChange(e){
    this.setData({
      index: e.detail.value
    })
  },
  dateChange(e) {
    this.setData({
      file:{
        date: e.detail.value
      }
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  }
})