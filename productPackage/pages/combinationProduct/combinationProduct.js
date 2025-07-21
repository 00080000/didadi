// pages/combinationProduct/combinationProduct.js
Page({
  data: {
    products: [],         // 存储所有商品组合数据
    filterProduct: [],    // 存储筛选后的商品组合
    keyword: '',          // 当前搜索关键字
    companyEnterpriseId: 11, // 企业ID
    errorMsg: '',         // 错误信息（确保始终为字符串）
    searchTimer: null,    // 搜索防抖定时器
    isLoading: false,     // 加载状态
    // 补充筛选参数
    classId: '',          // 分类ID
    className: '',        // 分类名称
    code: '',             // 组合编码
    createBy: '',         // 创建人
    createTime: '',       // 创建时间
    status: '',           // 状态
    tag: '',              // 标签
    validityTime: ''      // 有效期
  },

  // 页面加载时获取商品组合列表
  onLoad() {
    this.fetchProductGroups();
  },

  // 获取商品组合列表
  fetchProductGroups() {
    this.setData({ isLoading: true });
    
    const { 
      companyEnterpriseId, 
      keyword, 
      classId, 
      className,
      code,
      createBy,
      createTime,
      status,
      tag,
      validityTime
    } = this.data;
    
    // 构建请求参数
    const params = {
      enterpriseId: companyEnterpriseId,
      name: keyword,          // 使用name字段进行模糊搜索
      classId,
      className,
      code,
      createBy,
      createTime,
      status,
      tag,
      validityTime
    };

    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/group/list`,
      method: 'GET',
      data: params,
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`,
        'accept': '*/*'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            products: res.data.rows || [],
            filterProduct: res.data.rows || [],
            errorMsg: ''
          });
        } else {
          // 确保errorMsg是字符串
          this.setData({
            errorMsg: res.data.msg || `接口错误：${res.statusCode}`,
            filterProduct: []
          });
        }
      },
      fail: (err) => {
        // 确保errorMsg是字符串
        this.setData({
          errorMsg: '网络请求失败，请检查网络连接',
          filterProduct: []
        });
        console.error('请求失败:', err);
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 实时监听输入（优化为实时模糊搜索）
  onInput(e) {
    const keyword = e.detail.value.trim();
    
    // 防抖处理：延迟300ms执行搜索，避免频繁请求
    clearTimeout(this.data.searchTimer);
    const timer = setTimeout(() => {
      this.setData({ keyword }, () => {
        // 有关键字时优先使用本地模糊搜索
        if (keyword) {
          this.localSearch(keyword);
        } else {
          // 无关键字时重新加载全部数据
          this.fetchProductGroups();
        }
      });
    }, 300);
    
    this.setData({ searchTimer: timer });
  },

  // 本地模糊搜索（提高响应速度）
  localSearch(keyword) {
    if (!this.data.products.length) return;
    
    const filtered = this.data.products.filter(item => {
      // 支持多字段模糊搜索
      return (
        (item.name && item.name.includes(keyword)) ||
        (item.code && item.code.includes(keyword)) ||
        (item.tag && item.tag.includes(keyword))
      );
    });
    
    this.setData({ filterProduct: filtered });
  },

  // 点击搜索按钮（保留原功能，与实时搜索互补）
  onSearch() {
    const { keyword } = this.data;
    
    if (!keyword) {
      // 无关键字时重新加载全部数据
      this.fetchProductGroups();
      return;
    }
    
    // 有关键字时，优先使用本地搜索（快速响应）
    this.localSearch(keyword);
    
    // 同时异步请求服务器数据（确保数据最新）
    this.fetchProductGroups();
  },

  // 删除商品组合
  confirmDelete(e) {
    const index = e.currentTarget.dataset.index;
    const group = this.data.filterProduct[index];

    if (!group || !group.id) {
      wx.showToast({ title: '商品组合信息无效', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除商品组合【${group.name || group.code}】吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${getApp().globalData.serverUrl}/diServer/product/group/delete`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${getApp().globalData.token}`,
              'Content-Type': 'application/json'
            },
            data: {
              id: group.id
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.code === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                this.fetchProductGroups(); // 删除后重新拉取列表
              } else {
                wx.showToast({ 
                  title: res.data.msg || '删除失败', 
                  icon: 'none' 
                });
              }
            },
            fail: () => {
              wx.showToast({ title: '网络请求失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 查看商品组合详情
  goToViewProduct(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.filterProduct[index];
    
    if (!item) {
      wx.showToast({ title: '商品组合信息不存在', icon: 'none' });
      return;
    }

    // 传递完整商品组合ID，方便详情页获取完整信息
    wx.navigateTo({
      url: `/productPackage/pages/viewCombinationProduct/viewCombinationProduct?groupId=${item.id}&name=${encodeURIComponent(item.name || '')}`,
    });
  },

  // 跳转到单商品库
  goToSingleProoduct() {
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    });
  },

  // 跳转到临时商品库
  goToTemporaryProoduct() {
    wx.redirectTo({
      url: '/productPackage/pages/temporaryProduct/temporaryProduct',
    });
  },

  // 底部导航跳转
  navigateToMain() {
    wx.redirectTo({
      url: '/mainPackage/pages/home/home',
    });
  },

  navigateToPrice() {
    wx.redirectTo({
      url: '/quotePackage/pages/sendedQuotationForm/sendedQuotationForm',
    });
  },

  navigateToMerchant() {
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    });
  },

  // 页面卸载时清理定时器
  onUnload() {
    clearTimeout(this.data.searchTimer);
  }
});