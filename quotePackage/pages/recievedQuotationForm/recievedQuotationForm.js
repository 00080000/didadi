Page({
  data: {
    quotation:[
      {
        name:'报价单2024040319008882',
        date:'2024.04.13',
        time:'20:09:45',
      },
      {
        name:'报价单2024040319008881',
        date:'2024.04.13',
        time:'20:09:45',
      },
      {
        name:'报价单20240403190088811',
        date:'2024.04.13',
        time:'20:09:45',
      },
      {
        name:'报价单2024040319008883',
        date:'2024.04.13',
        time:'20:09:45',
      },       
      {
        name:'报价单2024040319008885',
        date:'2024.04.13',
        time:'20:09:45',
      }
    ],
    filterQuotation:[],
    ifShowSearch:false,
    keyword:''
  },
  onLoad(){
    this.loadQuotationData();
    this.setData({
      filterQuotation:this.data.quotation
    })
  },
  loadQuotationData() {
    
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/quote/outQuote/list?pageSize=9999&pageNum=1`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const quotation = res.data.rows || [];
          console.log('QuotationData:',quotation);
          this.setData({
            quotation,
            filterQuotation: quotation
          });
        } else {
          // 请求失败，使用本地静态数据
          this.setData({ 
            errorMsg: res.data.message || '获取数据失败，使用本地数据',
            quotation: this.data.staticQuotation,
            filterQuotation: this.data.staticQuotation
          });
        }
      },
      fail: (err) => {
        // 请求失败，使用本地静态数据
        this.setData({ 
          errorMsg: '网络请求失败，使用本地数据',
          quotation: this.data.staticQuotation,
          filterQuotation: this.data.staticQuotation
        });
        console.error(err);
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },
  inputQuotation(){
    if(this.data.keyword==''){
      this.setData({
        filterQuotation:this.data.quotation
      })
    } else {
      this.setData({
        filterQuotation:this.data.quotation.filter(item => item.name.includes(this.data.keyword))
      })
    }
  },
  showSearch(){
    this.setData({
      ifShowSearch:!this.data.ifShowSearch,
      filterQuotation:this.data.quotation,
      keyword:''
    })
  },
    // 删除确认
    confirmDelete(e){
        const id = e.currentTarget.dataset.id;
        if(id != '')
        {
            wx.showModal({
                title: '确认',
                content: '确定要删除吗？',
                success (res) {
                    if (res.confirm) {
                      wx.request({
                          url: `${getApp().globalData.serverUrl}/diServer/quote/${id}`,
                          method: 'DELETE',
                          header: {
                            'Authorization': `Bearer ${getApp().globalData.token}`
                          },
                          success: (res) => {
                              console.log(res);
                            if (res.statusCode === 200 && res.data.code === 200) {
                                // 刷新当前页面数据
                                setTimeout(() => {
                                const currentPage = getCurrentPages()[getCurrentPages().length - 1];
                                currentPage.onLoad();
                                }, 500);
                            } else {
                              // 请求失败
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
  goToInquiry(){
    wx.redirectTo({
      url: '/inquiryPackage/pages/sendedInquiryForm/sendedInquiryForm',
    })
  },
  goToViewRecievedQuotation(e){
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation?id=${id}`,
    })
  },
  goToSendedQuotation(){
    wx.redirectTo({
      url: '/quotePackage/pages/sendedQuotationForm/sendedQuotationForm',
    })
  },
  goToAddQuotation(){
    wx.navigateTo({
      url: '/quotePackage/pages/addQuotation/addQuotation',
    })
  },
  navigateToMain(){
    wx.redirectTo({
      url: '/mainPackage/pages/home/home',
    })
  },
  navigateToMerchant(){
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    })
  },
  navigateToProduct(){
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    })
  },
})