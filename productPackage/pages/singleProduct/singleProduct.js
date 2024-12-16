// productPackage/pages/singleProduct/singleProduct.js
Page({
  data: {
    products:[
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