// mainPackage/pages/home/home.js
Page({
  data: {
    name:"用户",
    phone:11111111111,
    firm:'长沙颂融信息科技有限公司',
    ifHaveNewMessage:true,
    quotationAmount:670.10,
    quotationQuantity:45,
    inquiryQuantity:12,
    purchaserQuantity:24,
    supplierQuantity:5,
    singleGoodsSKU:135,
    combinationGoodsSKU:36,
    ifShow:false
  },
  goToSystemManage(){
    wx.navigateTo({
      url: '/mainPackage/pages/systemManage/systemManage',
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
  navigateToMerchant(){
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    })
  },
  setIfShow(){
    this.setData({
      ifShow:!this.data.ifShow
    })
  },
  goToAddQuotation(){
    wx.navigateTo({
      url: '/quotePackage/pages/addQuotation/addQuotation',
    })
  },
  goToAddInquiry(){
    
  },
  goToAddMerchant(){
    wx.navigateTo({
      url: '/merchantPackage/pages/editInformation/editInformation',
    })
  },
  goToAddContact(){
    wx.navigateTo({
      url: '/merchantPackage/pages/addContact/addContact',
    })
  },
})