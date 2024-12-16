Page({
  data: {
    products:[
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

  },
  navigateToMerchant(){
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    })
  },
})