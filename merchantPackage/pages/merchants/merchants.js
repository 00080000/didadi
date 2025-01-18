Page({
  data: {
    merchants:[
      {
        name:"长沙好好信息科技有限公司1",
        type:"采购商"
      },
      {
        name:"长沙好好信息科技有限公司2",
        type:"采购商"
      },
      {
        name:"长沙好好信息科技有限公司3",
        type:"采购商"
      },
      {
        name:"长沙好好信息科技有限公司11",
        type:"采购商"
      },
      {
        name:"长沙好好信息科技有限公司",
        type:"采购商"
      },
      {
        name:"长沙好好信息科技有限公司",
        type:"采购商"
      },
      {
        name:"长沙好好信息科技有限公司",
        type:"采购商"
      },
      {
        name:"长沙好好信息科技有限公司",
        type:"采购商"
      },
      {
        name:"长沙好好信息科技有限公司",
        type:"采购商"
      },
      {
        name:"长沙好好信息科技有限公司",
        type:"采购商"
      },
    ],
    filterMerchant:[],
    keyword:''
  },
  onLoad(){
    this.setData({
      filterMerchant:this.data.merchants
    })
  },
  inputMerchant(){
    if(this.data.keyword==''){
      this.setData({
        filterMerchant:this.data.merchants
      })
    } else {
      this.setData({
        filterMerchant:this.data.merchants.filter(item => item.name.includes(this.data.keyword))
      })
    }
  },
  confirmDelete(){
    wx.showModal({
      title: '确认',
      content: '确定要删除吗？',
      success (res) {
          if (res.confirm) {
              console.log('用户点击确定')
          } else if (res.cancel) {
              console.log('用户点击取消')
          }
      }
  });
  },
  goToContacts(){
    wx.redirectTo({
      url: '/merchantPackage/pages/contacts/contacts',
    })
  },
  goToEditMerchant(){
    wx.navigateTo({
      url: '/merchantPackage/pages/editInformation/editInformation',
    })
  },
  navigateToMain(){
    wx.redirectTo({
      url: '/mainPackage/pages/home/home',
    })
  },
  navigateToPrice(){
    wx.redirectTo({
      url: '/quotePackage/pages/sendedQuotationForm/sendedQuotationForm',
    })
  },
  navigateToProduct(){
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    })
  },
})