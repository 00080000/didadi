Page({
  data: {
    products:[
      {
        name:'AAAAAAAA1',
        quotation:"20244041200369"
      },
      {
        name:'AAAAAAAA2',
        quotation:"20244041200369"
      },
      {
        name:'AAAAAAAA3',
        quotation:"20244041200369"
      },
      {
        name:'AAAAAAAA11',
        quotation:"20244041200369"
      },
      {
        name:'AAAAAAAA',
        quotation:"20244041200369"
      },
      {
        name:'AAAAAAAA',
        quotation:"20244041200369"
      },
      {
        name:'AAAAAAAA',
        quotation:"20244041200369"
      },
      {
        name:'AAAAAAAA',
        quotation:"20244041200369"
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
  goToSingleProduct(){
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    })
  },
  goToCombinationProoduct(){
    wx.redirectTo({
      url: '/productPackage/pages/combinationProduct/combinationProduct',
    })
  },
  goToViewProduct(){
    wx.navigateTo({
      url: '/productPackage/pages/viewSingleProduct/viewSingleProduct',
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