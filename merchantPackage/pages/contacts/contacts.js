// merchantPackage/pages/contacts/contacts.js
Page({
  data: {
    contacts:[
      {
        id: "88",
        userName:"黄老板1",
        tel:"13900009999",
        companyName:"测试A",
        companyId: "178",
        email: "2322353434@qq.com"
      },
      {
        id: "88",
        userName:"黄老板2",
        tel:"13900009999",
        companyName:"测试A",
        companyId: "178",
        email: "2322353434@qq.com"
      },
      {
        id: "88",
        userName:"黄老板11",
        tel:"13900009999",
        companyName:"测试A",
        companyId: "178",
        email: "2322353434@qq.com"
      },
    ],
    filterContact:[],
    contactKeyword:''
  },
  onLoad(){
    this.fetchContacts();
  },
  onShow() {
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
        filterContact:this.data.contacts.filter(item => item.userName.includes(this.data.contactKeyword))
      })
    }
  },
  confirmDelete(e){
    const id = e.currentTarget.dataset.id || '';
    if(id != '')
    {
        wx.showModal({
            title: '确认',
            content: '确定要删除吗？',
            success (res) {
                if (res.confirm) {
                  wx.request({
                      url: `${getApp().globalData.serverUrl}/diServer/companyLinkman/removeLinkman/${id}`,
                      method: 'DELETE',
                      header: {
                        'Authorization': `Bearer ${getApp().globalData.token}`
                      },
                      success: (res) => {
                        if (res.statusCode === 200 && res.data.code === 200) {
                            // 刷新当前页面数据
                            setTimeout(() => {
                            const currentPage = getCurrentPages()[getCurrentPages().length - 1];
                            currentPage.onLoad();
                            }, 500);
                        } else {
                          // 请求失败，使用本地默认数据
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
                } else if (res.cancel) {
                    console.log('用户点击取消')
                }
            }
        });
    }
    else{
        wx.showToast({
            title: '未知错误',
            icon: 'none',
            duration: 2000
          });
    }

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
    const item = e.currentTarget.dataset.item || '';
    wx.navigateTo({
      url: `/merchantPackage/pages/addContact/addContact`,
      events: {},
      success: function(res) {
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: item })
      }
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