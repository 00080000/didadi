// quotePackage/pages/editFileInformation/editFileInformation.js
Page({
  data: {
    
      fileName:'小喇叭公司报价单（初稿）',
      projectName:'系统集成扩容二期采购项目',
      date:'2023-12-23',
      validity:'7天',
      description:'',
    index:0
  },
  onLoad(){
    const app = getApp();
    const submitData = app.globalData.submitData;
    this.setData({
        fileName : submitData.quote.name || '',
        projectName : submitData.quote.projectName || '',
        date : submitData.quote.quoteDate || '',
        validity : submitData.quote.validityTime || '',
        description : submitData.quote.description || '',
    });
  },
  selectorChange(e){
    this.setData({
      index: e.detail.value
    })
  },
  dateChange(e) {
    this.setData({
        date: e.detail.value
    })
  },
  dateChangeV(e) {
    this.setData({
        validity: e.detail.value
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    const app = getApp();
    const quote = app.globalData.submitData.quote;
    quote.name = this.data.fileName;
    quote.projectName = this.data.projectName;
    quote.quoteDate = this.data.date;
    quote.validityTime = this.data.validity;
    quote.description = this.data.description;
    app.globalData.submitData.quote = quote;
    wx.navigateBack()
  }
})