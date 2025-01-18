// merchantPackage/pages/contacts/contacts.js
Page({
  data: {
    contacts:[
      {
        name:"黄老板1",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
      {
        name:"黄老板2",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
      {
        name:"黄老板11",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
      {
        name:"黄老板3",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
      {
        name:"黄老板",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
      {
        name:"黄老板",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
      {
        name:"黄老板",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
      {
        name:"黄老板",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
      {
        name:"黄老板",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
      {
        name:"黄老板",
        phone:"13900009999",
        firm:"长沙好好信息科技有限公司"
      },
    ],
    filterContact:[],
    contactKeyword:''
  },
  onLoad(){
    this.setData({
      filterContact:this.data.contacts
    })
  },
  inputContact(){
    if(this.data.contactKeyword==''){
      this.setData({
        filterContact:this.data.contacts
      })
    } else {
      this.setData({
        filterContact:this.data.contacts.filter(item => item.name.includes(this.data.contactKeyword))
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
  goToMerchant(){
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    })
  },
  goToEditMerchant(){
    wx.navigateTo({
      url: '/merchantPackage/pages/editInformation/editInformation',
    })
  },
  goToAddContact(){
    wx.navigateTo({
      url: '/merchantPackage/pages/addContact/addContact',
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
  navigateToProduct(){
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    })
  },
})