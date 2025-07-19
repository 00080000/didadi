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
  onLoad() {
    this.fetchKPI();
    this.fetchNewMsg();
  },

  fetchKPI() {
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/index/queryKPI?enterpriseId=11`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
          console.log('fetchKPI:statusCode:',res.statusCode,' code:',res.data.code);
        if (res.statusCode === 200 && res.data.code === 200) {
          // 请求成功，更新数据
          const data = res.data.data || {};
          this.setData({
            quotationQuantity: data.quoteCount || 0,
            inquiryQuantity: data.inquiryCount || 0,
            purchaserQuantity: data.buyerCount || 0,
            supplierQuantity: data.sellerCount || 0,
            singleGoodsSKU: data.productCount || 0,
            combinationGoodsSKU: data.productGroupCount || 0,
            quotationAmount: data.quoteTotalPirce || 0
          });
          console.log('KPI：',res.data.data);
        } else {
          // 请求失败，使用本地默认数据
          this.setData({ 
            errorMsg: res.data.message || '获取数据失败，使用默认数据',
          });
          console.log('errorMsg');
        }
      },
      fail: (err) => {
        // 请求失败，使用本地默认数据
        this.setData({ 
          errorMsg: '网络请求失败，使用默认数据',
        });
        console.error(err);
      },
    });
  },
  fetchNewMsg() {
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/system/notice/myMsgList`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
            const data = res.data.data || []; 
            const hasNewMessage = data.length > 0; // 判断是否有新消息
            this.setData({
              ifHaveNewMessage: hasNewMessage
          });
          console.log('NewMessage:',res.data.data);
        } else {
          // 请求失败，使用本地默认数据
          this.setData({ 
            errorMsg: res.data.message || '获取数据失败，使用默认数据',
          });
          console.log('errorMsg');
        }
      },
      fail: (err) => {
        // 请求失败，使用本地默认数据
        this.setData({ 
          errorMsg: '网络请求失败，使用默认数据',
        });
        console.error(err);
      },
    });
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