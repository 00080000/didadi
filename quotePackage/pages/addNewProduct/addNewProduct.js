Page({
  data: {
    index: 1, // 1:单商品 2:组合商品 3:临时商品
    showSelectedSingleProduct: false,
    showSelectedCombinationProduct: false,
    showSelectedTemporaryProduct: false,
    // 原始数据存储
    singleProduct: [],
    combinationProduct: [],
    temporaryProduct: [],
    // 筛选后的数据
    filterSingleProduct: [],
    filterCombinationProduct: [],
    filterTemporaryProduct: [],
    // 搜索关键字
    keyword: '',
    combinationKeyword: '',
    temporaryKeyword: '',
    // 接口参数
    enterpriseId: 11, // 企业ID
    isLoading: false, // 加载状态
    errorMsg: '' // 错误提示
  },

  onLoad() {
    // 页面加载时默认加载单商品
    this.fetchSingleProducts();
  },

  // 切换商品类型标签
  chooseSingleProduct() {
    this.setData({ index: 1 }, () => {
      if (this.data.singleProduct.length === 0) {
        this.fetchSingleProducts(); // 首次切换时加载数据
      }
    });
  },
  chooseCombinationProduct() {
    this.setData({ index: 2 }, () => {
      if (this.data.combinationProduct.length === 0) {
        this.fetchCombinationProducts(); // 首次切换时加载数据
      }
    });
  },
  chooseTemporaryProduct() {
    this.setData({ index: 3 }, () => {
      if (this.data.temporaryProduct.length === 0) {
        this.fetchTemporaryProducts(); // 首次切换时加载数据
      }
    });
  },

  // 1. 获取单商品列表（核心修复：价格字段兼容）
  fetchSingleProducts() {
    this.setData({ isLoading: true, errorMsg: '' });
    const { enterpriseId, keyword } = this.data;

    const params = {
      enterpriseId,
      ...(keyword && { productName: keyword }) // 关键字搜索
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
        if (res.statusCode === 200 && res.data.code === 200) {
          // 打印接口返回的原始数据（用于调试价格字段）
          console.log('单商品接口原始数据:', res.data.rows);

          // 格式化数据（重点：多字段兼容获取价格）
          const formattedData = (res.data.rows || []).map(item => ({
            id: item.id,
            name: item.productName || '未知商品',
            type: item.type || item.specs || '无型号',
            // 核心修复：兼容可能的价格字段（根据接口实际返回调整）
            price: this.getValidPrice(item), 
            number: 1,
            select: false
          }));
          this.setData({
            singleProduct: formattedData,
            filterSingleProduct: formattedData
          });
        } else {
          this.setData({ errorMsg: res.data?.msg || '获取单商品失败' });
        }
      },
      fail: () => {
        this.setData({ errorMsg: '网络连接失败，无法获取单商品' });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 2. 获取组合商品列表（核心修复：价格字段兼容）
  fetchCombinationProducts() {
    this.setData({ isLoading: true, errorMsg: '' });
    const { enterpriseId, combinationKeyword } = this.data;

    const params = {
      enterpriseId,
      ...(combinationKeyword && { name: combinationKeyword }) // 关键字搜索
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
          // 打印接口返回的原始数据（用于调试价格字段）
          console.log('组合商品接口原始数据:', res.data.rows);

          // 格式化数据（重点：多字段兼容获取价格）
          const formattedData = (res.data.rows || []).map(item => ({
            id: item.id,
            name: item.name || '未知组合商品',
            // 核心修复：兼容可能的价格字段
            price: this.getValidPrice(item), 
            number: 1,
            select: false
          }));
          this.setData({
            combinationProduct: formattedData,
            filterCombinationProduct: formattedData
          });
        } else {
          this.setData({ errorMsg: res.data?.msg || '获取组合商品失败' });
        }
      },
      fail: () => {
        this.setData({ errorMsg: '网络连接失败，无法获取组合商品' });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 3. 获取临时商品列表（核心修复：价格字段兼容）
  fetchTemporaryProducts() {
    this.setData({ isLoading: true, errorMsg: '' });
    const { enterpriseId, temporaryKeyword } = this.data;

    const params = {
      enterpriseId,
      ...(temporaryKeyword && { productName: temporaryKeyword }) // 关键字搜索
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
          // 打印接口返回的原始数据（用于调试价格字段）
          console.log('临时商品接口原始数据:', res.data.rows);

          // 格式化数据（重点：多字段兼容获取价格）
          const formattedData = (res.data.rows || []).map(item => ({
            id: item.id,
            name: item.productName || '未知临时商品',
            // 核心修复：兼容可能的价格字段
            price: this.getValidPrice(item), 
            number: 1,
            select: false
          }));
          this.setData({
            temporaryProduct: formattedData,
            filterTemporaryProduct: formattedData
          });
        } else {
          this.setData({ errorMsg: res.data?.msg || '获取临时商品失败' });
        }
      },
      fail: () => {
        this.setData({ errorMsg: '网络连接失败，无法获取临时商品' });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 核心工具函数：从接口返回的商品数据中提取有效价格
  getValidPrice(item) {
    // 步骤1：尝试从常见的价格字段中获取（根据接口实际返回调整字段名）
    const priceFields = ['price', 'unitPrice', 'totalPrice', 'salePrice', 'retailPrice'];
    for (const field of priceFields) {
      if (item[field] !== undefined && item[field] !== null) {
        // 步骤2：转换为数字（处理字符串价格，如"99.9"）
        const numericPrice = Number(item[field]);
        // 步骤3：确保价格有效（≥0）
        return isNaN(numericPrice) ? 0 : Math.max(0, numericPrice);
      }
    }
    // 步骤4：如果所有字段都没有，返回0并提示
    console.warn(`商品[${item.name || item.id}]未找到有效价格字段`, item);
    return 0;
  },

  // 单商品搜索
  inputProduct() {
    const { showSelectedSingleProduct, keyword, singleProduct } = this.data;
    let filtered = [];

    if (showSelectedSingleProduct) {
      filtered = singleProduct.filter(item => 
        item.select && item.name.includes(keyword)
      );
    } else {
      filtered = singleProduct.filter(item => item.name.includes(keyword));
    }

    this.setData({ filterSingleProduct: filtered });
  },

  // 组合商品搜索
  inputCombinationProduct() {
    const { showSelectedCombinationProduct, combinationKeyword, combinationProduct } = this.data;
    let filtered = [];

    if (showSelectedCombinationProduct) {
      filtered = combinationProduct.filter(item => 
        item.select && item.name.includes(combinationKeyword)
      );
    } else {
      filtered = combinationProduct.filter(item => item.name.includes(combinationKeyword));
    }

    this.setData({ filterCombinationProduct: filtered });
  },

  // 临时商品搜索
  inputTemporaryProduct() {
    const { showSelectedTemporaryProduct, temporaryKeyword, temporaryProduct } = this.data;
    let filtered = [];

    if (showSelectedTemporaryProduct) {
      filtered = temporaryProduct.filter(item => 
        item.select && item.name.includes(temporaryKeyword)
      );
    } else {
      filtered = temporaryProduct.filter(item => item.name.includes(temporaryKeyword));
    }

    this.setData({ filterTemporaryProduct: filtered });
  },

  // 单商品切换"已选"筛选
  singleProductSwitchChange() {
    this.setData({
      showSelectedSingleProduct: !this.data.showSelectedSingleProduct
    }, () => {
      this.inputProduct(); // 切换后重新筛选
    });
  },

  // 组合商品切换"已选"筛选
  combinationProductSwitchChange() {
    this.setData({
      showSelectedCombinationProduct: !this.data.showSelectedCombinationProduct
    }, () => {
      this.inputCombinationProduct(); // 切换后重新筛选
    });
  },

  // 临时商品切换"已选"筛选
  temporaryProductSwitchChange() {
    this.setData({
      showSelectedTemporaryProduct: !this.data.showSelectedTemporaryProduct
    }, () => {
      this.inputTemporaryProduct(); // 切换后重新筛选
    });
  },

  // 选择/取消单商品
  selectSingleProduct(e) {
    const id = e.currentTarget.dataset.index;
    const singleProduct = this.data.singleProduct.map(item => {
      if (item.id === id) item.select = !item.select;
      return item;
    });

    this.setData({ singleProduct }, () => {
      this.inputProduct(); // 重新筛选
    });
  },

  // 选择/取消组合商品
  selectCombinationProduct(e) {
    const id = e.currentTarget.dataset.index;
    const combinationProduct = this.data.combinationProduct.map(item => {
      if (item.id === id) item.select = !item.select;
      return item;
    });

    this.setData({ combinationProduct }, () => {
      this.inputCombinationProduct(); // 重新筛选
    });
  },

  // 选择/取消临时商品
  selectTemporaryProduct(e) {
    const id = e.currentTarget.dataset.index;
    const temporaryProduct = this.data.temporaryProduct.map(item => {
      if (item.id === id) item.select = !item.select;
      return item;
    });

    this.setData({ temporaryProduct }, () => {
      this.inputTemporaryProduct(); // 重新筛选
    });
  },

  // 商品数量调整方法（单商品/组合/临时商品）
  addSingleProduct(e) {
    const id = e.currentTarget.dataset.index;
    const singleProduct = this.data.singleProduct.map(item => {
      if (item.id === id) item.number++;
      return item;
    });
    this.setData({ singleProduct }, () => this.inputProduct());
  },
  subSingleProduct(e) {
    const id = e.currentTarget.dataset.index;
    const singleProduct = this.data.singleProduct.map(item => {
      if (item.id === id && item.number > 1) item.number--;
      return item;
    });
    this.setData({ singleProduct }, () => this.inputProduct());
  },
  addCombinationProduct(e) {
    const id = e.currentTarget.dataset.index;
    const combinationProduct = this.data.combinationProduct.map(item => {
      if (item.id === id) item.number++;
      return item;
    });
    this.setData({ combinationProduct }, () => this.inputCombinationProduct());
  },
  subCombinationProduct(e) {
    const id = e.currentTarget.dataset.index;
    const combinationProduct = this.data.combinationProduct.map(item => {
      if (item.id === id && item.number > 1) item.number--;
      return item;
    });
    this.setData({ combinationProduct }, () => this.inputCombinationProduct());
  },
  addTemporaryProduct(e) {
    const id = e.currentTarget.dataset.index;
    const temporaryProduct = this.data.temporaryProduct.map(item => {
      if (item.id === id) item.number++;
      return item;
    });
    this.setData({ temporaryProduct }, () => this.inputTemporaryProduct());
  },
  subTemporaryProduct(e) {
    const id = e.currentTarget.dataset.index;
    const temporaryProduct = this.data.temporaryProduct.map(item => {
      if (item.id === id && item.number > 1) item.number--;
      return item;
    });
    this.setData({ temporaryProduct }, () => this.inputTemporaryProduct());
  },

  // 取消选择，返回上一页
  cancel() {
    wx.navigateBack();
  },

  // 确认选择，返回上一页并传递数据
  confirm() {
    // 收集所有已选中的商品，并添加类型标识
    const selected = [
      ...this.data.singleProduct
        .filter(item => item.select)
        .map(item => ({ ...item, type: 'singleProduct' })),
      ...this.data.combinationProduct
        .filter(item => item.select)
        .map(item => ({ ...item, type: 'combinationProduct' })),
      ...this.data.temporaryProduct
        .filter(item => item.select)
        .map(item => ({ ...item, type: 'customProduct' }))
    ];

    if (selected.length === 0) {
      wx.showToast({ title: '请至少选择一个商品', icon: 'none' });
      return;
    }

    // 打印选中商品的价格信息（用于调试）
    console.log('选中的商品及价格:', selected.map(item => ({
      name: item.name,
      price: item.price,
      number: item.number
    })));

    // 获取上一页实例并传递数据
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      prevPage.setData({
        product: [...prevPage.data.product, ...selected]
      }, () => {
        prevPage.calculateTotal(); // 触发上一页重新计算总价
        wx.navigateBack();
      });
    }
  }
});