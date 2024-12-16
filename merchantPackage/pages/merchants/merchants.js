Page({
  data: {
    merchants:[
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

  },
  navigateToProduct(){
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    })
  },
})