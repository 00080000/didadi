Page({
  data: {
    merchants:[
      {
        id:"12",
        companyName:"长沙好好信息科技有限公司1",
        typeName:"采购商"
      },
      {
        id:"17",
        companyName:"长沙好好信息科技有限公司2",
        typeName:"采购商"
      },
      {
        id:"16",
        companyName:"长沙好好信息科技有限公司3",
        typeName:"采购商"
      },
      {
        id:"15",
        companyName:"长沙好好信息科技有限公司11",
        typeName:"采购商"
      },
      {
        id:"14",
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        id:"13",
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        id:"11",
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        id:"122",
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        id:"1",
        companyName:"长沙好好信息科技有限公司",
        typeName:"采购商"
      },
      {
        id:"2",
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
  //数据更新
  fetchContacts(){
    wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/company/list?pageNum=1&pageSize=10`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
              const data = res.data.rows || []; 
            console.log('data:',data);
            this.setData({
                filterMerchant:data,
                merchants:data
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
  //搜索
  inputMerchant(){
    if(this.data.keyword==''){
      this.setData({
        filterMerchant:this.data.merchants
      })
    } else {
      this.setData({
        filterMerchant:this.data.merchants.filter(item => item.companyName.includes(this.data.keyword))
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
                      url: `${getApp().globalData.serverUrl}/diServer/company/${id}`,
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
  goToContacts(){
    wx.redirectTo({
      url: '/merchantPackage/pages/contacts/contacts',
    })
  },
  goToEditMerchant(e){
    const item = e.currentTarget.dataset.item || '';
  wx.navigateTo({
    url: `/merchantPackage/pages/editInformation/editInformation`,
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