// quotePackage/pages/shareWithSystem/shareWithSystem.js
Page({
  data: {
    firm:'',
    contactPickerValue: [],
    contactIndex:null,
    id:'',
    quotation:[]
  },
  onLoad(options){
    console.log(options.id);
    this.setData({
      id: options.id
    });
    this.loadQuotationData();
  },
  contactPickerChange(e){
    this.setData({
      contactIndex: e.detail.value
    })
  },
  loadQuotationData() {
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/quote/${this.data.id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const viewData = res.data.data || {};
          console.log('viewData:', viewData);
          this.setData({
            item: viewData.quote || {} 
          });
          
        } else {
          // 请求失败
          this.setData({
            errorMsg: res.data.message || '获取数据失败'
          });
        }
      },
      fail: (err) => {
        console.error(err);
      }
    });
  },

  chooseMerchant(){
    wx.navigateTo({
      url: '/quotePackage/pages/chooseMerchant/chooseMerchant',
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  }
})