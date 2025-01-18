Page({
  data: {
    products:[
      {
        name:'AAAAAAAA1',
      },
      {
        name:'AAAAAAAA2',
      },
      {
        name:'AAAAAAAA3',
      },
      {
        name:'AAAAAAAA11',
      },
      {
        name:'AAAAAAAA',
      },
      {
        name:'AAAAAAAA',
      },
      {
        name:'AAAAAAAA',
      },
      {
        name:'AAAAAAAA',
      },
    ],
    filterProduct:[],
    keyword:''
  },
  onLoad(){
    this.setData({
      filterProduct:this.data.products
    })
  },
  inputProduct(){
    if(this.data.keyword==''){
      this.setData({
        filterProduct:this.data.products
      })
    } else {
      this.setData({
        filterProduct:this.data.products.filter(item => item.name.includes(this.data.keyword))
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
  goToSingleProoduct(){
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    })
  },
  goToTemporaryProoduct(){
    wx.redirectTo({
      url: '/productPackage/pages/temporaryProduct/temporaryProduct',
    })
  },
  goToViewProduct(){
    wx.navigateTo({
      url: '/productPackage/pages/viewCombinationProduct/viewCombinationProduct',
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
  navigateToMerchant(){
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    })
  },
})