// quotePackage/pages/addQuotation/addQuotation.js
Page({
  data: {
    fileName:'小喇叭公司报价单',
    project:'系统集成扩容二期采购项目',
    time:'2024-07-08',
    item:{
      firm:'长沙好好信息科技有限公司',
      name:'黄老板',
      phone:'13900009999'
    },
    product:[{
      name:'1',
      amount:2,
      price:234.51
    },
    {
      name:'2',
      amount:2,
      price:234.51
    },
    {
      name:'3',
      amount:2,
      price:234.51
    },
    {
      name:'4',
      amount:2,
      price:234.51
    }],
    attachment:['1'],
  },
  onLoad(options){
      console.log('id:',options.id);
      this.setData({
        id: options.id
      });
      this.loadQuotationData();
  },
  onShow(){
    const app = getApp();
    if (app.globalData && app.globalData.submitData) {
      const submitData = app.globalData.submitData;
      this.setData({
        submitData: submitData,
        item: submitData.quote || this.data.item, 
        attachment: submitData.quoteFileList || this.data.attachment 
      });
    }
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
              submitData: viewData,
            item: viewData.quote || {}, // 修正数据层级，从quote字段获取主数据
            attachment: viewData.quoteFileList || []
          });
          const app = getApp();
          app.globalData.submitData = this.data.submitData;
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
  getTotalAmount(){
    let total=0;
    for(let i=0;i<this.data.product.length;i++){
      total+=this.data.product[i].price*this.data.product[i].amount;
    }
    return total;
  },
  goToEditFileInformation(){
    wx.navigateTo({
      url: '/quotePackage/pages/editFileInformation/editFileInformation',
    })
  },
  goToChooseMerchant(){
    wx.navigateTo({
      url: '/quotePackage/pages/chooseMerchant/chooseMerchant',
    })
  },
  goToChooseProduct(){
    wx.navigateTo({
      url: '/quotePackage/pages/chooseProduct/chooseProduct',
    })
  },
  goToAddAttachment(){
    wx.navigateTo({
      url: '/quotePackage/pages/uploadAttachment/uploadAttachment',
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
      console.log('submitData:',this.data.submitData);
    wx.navigateBack()
  }
})