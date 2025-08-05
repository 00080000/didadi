Page({
  data: {
    quotation: [],
    filterQuotation: [],
    ifShowSearch: false,
    keyword: '',
    isLoading: true,
    total: 0,
    pageNum: 1,
    pageSize: 9999,
    hasMore: false,
    requestParams: {
      pageNum: 1,
      pageSize: 9999,
          
      linkMan: "",
      linkTel: "",
      name: "",
      quoteDate: "",
      validityTime: ""
    }
  },

  onLoad() {
    const app = getApp();
    if (!app.globalData.serverUrl || !app.globalData.token) {
      this.setData({ isLoading: false });
      wx.showToast({ title: "配置错误，缺少服务器地址或token", icon: "none", duration: 3000 });
      return;
    }
    this.getInquiryList();
  },

  getInquiryList(isLoadMore = false) {
    this.setData({ isLoading: true });
    const app = getApp();

    wx.request({
      url: `${app.globalData.serverUrl}/diServer/inQuote/list`,
      method: "GET",
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        "accept": "*/*"
      },
      data: this.data.requestParams,
      success: (res) => {
        console.log("询价单列表接口响应：", res);

        if (res.statusCode !== 200) {
          this.handleLoadError(`接口请求失败（${res.statusCode}）`);
          return;
        }

        if (res.data.code === 200) {
          const newData = res.data.rows || [];
          this.setData({
            quotation: newData,
            filterQuotation: newData,
            total: res.data.total || 0,
            hasMore: false,
            isLoading: false
          });

          if (newData.length === 0) {
            wx.showToast({ title: "暂无询价单数据", icon: "none" });
          }
        } else {
          this.handleLoadError(res.data.msg || "数据加载失败（业务错误）");
        }
      },
      fail: (err) => {
        console.error("询价单列表请求失败：", err);
        this.handleLoadError("网络错误，无法连接服务器");
      }
    });
  },

  handleLoadError(msg) {
    this.setData({
      isLoading: false,
      quotation: [],
      filterQuotation: [],
      total: 0
    });
    wx.showToast({ title: msg, icon: "none", duration: 3000 });
  },

  inputQuotation() {
    const { keyword } = this.data;
    const searchKey = keyword.trim();
    this.setData({
      pageNum: 1,
      "requestParams.pageNum": 1,
      "requestParams.name": searchKey
    }, () => {
      this.getInquiryList();
    });
  },

  showSearch() {
    const needReset = this.data.ifShowSearch;
    this.setData({
      ifShowSearch: !this.data.ifShowSearch,
      keyword: ""
    });

    if (needReset) {
      this.setData({
        "requestParams.name": "",
        pageNum: 1,
        "requestParams.pageNum": 1
      }, () => {
        this.getInquiryList();
      });
    }
  },

  goToView(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      wx.showToast({ title: "缺少询价单ID", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: `/inquiryPackage/pages/viewInquiryTemplate/viewInquiryTemplate?id=${id}`
    });
  },

  edit(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      wx.showToast({ title: "缺少询价单ID", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: `/inquiryPackage/pages/addInquiry/addInquiry?id=${id}`
    });
  },

  copy(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({ title: "缺少询价单ID", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: `/inquiryPackage/pages/addInquiry/addInquiry?id=${id}&copyMode=1`
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

  confirmDelete(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      wx.showToast({ title: "缺少询价单ID", icon: "none" });
      return;
    }

    wx.showModal({
      title: "确认删除",
      content: "删除后不可恢复，是否继续？",
      success: (res) => {
        if (res.confirm) {
          this.setData({ isLoading: true }); 

          wx.request({
            url: `${getApp().globalData.serverUrl}/diServer/inQuote/${id}`,
            method: "DELETE", 
            header: {
              'Authorization': `Bearer ${getApp().globalData.token}`, 
              "accept": "*/*"
            },
            success: (res) => {
              this.setData({ isLoading: false }); 

              if (res.data.code === 200) {
                const newQuotation = this.data.quotation.filter(item => item.id !== id);
                const newFilterQuotation = this.data.filterQuotation.filter(item => item.id !== id);

                this.setData({
                  quotation: newQuotation,
                  filterQuotation: newFilterQuotation,
                  total: newQuotation.length 
                });

                wx.showToast({ title: "删除成功", icon: "none" });
              } else {
                wx.showToast({ title: res.data.msg || "删除失败", icon: "none" });
              }
            },
            fail: (err) => {
              this.setData({ isLoading: false });
              console.error("删除接口请求失败：", err);
              wx.showToast({ title: "网络错误，删除失败", icon: "none" });
            }
          });
        }
      }
    });
  },

  goToAddQuotation() {
    wx.navigateTo({
      url: "/inquiryPackage/pages/addInquiry/addInquiry"
    });
  },

  goToQuote() {
    wx.redirectTo({ url: "/quotePackage/pages/sendedQuotationForm/sendedQuotationForm" });
  },
  goToRecievedQuotation() {
    wx.redirectTo({ url: "/inquiryPackage/pages/recievedInquiryForm/recievedInquiryForm" });
  },
  navigateToMain() {
    wx.redirectTo({ url: "/mainPackage/pages/home/home" });
  },
  navigateToProduct() {
    wx.redirectTo({ url: "/productPackage/pages/singleProduct/singleProduct" });
  },
  navigateToMerchant() {
    wx.redirectTo({ url: "/merchantPackage/pages/merchants/merchants" });
  }
});