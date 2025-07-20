Page({
  data: {
    merchants:[
      {
        companyName:"长沙好好信息科技有限公司1",
        typeName:"采购商"
      },
      {
        companyName:"长沙好好信息科技有限公司2",
        typeName:"采购商"
      },
      {
        companyName:"长沙好好信息科技有限公司3",
        typeName:"采购商"
      },
      {
        companyName:"长沙好好信息科技有限公司11",
        typeName:"采购商"
      },
      {
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
    ],
    filterMerchant:[],
    keyword:''
  },
  onLoad(){
    this.fetchContacts();
  },
  fetchContacts(){
    wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/company/myList`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
              const data = res.data.data || []; 
            console.log('data:',data);
            this.setData({
                filterMerchant:data
              })
          } else {
            // 请求失败，使用本地默认数据
            this.setData({
                filterMerchant:this.data.merchants
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
  inputMerchant(){
    if(this.data.keyword==''){
      this.setData({
        filterMerchant:this.data.merchants
      })
    } else {
      this.setData({
        filterMerchant:this.data.merchants.filter(item => item.name.includes(this.data.keyword))
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