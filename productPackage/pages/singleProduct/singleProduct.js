Page({
  data: {
    products: [],       // 存储商品列表
    filterProduct: [],  // 存储筛选后的商品列表
    keyword: '',        // 搜索关键字
    companyEnterpriseId: 11, // 企业ID
    tableHeaders: [],   // 表头数据
    errorMsg: '',       // 错误信息提示
    // 补充筛选参数（根据接口文档新增）
    brand: '',          // 品牌筛选
    classId: '',        // 类别ID筛选
    className: '',      // 类别名称筛选
    status: '',         // 商品状态筛选
    // 价格分类相关筛选条件
    priceCategoryType: '',        // 价格类型
    priceCategoryPriceName: '',   // 价格名称
    priceCategoryFormula: '',     // 计算公式
    priceCategoryValidityTime: '' // 有效期
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
          this.setData({
            errorMsg: res.data.message || '获取表头数据失败'
          });
        }
      },
      fail: (err) => {
        this.setData({
          errorMsg: '网络请求失败，无法获取表头数据'
        });
      }
    });
  },

  // 获取商品列表（根据接口文档完善参数）
  fetchProducts() {
    const { 
      companyEnterpriseId, 
      brand, 
      classId, 
      className,
      status,
      keyword,
      // 价格分类参数
      priceCategoryType,
      priceCategoryPriceName,
      priceCategoryFormula,
      priceCategoryValidityTime
    } = this.data;
    
    // 构建请求参数（包含接口要求的所有可选参数）
    const params = {
      enterpriseId: companyEnterpriseId,
      brand,
      classId,
      className,
      status,
      productName: keyword || '',
      // 价格分类相关参数（接口文档中标注的查询参数）
      'priceCategory.type': priceCategoryType,
      'priceCategory.priceName': priceCategoryPriceName,
      'priceCategory.formula': priceCategoryFormula,
      'priceCategory.validityTime': priceCategoryValidityTime
    };

    // 移除空值参数，减少无效请求参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/list`,
      method: 'GET',
      data: params,
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`,
        'accept': '*/*'
      },
      success: (res) => {
        // 适配接口返回格式（根据实际响应调整）
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            this.setData({
              products: res.data.rows || [],
              filterProduct: res.data.rows || [],
              errorMsg: ''
            });
          } else {
            this.setData({
              errorMsg: res.data.msg || '获取商品列表失败'
            });
          }
        } else {
          this.setData({
            errorMsg: `请求失败，状态码：${res.statusCode}`
          });
        }
      },
      fail: (err) => {
        this.setData({
          errorMsg: '网络请求失败，请检查网络连接'
        });
        console.error('商品列表请求失败：', err);
      }
    });
  },

  // 搜索商品（优化搜索逻辑，支持多字段搜索）
  inputProduct(e) {
    // 获取输入的关键字（如果有输入事件则更新关键字）
    if (e && e.detail && e.detail.value) {
      this.setData({
        keyword: e.detail.value
      });
    }

    const { keyword, products } = this.data;
    if (!keyword) {
      this.setData({
        filterProduct: products
      });
      return;
    }

    // 支持商品名称、商品编码、品牌多字段搜索
    const filtered = products.filter(item => {
      const matchProductName = item.productName && item.productName.includes(keyword);
      const matchProductCode = item.productCode && item.productCode.includes(keyword);
      const matchBrand = item.brand && item.brand.includes(keyword);
      return matchProductName || matchProductCode || matchBrand;
    });

    this.setData({
      filterProduct: filtered
    });
  },

  // 筛选条件变化时重新获取数据
  onFilterChange(e) {
    const { type, value } = e.currentTarget.dataset;
    // 更新对应筛选条件的值
    this.setData({
      [type]: value
    }, () => {
      // 延迟执行，避免频繁请求
      clearTimeout(this.filterTimer);
      this.filterTimer = setTimeout(() => {
        this.fetchProducts();
      }, 300);
    });
  },

  // 删除商品
  confirmDelete(e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.filterProduct[index];

    if (!product || !product.id) {
      wx.showToast({ title: '商品信息无效', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除商品【${product.productName || product.productCode}】吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${getApp().globalData.serverUrl}/diServer/product/delete`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${getApp().globalData.token}`,
              'Content-Type': 'application/json'
            },
            data: {
              id: product.id
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.code === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                this.fetchProducts(); // 删除后重新拉取列表
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

  // 查看商品详情（优化参数传递）
  goToViewProduct(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.filterProduct[index];
    
    if (!item) {
      wx.showToast({ title: '商品信息不存在', icon: 'none' });
      return;
    }

    // 传递完整商品ID，方便详情页获取完整信息
    wx.navigateTo({
      url: `/productPackage/pages/viewSingleProduct/viewSingleProduct?productId=${item.id}&name=${encodeURIComponent(item.productName || '')}`,
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
    clearTimeout(this.filterTimer);
  }
});