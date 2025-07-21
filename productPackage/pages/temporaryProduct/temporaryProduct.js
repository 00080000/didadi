Page({
  data: {
    products: [],         // 存储临时商品列表
    filterProduct: [],    // 筛选后的商品列表
    keyword: '',          // 搜索关键字
    enterpriseId: 11,     // 企业ID
    isLoading: false,     // 加载状态
    searchTimer: null,    // 搜索防抖定时器
    errorMsg: ''          // 错误信息
  },

  // 页面加载时获取临时商品列表
  onLoad() {
    this.fetchTemporaryProducts();
  },

  // 获取临时商品列表（对接非标商品接口）
  fetchTemporaryProducts() {
    this.setData({ isLoading: true });

    const { enterpriseId, keyword } = this.data;
    // 构建请求参数
    const params = {
      enterpriseId: enterpriseId,
      ...(keyword && { productName: keyword })
    };

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/notStandardList`,
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
          this.setData({
            errorMsg: res.data?.msg || '获取临时商品失败',
            filterProduct: []
          });
        }
      },
      fail: () => {
        this.setData({
          errorMsg: '网络连接失败，请检查网络',
          filterProduct: []
        });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 实时输入搜索
  onInput(e) {
    const keyword = (e.detail.value || '').trim();
    
    clearTimeout(this.data.searchTimer);
    const timer = setTimeout(() => {
      this.setData({ keyword }, () => {
        if (keyword) {
          this.localSearch(keyword);
          this.fetchTemporaryProducts();
        } else {
          this.fetchTemporaryProducts();
        }
      });
    }, 300);

    this.setData({ searchTimer: timer });
  },

  // 本地搜索筛选
  localSearch(keyword) {
    const { products } = this.data;
    if (!products.length) return;

    const filtered = products.filter(item => {
      return item.productName && item.productName.includes(keyword);
    });

    this.setData({ filterProduct: filtered });
  },

  // 点击搜索按钮
  onSearch() {
    const { keyword } = this.data;
    keyword ? this.localSearch(keyword) : this.fetchTemporaryProducts();
  },

  // 查看商品详情
  goToViewProduct(e) {
    const productId = e.currentTarget.dataset.id;
    const productName = e.currentTarget.dataset.name;

    if (!productId) {
      wx.showToast({ title: '商品信息不存在', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/productPackage/pages/viewSingleProduct/viewSingleProduct?productId=${productId}&name=${encodeURIComponent(productName || '')}`,
    });
  },

  // 删除临时商品（对接DELETE /diServer/product/delTemplateItem/{itemId}接口）
  confirmDelete(e) {
    // 获取itemId和商品名称
    const itemId = e.currentTarget.dataset.itemId;
    const productName = e.currentTarget.dataset.name;

    // 校验itemId有效性
    if (!itemId || isNaN(itemId)) {
      wx.showToast({ title: '商品信息无效', icon: 'none' });
      return;
    }

    // 二次确认弹窗
    wx.showModal({
      title: '确认删除',
      content: `确定要删除临时商品【${productName || '未知商品'}】吗？`,
      success: (res) => {
        if (res.confirm) {
          // 调用删除接口
          wx.request({
            url: `${getApp().globalData.serverUrl}/diServer/product/delTemplateItem/${itemId}`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${getApp().globalData.token}`,
              'Content-Type': 'application/json'
            },
            success: (res) => {
              if (res.statusCode === 200) {
                // 接口返回成功
                if (res.data.code === 200) {
                  wx.showToast({ title: '删除成功', icon: 'success' });
                  this.fetchTemporaryProducts(); // 重新加载列表
                } else {
                  // 业务逻辑错误
                  wx.showToast({
                    title: res.data?.msg || '删除失败',
                    icon: 'none'
                  });
                }
              } else {
                // 网络状态码错误
                wx.showToast({
                  title: `请求失败（状态码：${res.statusCode}）`,
                  icon: 'none'
                });
              }
            },
            fail: () => {
              // 网络请求失败
              wx.showToast({ title: '网络连接失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 页面导航方法
  goToSingleProduct() {
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    });
  },
  goToCombinationProoduct() {
    wx.redirectTo({
      url: '/productPackage/pages/combinationProduct/combinationProduct',
    });
  },
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

  // 页面卸载清理定时器
  onUnload() {
    clearTimeout(this.data.searchTimer);
  }
});
    