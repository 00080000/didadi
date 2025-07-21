Page({
  data: {
    products: [],       // 存储商品列表（原始数据）
    filterProduct: [],  // 存储筛选后的商品列表
    keyword: '',        // 搜索关键字
    companyEnterpriseId: 11, // 企业ID
    tableHeaders: [],   // 表头数据
    errorMsg: '',       // 错误信息提示（确保为字符串）
    isLoading: false,   // 加载状态
    searchTimer: null,  // 防抖定时器
    filterTimer: null,  // 筛选防抖定时器
    // 补充筛选参数
    brand: '',          // 品牌筛选
    classId: '',        // 类别ID筛选
    className: '',      // 类别名称筛选
    status: '',         // 商品状态筛选
    // 价格分类相关条件
    priceCategoryType: '',
    priceCategoryPriceName: '',
    priceCategoryFormula: '',
    priceCategoryValidityTime: ''
  },

  // 页面加载时调用
  onLoad() {
    this.fetchTableHeaders();  // 获取表头数据
    this.fetchProducts();      // 获取商品列表
  },

  // 获取表头数据
  fetchTableHeaders() {
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/getTableTitleList`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`,
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            tableHeaders: res.data.data || []
          });
        } else {
          // 确保错误信息为字符串（修复[Object object]问题）
          this.setData({
            errorMsg: res.data?.message || '获取表头数据失败'
          });
        }
      },
      fail: (err) => {
        this.setData({
          errorMsg: '网络请求失败，无法获取表头数据'
        });
        console.error('表头请求失败：', err);
      }
    });
  },

  // 获取商品列表（核心接口）
  fetchProducts() {
    // 显示加载状态
    this.setData({ isLoading: true });

    const { 
      companyEnterpriseId, 
      brand, 
      classId, 
      className,
      status,
      keyword,
      priceCategoryType,
      priceCategoryPriceName,
      priceCategoryFormula,
      priceCategoryValidityTime
    } = this.data;
    
    // 构建请求参数（只传有值的参数）
    const params = {
      enterpriseId: companyEnterpriseId, // 必传企业ID
      ...(brand && { brand }),
      ...(classId && { classId }),
      ...(className && { className }),
      ...(status && { status }),
      ...(keyword && { productName: keyword }), // 关键字搜索
      // 价格分类参数
      ...(priceCategoryType && { 'priceCategory.type': priceCategoryType }),
      ...(priceCategoryPriceName && { 'priceCategory.priceName': priceCategoryPriceName }),
      ...(priceCategoryFormula && { 'priceCategory.formula': priceCategoryFormula }),
      ...(priceCategoryValidityTime && { 'priceCategory.validityTime': priceCategoryValidityTime })
    };

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/list`,
      method: 'GET',
      data: params,
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`,
        'accept': '*/*'
      },
      success: (res) => {
        // 接口响应处理（确保错误信息为字符串）
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            // 成功：更新商品列表
            this.setData({
              products: res.data.rows || [],
              filterProduct: res.data.rows || [],
              errorMsg: '' // 清空错误
            });
          } else {
            // 接口返回错误（如参数错误）
            this.setData({
              errorMsg: res.data?.msg || '获取商品列表失败',
              filterProduct: []
            });
          }
        } else {
          // 网络状态码错误（如404、500）
          this.setData({
            errorMsg: `请求失败，状态码：${res.statusCode}`,
            filterProduct: []
          });
        }
      },
      fail: (err) => {
        // 网络请求失败（如断网）
        this.setData({
          errorMsg: '网络连接失败，请检查网络',
          filterProduct: []
        });
        console.error('商品列表请求失败：', err);
      },
      complete: () => {
        // 无论成功失败，都关闭加载状态
        this.setData({ isLoading: false });
      }
    });
  },

  // 实时输入监听（核心实时搜索逻辑）
  onInput(e) {
    // 获取输入的关键字（确保为字符串）
    const keyword = (e?.detail?.value || '').trim();

    // 防抖处理：输入停止300ms后再执行搜索，避免频繁请求
    clearTimeout(this.data.searchTimer);
    const timer = setTimeout(() => {
      this.setData({ keyword }, () => {
        // 有关键字：先本地筛选（快速响应），再请求最新数据
        if (keyword) {
          this.localSearch(keyword); // 本地模糊搜索
          this.fetchProducts();     // 同时请求服务器（确保数据最新）
        } else {
          // 无关键字：重新请求全部数据
          this.fetchProducts();
        }
      });
    }, 300);

    // 保存定时器，用于后续清除
    this.setData({ searchTimer: timer });
  },

  // 本地模糊搜索（提高搜索响应速度）
  localSearch(keyword) {
    const { products } = this.data;
    if (!products.length) return;

    // 多字段模糊匹配（名称、编码、品牌）
    const filtered = products.filter(item => {
      const matchName = item.productName && item.productName.includes(keyword);
      const matchCode = item.productCode && item.productCode.includes(keyword);
      const matchBrand = item.brand && item.brand.includes(keyword);
      return matchName || matchCode || matchBrand;
    });

    // 更新筛选后的列表（本地快速显示）
    this.setData({ filterProduct: filtered });
  },

  // 点击搜索按钮触发（兼容手动点击）
  onSearch() {
    const { keyword } = this.data;
    if (keyword) {
      this.localSearch(keyword); // 本地筛选
      this.fetchProducts();     // 服务器请求
    } else {
      this.fetchProducts();     // 无关键字时重新加载全部
    }
  },

  // 筛选条件变化时重新获取数据
  onFilterChange(e) {
    const { type, value } = e.currentTarget.dataset;
    this.setData({ [type]: value }, () => {
      // 防抖：300ms后执行，避免频繁请求
      clearTimeout(this.filterTimer);
      this.filterTimer = setTimeout(() => {
        this.fetchProducts();
      }, 300);
    });
  },

  // 删除商品（完善版）
  confirmDelete(e) {
    // 1. 获取商品ID和相关信息（通过data-*属性传递）
    const productId = e.currentTarget.dataset.id;
    const productName = e.currentTarget.dataset.name;
    const productCode = e.currentTarget.dataset.code;

    // 2. 基础校验（确保ID存在）
    if (!productId) {
      wx.showToast({ title: '商品信息无效', icon: 'none', duration: 2000 });
      return;
    }

    // 3. 二次确认弹窗
    wx.showModal({
      title: '确认删除',
      content: `确定要删除商品【${productName || productCode || '未知商品'}】吗？`,
      success: (res) => {
        if (res.confirm) {
          // 4. 调用删除接口（按最新规范：路径传参ids）
          wx.request({
            url: `${getApp().globalData.serverUrl}/diServer/product/${productId}`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${getApp().globalData.token}`,
              'Content-Type': 'application/json'
            },
            success: (res) => {
              // 5. 接口响应处理
              if (res.statusCode === 200) {
                // 业务成功
                if (res.data.code === 200) {
                  wx.showToast({ title: '删除成功', icon: 'success' });
                  this.fetchProducts(); // 删除后重新加载列表
                } else {
                  // 业务失败
                  wx.showToast({ 
                    title: res.data?.msg || '删除失败', 
                    icon: 'none',
                    duration: 2000 
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

  // 查看商品详情
  goToViewProduct(e) {
    // 通过data-id获取商品ID
    const productId = e.currentTarget.dataset.id;
    const productName = e.currentTarget.dataset.name;
    
    if (!productId) {
      wx.showToast({ title: '商品信息不存在', icon: 'none' });
      return;
    }

    // 携带商品ID跳转到详情页
    wx.navigateTo({
      url: `/productPackage/pages/viewSingleProduct/viewSingleProduct?productId=${productId}&name=${encodeURIComponent(productName || '')}`,
    });
  },

  // 跳转到组合商品库
  goToCombinationProoduct() {
    wx.redirectTo({
      url: '/productPackage/pages/combinationProduct/combinationProduct',
    });
  },

  // 跳到临时商品库
  goToTemporaryProoduct() {
    wx.redirectTo({
      url: '/productPackage/pages/temporaryProduct/temporaryProduct',
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

  // 页面卸载时清理定时器（避免内存泄漏）
  onUnload() {
    clearTimeout(this.data.searchTimer);
    clearTimeout(this.filterTimer);
  }
});
