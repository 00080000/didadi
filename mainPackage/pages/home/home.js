// mainPackage/pages/home/home.js
Page({
  data: {
    nickName:"用户",
    phonenumber:11111111111,
    firm:'长沙颂融信息科技有限公司',
    enterpriseId:'',
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
      this.fetchInfo();
      this.fetchNewMsg();
  },
  onShow(){
    this.fetchInfo();
    this.fetchNewMsg();
  },
  fetchInfo() {
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/getInfo`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        console.log('Info:', res);
        if (res.statusCode === 200 && res.data.code === 200) {
          const userInfo = res.data.user || {}; 
          this.setData({
            nickName: userInfo.nickName || '',
            phonenumber: userInfo.phonenumber || '',
            firm: userInfo.enterprise.name || ''
          });
          const userToStore = {
            createBy: userInfo.createBy || '',
            createTime: userInfo.createTime || '',
            updateBy: userInfo.updateBy || null,
            updateTime: userInfo.updateTime || null,
            remark: userInfo.remark || '',
            params: userInfo.params || {},
            userId: userInfo.userId || '',
            deptId: userInfo.deptId || null,
            enterpriseId: userInfo.enterpriseId || '',
            userName: userInfo.userName || '',
            nickName: userInfo.nickName || '',
            userType: userInfo.userType || '',
            email: userInfo.email || '',
            phonenumber: userInfo.phonenumber || '',
            sex: userInfo.sex || '',
            avatar: userInfo.avatar || '',
            password: userInfo.password || null, 
            status: userInfo.status || '',
            delFlag: userInfo.delFlag || '',
            loginIp: userInfo.loginIp || '',
            loginDate: userInfo.loginDate || '',
            dept: userInfo.dept || null,
            roles: userInfo.roles || [], 
            roleIds: userInfo.roleIds || null,
            postIds: userInfo.postIds || null,
            roleId: userInfo.roleId || null,
            keyword: userInfo.keyword || '',
            enterprise: userInfo.enterprise || {}, 
            admin: userInfo.admin || false
          };
          const app = getApp();
          app.globalData.userInfo = userToStore;
          this.fetchKPI();
        } else {
          this.setData({ 
            errorMsg: res.data.message || '获取数据失败',
          });
          console.log('errorMsg:', this.data.errorMsg);
        }
      },
      fail: (err) => {
        this.setData({ 
          errorMsg: '网络请求失败',
        });
        console.error(err);
      },
    });
  },
  fetchKPI() {
    const app = getApp();
    this.data.enterpriseId = app.globalData.userInfo.enterpriseId ;
    console.log('enterpriseId:',this.data.enterpriseId)
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/index/queryKPI?enterpriseId=${getApp().globalData.userInfo.enterpriseId}`,
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
            errorMsg: res.data.message || '获取数据失败',
          });
          console.log('errorMsg');
        }
      },
      fail: (err) => {
        // 请求失败，使用本地默认数据
        this.setData({ 
          errorMsg: '网络请求失败',
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
    wx.navigateTo({
      url: '/inquiryPackage/pages/addInquiry/addInquiry',
    })
  },
  goToAddMerchant(){
    wx.navigateTo({
      url: '/merchantPackage/pages/editInformation/editInformation?id=0',
    })
  },
  goToAddContact(){
    wx.navigateTo({
      url: '/merchantPackage/pages/addContact/addContact?id=0',
    })
  },
})