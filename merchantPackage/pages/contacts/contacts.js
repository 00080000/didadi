// merchantPackage/pages/contacts/contacts.js
Page({
  data: {
    contacts:[
      {
        userName:"黄老板1",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
      {
        userName:"黄老板2",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
      {
        userName:"黄老板11",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
      {
        userName:"黄老板3",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
      {
        userName:"黄老板",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
      {
        userName:"黄老板",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
      {
        userName:"黄老板",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
      {
        userName:"黄老板",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
      {
        userName:"黄老板",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
      {
        userName:"黄老板",
        tel:"13900009999",
        companyName:"长沙好好信息科技有限公司"
      },
    ],
    filterContact:[],
    contactKeyword:''
  },
  onLoad(){
    this.fetchContacts();
  },
  fetchContacts(){
    wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/companyLinkman/list`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
              const data = res.data.rows || []; 
            console.log('data:',data);
            this.setData({
                filterContact:data,
                contacts:data
              })
          } else {
            // 请求失败，使用本地默认数据
            this.setData({
                filterContact:this.data.contacts
              })
            console.log('errorMsg');
          }
        },
        fail: (err) => {
          this.setData({ 
            errorMsg: '网络请求失败，使用默认数据',
          });
          console.error(err);
        },
      });
  },
  inputContact(){
    if(this.data.contactKeyword==''){
      this.setData({
        filterContact:this.data.contacts
      })
    } else {
      this.setData({
        filterContact:this.data.contacts.filter(item => item.companyName.includes(this.data.contactKeyword))
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
  goToAddContact(e){
    const id = e.currentTarget.dataset.id || 0;
    wx.navigateTo({
      url: `/merchantPackage/pages/addContact/addContact?id=${id}`,
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