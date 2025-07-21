Page({
  data: {
    products: [],         // 存储接口返回的临时商品列表
    filterProduct: [],    // 筛选后的商品列表
    keyword: '',          // 搜索关键字
    enterpriseId: 11,     // 企业ID（接口必传参数）
    isLoading: false,     // 加载状态
    searchTimer: null,    // 搜索防抖定时器
    errorMsg: ''          // 错误信息（字符串类型）
  },

  // 页面加载时获取临时商品列表
  onLoad() {
    this.fetchTemporaryProducts(); // 调用接口获取数据（替代本地模拟数据）
  },

  // 调用接口：获取临时商品列表（对接 /notStandardList 接口）
  fetchTemporaryProducts() {
    // 显示加载状态
    this.setData({ isLoading: true });

    const { enterpriseId, keyword } = this.data;

    // 构建接口参数（根据文档，支持名称搜索和企业ID筛选）
    const params = {
      enterpriseId: enterpriseId, // 必传：企业ID
      ...(keyword && { productName: keyword }) // 可选：按名称搜索
    };

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/notStandardList`,
      method: 'GET',
      data: params,
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`, // 携带登录令牌
        'accept': '*/*'
      },
      success: (res) => {
        // 接口返回成功（状态码200且业务码200）
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            products: res.data.rows || [], // 存储原始数据
            filterProduct: res.data.rows || [], // 初始化筛选列表
            errorMsg: '' // 清空错误信息
          });
        } else {
          // 接口返回业务错误（如无权限、参数错误）
          this.setData({
            errorMsg: res.data.msg || '获取临时商品失败',
            products: [],
            filterProduct: []
          });
        }
      },
      fail: (err) => {
        // 网络请求失败（如断网、服务器未响应）
        this.setData({
          errorMsg: '网络连接失败，请检查网络',
          products: [],
          filterProduct: []
        });
        console.error('临时商品接口请求失败：', err);
      },
      complete: () => {
        // 无论成功失败，关闭加载状态
        this.setData({ isLoading: false });
      }
    });
  },

  // 实时输入监听（自动搜索）
  onInput(e) {
    const keyword = (e.detail.value || '').trim();

    // 防抖：300ms内连续输入不重复请求
    clearTimeout(this.data.searchTimer);
    const timer = setTimeout(() => {
      this.setData({ keyword }, () => {
        // 有关键字：先本地筛选（快速响应），再请求接口（确保最新）
        if (keyword) {
          this.localSearch(keyword);
          this.fetchTemporaryProducts();
        } else {
          // 无关键字：重新请求全部数据
          this.fetchTemporaryProducts();
        }
      });
    }, 300);

    this.setData({ searchTimer: timer });
  },

  // 本地搜索（基于已加载的数据快速筛选）
  localSearch(keyword) {
    const { products } = this.data;
    if (!products.length) return;

    // 按商品名称模糊匹配（与接口搜索逻辑一致）
    const filtered = products.filter(item => {
      return item.productName && item.productName.includes(keyword);
    });

    // 更新筛选列表（本地快速显示）
    this.setData({ filterProduct: filtered });
  },

  // 点击搜索按钮（手动触发搜索）
  onSearch() {
    const { keyword } = this.data;
    if (keyword) {
      this.localSearch(keyword);
      this.fetchTemporaryProducts();
    } else {
      this.fetchTemporaryProducts();
    }
  },

  // 查看商品详情
  goToViewProduct(e) {
    // 获取传递的商品ID（从按钮的data-product-id）
    const productId = e.currentTarget.dataset.productId;

    // 校验商品ID是否存在
    if (!productId) {
      wx.showToast({ title: '商品信息不存在', icon: 'none' });
      return;
    }

    // 跳转到详情页（携带商品ID）
    wx.navigateTo({
      url: `/productPackage/pages/viewSingleProduct/viewSingleProduct?productId=${productId}`,
    });
  },

  // 删除商品
  confirmDelete(e) {
    // 获取商品ID和索引
    const productId = e.currentTarget.dataset.productId;
    const index = e.currentTarget.dataset.index;
    const product = this.data.filterProduct[index];

    // 校验商品是否存在
    if (!productId || !product) {
      wx.showToast({ title: '商品信息无效', icon: 'none' });
      return;
    }

    // 二次确认删除
    wx.showModal({
      title: '确认删除',
      content: `确定要删除临时商品【${product.productName || '未知商品'}】吗？`,
      success: (res) => {
        if (res.confirm) {
          // 调用删除接口（假设删除接口为以下地址，需替换为实际接口）
          wx.request({
            url: `${getApp().globalData.serverUrl}/diServer/product/deleteTemporary`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${getApp().globalData.token}`,
              'Content-Type': 'application/json'
            },
            data: { id: productId }, // 传递商品ID
            success: (res) => {
              if (res.statusCode === 200 && res.data.code === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                // 删除后重新加载列表
                this.fetchTemporaryProducts();
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

  // 跳转到单商品库
  goToSingleProduct() {
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    });
  },

  // 跳转到组合商品库
  goToCombinationProoduct() {
    wx.redirectTo({
      url: '/productPackage/pages/combinationProduct/combinationProduct',
    });
  },

  // 跳转到首页
  navigateToMain() {
    wx.redirectTo({
      url: '/mainPackage/pages/home/home',
    });
  },

  // 跳转到询报价
  navigateToPrice() {
    wx.redirectTo({
      url: '/quotePackage/pages/sendedQuotationForm/sendedQuotationForm',
    });
  },

  // 跳转到商家页面
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