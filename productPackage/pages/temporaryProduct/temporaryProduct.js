Page({
  data: {
    products: [],         // 原始商品列表（用于本地筛选）
    filterProduct: [],    // 筛选后的商品列表（用于页面展示）
    keyword: '',          // 搜索关键字
    enterpriseId: 11,     // 企业ID（固定值，可根据实际需求调整）
    isLoading: false,     // 加载状态标记
    searchTimer: null,    // 搜索防抖定时器
    errorMsg: ''          // 错误提示信息
  },

  // 页面加载时初始化数据
  onLoad() {
    // 加载临时商品列表
    this.fetchTemporaryProducts();
  },

  // 页面显示时重新加载数据（确保数据最新）
  onShow() {
    if (this.data.products.length === 0) {
      this.fetchTemporaryProducts();
    }
  },

  // 获取临时商品列表（对接接口）
  fetchTemporaryProducts() {
    // 显示加载状态
    this.setData({
      isLoading: true,
      errorMsg: ''
    });

    const { enterpriseId, keyword } = this.data;
    // 构建请求参数（企业ID必传，关键字可选）
    const params = {
      enterpriseId
    };
    if (keyword) {
      params.productName = keyword; // 按商品名称搜索
    }

    // 调用接口获取数据
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/notStandardList`, // 临时商品接口地址
      method: 'GET',
      data: params,
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`, // 携带登录令牌
        'accept': '*/*'
      },
      success: (res) => {
        // 接口请求成功（状态码200）
        if (res.statusCode === 200) {
          // 业务逻辑成功（code=200）
          if (res.data.code === 200) {
            const productList = res.data.rows || []; // 接口返回的商品数组
            this.setData({
              products: productList,       // 存储原始数据
              filterProduct: productList   // 初始化展示列表
            });
          } else {
            // 业务逻辑失败（如无权限）
            this.setData({
              errorMsg: res.data.msg || '获取商品失败',
              filterProduct: []
            });
          }
        } else {
          // 接口请求失败（如404、500）
          this.setData({
            errorMsg: `请求失败（状态码：${res.statusCode}）`,
            filterProduct: []
          });
        }
      },
      fail: () => {
        // 网络请求失败（如断网）
        this.setData({
          errorMsg: '网络连接失败，请检查网络',
          filterProduct: []
        });
      },
      complete: () => {
        // 无论成功失败，关闭加载状态
        this.setData({ isLoading: false });
      }
    });
  },

  // 实时输入搜索（防抖处理）
  onInput(e) {
    const keyword = (e.detail.value || '').trim(); // 获取输入值并去空格

    // 清除之前的定时器（防抖：避免输入过程中频繁触发搜索）
    clearTimeout(this.data.searchTimer);

    // 300ms后执行搜索（输入停止后再搜索）
    const timer = setTimeout(() => {
      this.setData({ keyword }, () => {
        // 如果有关键字，先本地筛选；无关键字则重新请求接口（获取完整列表）
        if (keyword) {
          this.localSearch(keyword);
        } else {
          this.fetchTemporaryProducts();
        }
      });
    }, 300);

    // 存储定时器（用于后续清除）
    this.setData({ searchTimer: timer });
  },

  // 点击搜索按钮触发搜索
  onSearch() {
    const { keyword } = this.data;
    if (keyword) {
      this.localSearch(keyword); // 本地筛选
    } else {
      this.fetchTemporaryProducts(); // 无关键字时重新请求完整列表
    }
  },

  // 本地搜索筛选（基于已加载的原始数据）
  localSearch(keyword) {
    const { products } = this.data;
    if (!products.length) return; // 无数据时直接返回

    // 筛选出商品名称包含关键字的商品（不区分大小写）
    const filtered = products.filter(item => {
      if (!item.productName) return false;
      return item.productName.toLowerCase().includes(keyword.toLowerCase());
    });

    // 更新展示列表
    this.setData({ filterProduct: filtered });
  },

  // 显示删除确认弹窗
  showDeleteConfirm(e) {
    // 获取商品ID和名称（从页面元素的data属性中获取）
    const productId = e.currentTarget.dataset.itemId;
    const productName = e.currentTarget.dataset.name || '未知商品';

    // 校验商品ID有效性
    if (!productId || isNaN(productId)) {
      wx.showToast({
        title: '商品信息无效',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 二次确认弹窗（防止误操作）
    wx.showModal({
      title: '确认删除',
      content: `确定要删除临时商品“${productName}”吗？`,
      confirmColor: '#ff4d4f', // 确认按钮红色（突出警告）
      success: (res) => {
        if (res.confirm) {
          // 用户点击“确定”，调用删除接口
          this.deleteProduct(productId);
        }
      }
    });
  },

  // 调用删除接口（DELETE /diServer/product/{ids}）
  deleteProduct(productId) {
    // 显示加载中（防止重复操作）
    wx.showLoading({
      title: '删除中...',
      mask: true // 蒙版阻止背景操作
    });

    // 调用删除接口
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/${productId}`, // 接口路径：ids为商品ID
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        // 接口请求成功（状态码200或204）
        if ([200, 204].includes(res.statusCode)) {
          // 业务逻辑成功（code=200）
          if (res.data?.code === 200 || res.statusCode === 204) {
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 1500
            });
            // 删除后重新加载列表（刷新页面数据）
            this.fetchTemporaryProducts();
          } else {
            // 业务逻辑失败（如商品已被引用）
            wx.showToast({
              title: res.data?.msg || '删除失败',
              icon: 'none',
              duration: 2000
            });
          }
        } else {
          // 接口请求失败（如401未登录、403禁止访问）
          wx.showToast({
            title: `删除失败（${res.statusCode}）`,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: () => {
        // 网络请求失败（如断网）
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
      },
      complete: () => {
        // 无论成功失败，关闭加载状态
        wx.hideLoading();
      }
    });
  },

  // 跳转到单商品详情页
  goToViewProduct(e) {
    const productId = e.currentTarget.dataset.id;
    const productName = e.currentTarget.dataset.name || '';

    // 校验商品ID
    if (!productId) {
      wx.showToast({
        title: '商品ID不存在',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 跳转页面并携带参数（商品ID和名称）
    wx.navigateTo({
      url: `/productPackage/pages/viewSingleProduct/viewSingleProduct?productId=${productId}&name=${encodeURIComponent(productName)}`
    });
  },

  // 跳转到“单商品库”页面
  goToSingleProduct() {
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct'
    });
  },

  // 跳转到“组合商品库”页面
  goToCombinationProoduct() {
    wx.redirectTo({
      url: '/productPackage/pages/combinationProduct/combinationProduct'
    });
  },

  // 底部导航：跳转到首页
  navigateToMain() {
    wx.redirectTo({
      url: '/mainPackage/pages/home/home'
    });
  },

  // 底部导航：跳转到询报价页面
  navigateToPrice() {
    wx.redirectTo({
      url: '/quotePackage/pages/sendedQuotationForm/sendedQuotationForm'
    });
  },

  // 底部导航：跳转到商家页面
  navigateToMerchant() {
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants'
    });
  },

  // 页面卸载时清除定时器（防止内存泄漏）
  onUnload() {
    clearTimeout(this.data.searchTimer);
  }
});