Page({
  data: {
    quotation: [],        // 原始询价单数据（接口返回）
    filterQuotation: [],  // 过滤后的询价单（用于显示）
    ifShowSearch: false,  // 搜索框显示状态
    keyword: '',          // 搜索关键词
    loading: false,       // 加载状态
    enterpriseId: ''      // 企业ID（从全局获取）
  },

  onLoad() {
    // 1. 获取全局配置（企业ID、token等）
    const app = getApp();
    this.setData({
      enterpriseId: app.globalData.enterpriseId || ''
    });

    // 2. 加载询价单数据
    this.getInquiryList();
  },

  /**
   * 核心：调用接口获取询价单列表
   */
  getInquiryList() {
    // 显示加载状态
    this.setData({ loading: true });

    const app = getApp();
    const serverUrl = app.globalData.serverUrl;
    const token = app.globalData.token;

    // 构建请求参数（根据接口文档，类型type=2表示询价单）
    const params = {
      type: 2,  // 固定值：2=询价单
      enterpriseId: this.data.enterpriseId,  // 企业ID（必填）
      // 可添加其他筛选参数（如创建时间、创建人等）
    };

    // 发起请求
    wx.request({
      url: `${serverUrl}/diServer/inQuote/outQuote/list`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: params,
      success: (res) => {
        this.setData({ loading: false });

        // 接口成功返回
        if (res.data.code === 200) {
          // 格式化数据（适配页面显示）
          console.log('收到的：',res.data.rows);
          const formattedList = (res.data.rows || []).map(item => ({
            id: item.quoteId,  // 询价单ID（用于预览、删除）
            quoteName: item.quoteName,  // 询价单名称
            createTime: item.createTime,  // 创建时间
            ID: item.id
            // 可补充其他需要的字段（如创建人、状态等）
          }));
          console.log('formattedList:',formattedList)
          this.setData({
            quotation: formattedList,
            filterQuotation: formattedList  // 初始显示全部
          });
        } else {
          // 接口返回错误
          wx.showToast({
            title: `获取失败：${res.data.msg || '未知错误'}`,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        this.setData({ loading: false });
        wx.showToast({ title: '网络错误，获取失败', icon: 'none' });
        console.error('询价单列表请求失败：', err);
      }
    });
  },

  /**
   * 搜索功能（按询价单名称筛选）
   */
  inputQuotation(e) {
    const keyword = this.data.keyword.trim();
    if (!keyword) {
      // 无关键词时显示全部
      this.setData({ filterQuotation: this.data.quotation });
      return;
    }

    // 按名称模糊搜索
    const filtered = this.data.quotation.filter(item => {
      return item.quoteName && item.quoteName.includes(keyword);
    });
    this.setData({ filterQuotation: filtered });
  },

  /**
   * 切换搜索框显示状态
   */
  showSearch() {
    this.setData({
      ifShowSearch: !this.data.ifShowSearch,
      keyword: '',  // 清空搜索词
      filterQuotation: this.data.quotation  // 恢复显示全部
    });
  },

  // 删除确认
  confirmDelete(e){
    const id = e.currentTarget.dataset.id;
    if(id != '') {
      wx.showModal({
        title: '确认',
        content: '确定要删除吗？',
        success (res) {
          if (res.confirm) {
            wx.request({
              url: `${getApp().globalData.serverUrl}/diServer/quote/outQuote/${id}`,
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
                  wx.showToast({
                    title: res.data.message || '删除失败',
                    icon: 'none'
                  });
                }
              },
              fail: (err) => {
                wx.showToast({
                  title: '网络请求失败',
                  icon: 'none'
                });
                console.error(err);
              },
            });
          }
        }
      });
    } else {
      wx.showToast({
        title: '未知错误',
        icon: 'none',
        duration: 1500
      });
    }
  },

  /**
   * 删除询价单（示例：需对接实际删除接口）
   */
  deleteInquiry(id) {
    const app = getApp();
    wx.request({
      url: `${app.globalData.serverUrl}/diServer/inQuote/outQuote/delete`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: { id },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '删除成功' });
          // 重新加载列表
          this.getInquiryList();
        } else {
          wx.showToast({ title: res.data.msg || '删除失败', icon: 'none' });
        }
      }
    });
  },

  /**
   * 预览询价单（携带ID跳转）
   */
  goToViewRecievedQuotation(e) {
    const id = e.currentTarget.dataset.id;  // 获取询价单ID
    wx.navigateTo({
      url: `/inquiryPackage/pages/viewInquiryTemplate/viewInquiryTemplate?id=${id}`,
    });
  },
  share(e) {
    const id = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['系统内发送', '生成二维码', '复制链接', '发送邮件', '分享至微信'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0: 
            wx.navigateTo({ url: `/quotePackage/pages/shareWithSystem/shareWithSystem?id=${id}` });
            break;
          case 1: 
            wx.navigateTo({ url: `/quotePackage/pages/shareWithCode/shareWithCode?id=${id}` });
            break;
          case 2: 
            wx.showToast({ title: '复制成功', icon: 'none' });
            break;
          case 3: 
            wx.navigateTo({ url: `/quotePackage/pages/shareWithEmail/shareWithEmail?id=${id}` });
            break;
          case 4: 
            wx.updateShareMenu({
              withShareTicket: true,
              success: () => {
                wx.showToast({
                  title: '请点击右上角“···”分享到微信',
                  icon: 'none',
                  duration: 3000
                });
              },
              fail: (err) => {
                wx.showToast({ title: err.errMsg + '，请稍后重试', icon: 'none' });
              }
            });
            break;
        }
      },
      fail: (err) => {
        wx.showToast({ title: err.errMsg + '，请稍后重试', icon: 'none' });
      }
    });
  },

  goToQuote() {
    wx.redirectTo({
      url: '/quotePackage/pages/sendedQuotationForm/sendedQuotationForm',
    });
  },
  goToSendedQuotation() {
    wx.redirectTo({
      url: '/inquiryPackage/pages/sendedInquiryForm/sendedInquiryForm',
    });
  },
  goToAddQuotation() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/addInquiry/addInquiry',
    });
  },
  navigateToMain() {
    wx.redirectTo({
      url: '/mainPackage/pages/home/home',
    });
  },
  navigateToMerchant() {
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    });
  },
  navigateToProduct() {
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    });
  }
});