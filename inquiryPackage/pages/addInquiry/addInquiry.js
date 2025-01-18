// quotePackage/pages/addQuotation/addQuotation.js
Page({
  data: {
    fileName:'小喇叭公司询价单',
    project:'系统集成扩容二期采购项目',
    time:'2024-07-08',
    merchant:{
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
  onShow(){
    this.setData({
      totalAmount:this.getTotalAmount()
    })
  },
  getTotalAmount(){
    let total=0;
    for(let i=0;i<this.data.product.length;i++){
      total+=this.data.product[i].amount;
    }
    return total;
  },
  goToEditFileInformation(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/editFileInformation/editFileInformation',
    })
  },
  goToChooseMerchant(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseMerchant/chooseMerchant',
    })
  },
  goToChooseProduct(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseProduct/chooseProduct',
    })
  },
  goToAddAttachment(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/uploadAttachment/uploadAttachment',
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  }
})