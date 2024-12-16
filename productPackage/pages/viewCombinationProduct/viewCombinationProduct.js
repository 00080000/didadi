
Page({
  data: {
    product:{
      name:'组合商品AAAAAA',
      number:'20240412596650',
      tag:'集成组合',
      remark:'备注',
      status:'上架',
      time:'2024-12-13',
      list:[{},{},{}],
      image:'/static/trumpet.png'
    }
  },
  goToViewSingleProduct(){
    wx.navigateTo({
      url: '/productPackage/pages/viewSingleProductInCombination/viewSingleProductInCombination',
    })
  }
})