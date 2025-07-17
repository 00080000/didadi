// productPackage/pages/singleProduct/singleProduct.js
Page({
  data: {
    products:[
      {
        name:'AAAAAAA1',
        type:'AAAAAA-BBBBBB-CCCCCC'
      },
      {
        name:'AAAAAAA2',
        type:'AAAAAA-BBBBBB-CCCCCC'
      },
      {
        name:'AAAAAAAA3',
        type:'AAAAAA-BBBBBB-CCCCCC'
      },
      {
        name:'AAAAAAAA11',
        type:'AAAAAA-BBBBBB-CCCCCC'
      },
      {
        name:'AAAAAAAA',
        type:'AAAAAA-BBBBBB-CCCCCC'
      },
      {
        name:'AAAAAAAA',
        type:'AAAAAA-BBBBBB-CCCCCC'
      },
      {
        name:'AAAAAAAA',
        type:'AAAAAA-BBBBBB-CCCCCC'
      },
      {
        name:'AAAAAAAA',
        type:'AAAAAA-BBBBBB-CCCCCC'
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
  goToCombinationProoduct(){
    wx.redirectTo({
      url: '/productPackage/pages/combinationProduct/combinationProduct',
    })
  },
  goToTemporaryProoduct(){
    wx.redirectTo({
      url: '/productPackage/pages/temporaryProduct/temporaryProduct',
    })
  },
  goToViewProduct(e){
    const index = e.currentTarget.dataset.index;
    const item = this.data.filterProduct[index];
    wx.navigateTo({
      url: `/productPackage/pages/viewSingleProduct/viewSingleProductname=${item.name}`,
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