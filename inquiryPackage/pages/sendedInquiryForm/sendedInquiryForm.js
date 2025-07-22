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
    // 分页相关（新增）
    pageNum: 1,        // 当前页码（默认第1页）
    pageSize: 10,      // 每页条数（默认10条，与接口一致）
    hasMore: true,     // 是否还有更多数据（用于加载更多）
    // 接口请求参数（适配后端：包含分页+业务参数）
    requestParams: {
      // 分页参数（必传，新增）
      pageNum: 1,
      pageSize: 10,
      // 用真实用户信息填充（从登录态获取）
      userId: 18, 
      templateId: 36,
      // 文本参数填空，不做筛选（业务参数）
      linkMan: "",
      linkTel: "",
      name: "",
      // 时间参数用大范围，覆盖所有数据（业务参数）
      quoteDate: "",
      validityTime: "",
      // 类型固定为2（询价单，业务参数）
      type: 2
    }
  },

  onLoad() {
    // 页面加载时请求第一页数据
    this.getInquiryList();
  },

  // 监听页面滚动到底部（新增：加载更多数据）
  onReachBottom() {
    // 如果正在加载，或没有更多数据，不触发请求
    if (this.data.isLoading || !this.data.hasMore) return;
    // 页码+1，请求下一页
    this.setData({
      pageNum: this.data.pageNum + 1,
      "requestParams.pageNum": this.data.pageNum + 1
    }, () => {
      this.getInquiryList(true); // 传入true表示加载更多
    });
  },

  // 请求询价单列表（适配分页：支持首次加载和加载更多）
  getInquiryList(isLoadMore = false) {
    this.setData({ isLoading: true });

    wx.request({
      url:  `${getApp().globalData.serverUrl}/diServer/inQuote/list`,
      method: "GET",
      header: {
        // 注意：Bearer前缀需要添加（与接口请求头一致）
        'Authorization': `Bearer ${getApp().globalData.token}`,
        "accept": "*/*"
      },
      data: this.data.requestParams, // 包含分页参数和业务参数
      success: (res) => {
        if (res.data.code === 200) {
          const newData = res.data.rows || [];
          // 判断是否还有更多数据（当前页码*每页条数 < 总条数）
          const hasMore = this.data.pageNum * this.data.pageSize < res.data.total;

          this.setData({
            // 如果是加载更多，拼接数据；否则覆盖数据
            quotation: isLoadMore ? [...this.data.quotation, ...newData] : newData,
            // 筛选列表同步更新
            filterQuotation: isLoadMore ? [...this.data.quotation, ...newData] : newData,
            total: res.data.total, // 总条数
            hasMore: hasMore,     // 更新是否有更多数据
            isLoading: false
          });
        } else {
          wx.showToast({
            title: "数据加载失败",
            icon: "none"
          });
          this.setData({ isLoading: false });
        }
      },
      fail: () => {
        wx.showToast({
          title: "网络错误，请重试",
          icon: "none"
        });
        this.setData({ isLoading: false });
      }
    });
  },

  // 搜索功能（重置分页，重新请求第一页）
  inputQuotation() {
    const { keyword } = this.data;
    // 重置页码为1，重新请求
    this.setData({
      pageNum: 1,
      "requestParams.pageNum": 1,
      // 如果有搜索词，通过name参数传给后端（减少前端筛选压力）
      "requestParams.name": keyword.trim() || ""
    }, () => {
      // 调用接口重新获取数据（后端直接返回筛选结果）
      this.getInquiryList();
    });
  },

  // 切换搜索框显示/隐藏（重置搜索状态）
  showSearch() {
    this.setData({
      ifShowSearch: !this.data.ifShowSearch,
      keyword: "", 
      // 重置搜索参数，显示全部数据
      "requestParams.name": "",
      pageNum: 1,
      "requestParams.pageNum": 1
    }, () => {
      // 重新请求第一页数据
      this.getInquiryList();
    });
  },

  // 预览询价单（携带ID跳转）
  goToView(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/inquiryPackage/pages/viewInquiry/viewInquiry?id=${id}`
    });
  },

  // 编辑询价单
  edit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/inquiryPackage/pages/addInquiry/addInquiry?id=${id}`
    });
  },

  // 复制询价单
  copy(e) {
    const { id } = e.currentTarget.dataset;
    wx.showToast({ title: "询价单已复制", icon: "none" });
  },

  // 分享询价单
  share(e) {
    const { id } = e.currentTarget.dataset;
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

  // 删除确认
  confirmDelete(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: "确认删除",
      content: "删除后不可恢复，是否继续？",
      success: (res) => {
        if (res.confirm) {
          // 模拟删除（实际需调用删除接口）
          const newList = this.data.quotation.filter(item => item.id !== id);
          this.setData({
            quotation: newList,
            filterQuotation: newList,
            total: newList.length
          });
          wx.showToast({ title: "删除成功", icon: "none" });
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