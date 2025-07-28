Page({
  data: {
    // 原始数据（后端返回的rows）
    quotation: [],
    // 筛选后的列表（用于搜索）
    filterQuotation: [],
    // 搜索相关
    ifShowSearch: false,
    keyword: '',
    // 加载状态
    isLoading: true,
    // 总条数（后端返回的total）
    total: 0,
    // 分页相关（因pageSize=9999，实际为一次性加载，简化分页逻辑）
    pageNum: 1,
    pageSize: 9999,
    hasMore: false, // 因一次性加载，默认无更多数据
    // 接口请求参数
    requestParams: {
      pageNum: 1,
      pageSize: 9999,
      userId: 18,
      templateId: 36,
      linkMan: "",
      linkTel: "",
      name: "",
      quoteDate: "",
      validityTime: "",
      type: 2
    }
  },

  onLoad() {
    // 检查全局配置是否存在（避免serverUrl/token未定义）
    const app = getApp();
    if (!app.globalData.serverUrl || !app.globalData.token) {
      this.setData({
        isLoading: false
      });
      wx.showToast({
        title: "配置错误，缺少服务器地址或token",
        icon: "none",
        duration: 3000
      });
      return;
    }
    // 加载数据
    this.getInquiryList();
  },

  // 移除冗余的onReachBottom（因pageSize=9999，无需加载更多）
  onReachBottom() {
    // 因一次性加载所有数据，无需处理加载更多
    return;
  },

  // 请求询价单列表（优化错误处理和日志）
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
        // 打印接口响应（方便调试）
        console.log("询价单列表接口响应：", res);

        // 处理接口返回（兼容不同格式的错误码）
        if (res.statusCode !== 200) {
          // HTTP状态码非200（如404、500）
          this.handleLoadError(`接口请求失败（${res.statusCode}）`);
          return;
        }

        if (res.data.code === 200) {
          const newData = res.data.rows || [];
          this.setData({
            quotation: newData, // 因一次性加载，无需拼接
            filterQuotation: newData,
            total: res.data.total || 0,
            hasMore: false, // 一次性加载后无更多数据
            isLoading: false
          });

          // 空数据提示
          if (newData.length === 0) {
            wx.showToast({
              title: "暂无询价单数据",
              icon: "none"
            });
          }
        } else {
          // 接口返回业务错误（如code≠200）
          this.handleLoadError(res.data.msg || "数据加载失败（业务错误）");
        }
      },
      fail: (err) => {
        // 请求失败（如网络错误、跨域）
        console.error("询价单列表请求失败：", err);
        this.handleLoadError("网络错误，无法连接服务器");
      }
    });
  },

  // 统一处理加载错误
  handleLoadError(msg) {
    this.setData({
      isLoading: false,
      quotation: [],
      filterQuotation: [],
      total: 0
    });
    wx.showToast({
      title: msg,
      icon: "none",
      duration: 3000
    });
  },

  // 搜索功能（优化参数传递）
  inputQuotation() {
    const { keyword } = this.data;
    // 去空格处理，避免空字符串搜索
    const searchKey = keyword.trim();
    this.setData({
      pageNum: 1,
      "requestParams.pageNum": 1,
      "requestParams.name": searchKey
    }, () => {
      this.getInquiryList();
    });
  },

  // 切换搜索框显示/隐藏（优化重置逻辑）
  showSearch() {
    // 如果当前已显示搜索框，隐藏时才重置搜索
    const needReset = this.data.ifShowSearch;
    this.setData({
      ifShowSearch: !this.data.ifShowSearch,
      keyword: ""
    });

    // 仅在隐藏搜索框时，重置参数并重新加载
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

  // 预览询价单（增加参数校验）
  goToView(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      wx.showToast({
        title: "缺少询价单ID",
        icon: "none"
      });
      return;
    }
    wx.navigateTo({
      url: `/inquiryPackage/pages/viewInquiryTemplate/viewInquiryTemplate?id=${id}`
    });
  },

  // 编辑询价单（增加参数校验）
  edit(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      wx.showToast({
        title: "缺少询价单ID",
        icon: "none"
      });
      return;
    }
    wx.navigateTo({
      url: `/inquiryPackage/pages/addInquiry/addInquiry?id=${id}`
    });
  },

  // 复制询价单（提示需对接接口）
  copy(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      wx.showToast({
        title: "缺少询价单ID",
        icon: "none"
      });
      return;
    }
    // 实际项目中需调用复制接口，此处仅提示
    wx.showToast({
      title: "询价单已复制（模拟）",
      icon: "none"
    });
  },

  // 分享询价单（增加参数校验）
  share(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      wx.showToast({
        title: "缺少询价单ID",
        icon: "none"
      });
      return;
    }
    wx.showActionSheet({
      itemList: ["系统内发送", "生成二维码", "复制链接", "发送邮件"],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            wx.navigateTo({ url: `/pages/shareSystem/shareSystem?id=${id}` });
            break;
          case 1:
            wx.navigateTo({ url: `/pages/shareQrCode/shareQrCode?id=${id}` });
            break;
          case 2:
            wx.setClipboardData({
              data: `https://app.didadi.vip/inquiry/${id}`,
              success: () => wx.showToast({ title: "链接已复制", icon: "none" })
            });
            break;
          case 3:
            wx.navigateTo({ url: `/pages/shareEmail/shareEmail?id=${id}` });
            break;
        }
      }
    });
  },

 // 删除确认（对接真实删除接口）
confirmDelete(e) {
  const { id } = e.currentTarget.dataset;
  // 1. 校验ID是否存在
  if (!id) {
    wx.showToast({
      title: "缺少询价单ID",
      icon: "none"
    });
    return;
  }

  // 2. 显示确认弹窗
  wx.showModal({
    title: "确认删除",
    content: "删除后不可恢复，是否继续？",
    success: (res) => {
      if (res.confirm) {
        // 3. 调用删除接口
        this.setData({ isLoading: true }); // 显示加载状态

        wx.request({
          url: `${getApp().globalData.serverUrl}/diServer/inQuote/${id}`, // 接口地址拼接ID
          method: "DELETE", // 请求方法为DELETE
          header: {
            'Authorization': `Bearer ${getApp().globalData.token}`, // 携带token
            "accept": "*/*"
          },
          success: (res) => {
            this.setData({ isLoading: false }); // 关闭加载状态

            // 4. 处理接口响应
            if (res.data.code === 200) {
              // 4.1 接口删除成功：更新本地列表（移除删除的项）
              const newQuotation = this.data.quotation.filter(item => item.id !== id);
              const newFilterQuotation = this.data.filterQuotation.filter(item => item.id !== id);

              this.setData({
                quotation: newQuotation,
                filterQuotation: newFilterQuotation,
                total: newQuotation.length // 更新总条数
              });

              // 提示成功
              wx.showToast({
                title: "删除成功",
                icon: "none"
              });
            } else {
              // 4.2 接口返回业务错误（如无权限、ID不存在）
              wx.showToast({
                title: res.data.msg || "删除失败",
                icon: "none"
              });
            }
          },
          fail: (err) => {
            // 5. 请求失败（如网络错误）
            this.setData({ isLoading: false });
            console.error("删除接口请求失败：", err);
            wx.showToast({
              title: "网络错误，删除失败",
              icon: "none"
            });
          }
        });
      }
    }
  });
},

  // 新建询价单
  goToAddQuotation() {
    wx.navigateTo({
      url: "/inquiryPackage/pages/addInquiry/addInquiry"
    });
  },

  // 导航相关方法（保持不变）
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