Page({
  data: {
    products:[
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
    ]
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

  },
  navigateToMerchant(){
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    })
  },
})