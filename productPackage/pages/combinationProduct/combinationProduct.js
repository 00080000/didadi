Page({
  data: {
    productGroups: [],    // 存储商品组原始数据
    filterProduct: [],    // 筛选后的商品组
    keyword: '',          // 搜索关键字
    enterpriseId: 11,     // 企业ID
    isLoading: false,     // 加载状态
    searchTimer: null,    // 搜索防抖定时器
    errorMsg: ''          // 错误信息
  },

  // 页面加载时获取商品组列表
  onLoad() {
    this.fetchProductGroups();
  },

  // 获取商品组列表（核心接口）
  fetchProductGroups() {
    this.setData({ isLoading: true });

    const { enterpriseId, keyword } = this.data;
    const params = {
      enterpriseId: enterpriseId,
      ...(keyword && { name: keyword })
    };

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/group/list`,
      method: 'GET',
      data: params,
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          // 检查返回数据中是否包含id字段
          const groups = res.data.rows || [];
          groups.forEach((item, index) => {
            if (!item.id) {
              console.warn(`第${index+1}个商品组缺少id字段`);
            }
          });
          
          this.setData({
            productGroups: groups,
            filterProduct: groups,
            errorMsg: ''
          });
        } else {
          this.setData({
            errorMsg: res.data?.msg || '获取商品组失败',
            filterProduct: []
          });
        }
      },
      fail: () => {
        this.setData({
          errorMsg: '网络连接失败',
          filterProduct: []
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 实时搜索（输入即搜索）
  onInput(e) {
    const keyword = (e.detail.value || '').trim();
    clearTimeout(this.data.searchTimer);
    const timer = setTimeout(() => {
      this.setData({ keyword }, () => {
        if (keyword) {
          this.localSearch(keyword);
          this.fetchProductGroups();
        } else {
          this.fetchProductGroups();
        }
      });
    }, 300);

    this.setData({ searchTimer: timer });
  },

  // 本地搜索（快速响应）
  localSearch(keyword) {
    const { productGroups } = this.data;
    if (!productGroups.length) return;

    const filtered = productGroups.filter(item => {
      return item.name && item.name.includes(keyword);
    });

    this.setData({ filterProduct: filtered });
  },

  // 点击搜索按钮
  onSearch() {
    const { keyword } = this.data;
    keyword ? this.localSearch(keyword) : this.fetchProductGroups();
  },

  // 查看商品组详情（修复版）
  goToViewProduct(e) {
    // 1. 打印参数日志，方便调试
    console.log('查看按钮点击，参数：', e.currentTarget.dataset);
    
    // 2. 获取参数
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name || '';

    // 3. 增强参数校验
    if (!id && id !== 0) { // 处理0的特殊情况（如果ID可能为0）
      wx.showToast({ 
        title: '商品组ID不存在', 
        icon: 'none',
        duration: 2000 
      });
      return;
    }

    // 4. 构建跳转路径（确保路径正确）
    const url = `/productPackage/pages/viewCombinationProduct/viewCombinationProduct?groupId=${id}&name=${encodeURIComponent(name)}`;
    console.log('准备跳转路径：', url);

    // 5. 尝试跳转并处理可能的错误
    wx.navigateTo({
      url: url,
      fail: (err) => {
        // 捕获跳转失败错误
        console.error('跳转失败：', err);
        wx.showToast({ 
          title: '跳转失败，请检查页面是否存在', 
          icon: 'none',
          duration: 2000 
        });
      }
    });
  },

  // 删除商品组
  confirmDelete(e) {
    const groupId = e.currentTarget.dataset.id;
    const groupName = e.currentTarget.dataset.name;

    if (!groupId) {
      wx.showToast({ title: '商品组信息无效', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除商品组【${groupName || '未知组名'}】吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${getApp().globalData.serverUrl}/diServer/product/group/${groupId}`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${getApp().globalData.token}`,
              'Content-Type': 'application/json'
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.code === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                this.fetchProductGroups();
              } else {
                wx.showToast({
                  title: res.data?.msg || '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: () => {
              wx.showToast({ title: '网络连接失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 页面导航方法
  goToSingleProoduct() {
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct'
    });
  },
  goToTemporaryProoduct() {
    wx.redirectTo({
      url: '/productPackage/pages/temporaryProduct/temporaryProduct'
    });
  },
  navigateToMain() {
    wx.redirectTo({ url: '/mainPackage/pages/home/home' });
  },
  navigateToPrice() {
    wx.redirectTo({ url: '/quotePackage/pages/sendedQuotationForm/sendedQuotationForm' });
  },
  navigateToMerchant() {
    wx.redirectTo({ url: '/merchantPackage/pages/merchants/merchants' });
  },

  // 页面卸载清理定时器
  onUnload() {
    clearTimeout(this.data.searchTimer);
  }
});
  