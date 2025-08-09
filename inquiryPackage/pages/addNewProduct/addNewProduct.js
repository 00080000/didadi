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

  // 1. 获取单商品列表
  fetchSingleProducts() {
    this.setData({ isLoading: true, errorMsg: '' });
    const { enterpriseId, keyword } = this.data;

    const params = {
      enterpriseId,
      ...(keyword && { productName: keyword })
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
          const formattedData = (res.data.rows || []).map(item => ({
            id: item.id,
            name: item.productName || '未知商品',
            type: item.type || item.specs || '无型号',
            price: this.getValidPrice(item, 'single'),
            number: 1,
            select: false,
            productCode: item.productCode || item.code || '无编码',
            totalPrice: this.getValidPrice(item, 'single') // 计算初始总价
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

  // 2. 获取组合商品列表
  fetchCombinationProducts() {
    this.setData({ isLoading: true, errorMsg: '' });
    const { enterpriseId, combinationKeyword } = this.data;

    const params = {
      enterpriseId,
      ...(combinationKeyword && { name: combinationKeyword })
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
          const formattedData = (res.data.rows || []).map(item => ({
            id: item.id,
            name: item.name || '未知组合商品',
            price: 0, // 初始价格设为0，将在详情中计算
            number: 1,
            select: false,
            productCode: item.productCode || item.code || '组合无编码',
            products: [],
            totalPrice: 0 // 初始总价设为0
          }));
          
          // 为每个组合商品获取详情（包含内部商品）
          this.fetchCombinationDetails(formattedData);
          
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

  // 获取组合商品详情（包含内部商品）
  fetchCombinationDetails(combinations) {
    if (!combinations || combinations.length === 0) return;
    
    combinations.forEach((combination, index) => {
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/product/group/${combination.id}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            const details = res.data.data || {};
            // 处理组合内商品数据，计算单价和总价
            const products = (details.productList || []).map(item => ({
              id: item.id,
              productId: item.productId,
              name: item.productName || '未知商品',
              unitPrice: this.getValidPrice(item, 'single'),
              quantity: item.quantity || 1,
              productCode: item.productCode || item.code || '无编码',
              totalPrice: this.getValidPrice(item, 'single') * (item.quantity || 1)
            }));
            
            // 计算组合商品总价（内部商品总价之和）
            const combinationPrice = products.reduce((sum, item) => sum + item.totalPrice, 0);
            
            // 更新组合商品数据
            const updatedCombinations = [...this.data.combinationProduct];
            updatedCombinations[index] = {
              ...updatedCombinations[index],
              products: products,
              price: combinationPrice, // 组合商品单价 = 内部商品总价
              totalPrice: combinationPrice * updatedCombinations[index].number // 组合总价 = 单价 × 数量
            };
            
            this.setData({
              combinationProduct: updatedCombinations,
              filterCombinationProduct: updatedCombinations
            });
          }
        },
        fail: () => {
          console.error(`获取组合商品[${combination.id}]详情失败`);
        }
      });
    });
  },

  // 3. 获取临时商品列表
  fetchTemporaryProducts() {
    this.setData({ isLoading: true, errorMsg: '' });
    const { enterpriseId, temporaryKeyword } = this.data;

    const params = {
      enterpriseId,
      ...(temporaryKeyword && { productName: temporaryKeyword })
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
          // 格式化临时商品数据，特别处理临时商品价格
          const formattedData = (res.data.rows || []).map(item => {
            const price = this.getValidPrice(item, 'temporary');
            return {
              id: item.id,
              name: item.productName || '未知临时商品',
              price: price,
              number: 1,
              select: false,
              productCode: item.productCode || item.code || '临时无编码',
              totalPrice: price // 初始总价 = 单价 × 1
            };
          });
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

  // 核心工具函数：根据商品类型获取有效价格
  getValidPrice(item, type) {
    // 针对不同类型商品使用不同的价格字段优先级
    let priceFields = [];
    
    switch(type) {
      case 'single':
        // 单商品价格字段优先级
        priceFields = ['price', 'unitPrice', 'salePrice', 'retailPrice', 'totalPrice'];
        break;
      case 'combination':
        // 组合商品价格字段优先级
        priceFields = ['groupPrice', 'packagePrice', 'price', 'totalPrice'];
        break;
      case 'temporary':
        // 临时商品价格字段优先级
        priceFields = ['temporaryPrice', 'customPrice', 'price', 'unitPrice'];
        break;
      default:
        priceFields = ['price', 'unitPrice', 'totalPrice'];
    }
    
    // 查找有效价格
    for (const field of priceFields) {
      if (item[field] !== undefined && item[field] !== null) {
        const numericPrice = Number(item[field]);
        return isNaN(numericPrice) ? 0 : Math.max(0, numericPrice);
      }
    }
    
    // 如果没有找到价格，尝试通用字段
    const commonFields = ['price', 'unitPrice'];
    for (const field of commonFields) {
      if (item[field] !== undefined && item[field] !== null) {
        const numericPrice = Number(item[field]);
        return isNaN(numericPrice) ? 0 : Math.max(0, numericPrice);
      }
    }
    
    console.warn(`商品[${item.name || item.id}]未找到有效价格字段`, item);
    return 0;
  },

  // 更新商品总价
  updateTotalPrice(productType, id, number) {
    const productList = [...this.data[productType]];
    const updatedList = productList.map(item => {
      if (item.id === id) {
        // 计算新总价 = 单价 × 数量
        const newTotalPrice = item.price * number;
        return { ...item, number, totalPrice: newTotalPrice };
      }
      return item;
    });
    
    // 更新数据
    this.setData({
      [productType]: updatedList,
      [`filter${productType.charAt(0).toUpperCase() + productType.slice(1)}`]: updatedList
    });
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
      this.inputProduct();
    });
  },

  // 组合商品切换"已选"筛选
  combinationProductSwitchChange() {
    this.setData({
      showSelectedCombinationProduct: !this.data.showSelectedCombinationProduct
    }, () => {
      this.inputCombinationProduct();
    });
  },

  // 临时商品切换"已选"筛选
  temporaryProductSwitchChange() {
    this.setData({
      showSelectedTemporaryProduct: !this.data.showSelectedTemporaryProduct
    }, () => {
      this.inputTemporaryProduct();
    });
  },

  // 选择/取消商品
  selectSingleProduct(e) {
    const id = e.currentTarget.dataset.index;
    const singleProduct = this.data.singleProduct.map(item => {
      if (item.id === id) item.select = !item.select;
      return item;
    });

    this.setData({ singleProduct }, () => {
      this.inputProduct();
    });
  },

  selectCombinationProduct(e) {
    const id = e.currentTarget.dataset.index;
    const combinationProduct = this.data.combinationProduct.map(item => {
      if (item.id === id) item.select = !item.select;
      return item;
    });

    this.setData({ combinationProduct }, () => {
      this.inputCombinationProduct();
    });
  },

  selectTemporaryProduct(e) {
    const id = e.currentTarget.dataset.index;
    const temporaryProduct = this.data.temporaryProduct.map(item => {
      if (item.id === id) item.select = !item.select;
      return item;
    });

    this.setData({ temporaryProduct }, () => {
      this.inputTemporaryProduct();
    });
  },

  // 商品数量调整方法
  addSingleProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.singleProduct.find(item => item.id === id);
    if (item) {
      this.updateTotalPrice('singleProduct', id, item.number + 1);
    }
  },
  subSingleProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.singleProduct.find(item => item.id === id);
    if (item && item.number > 1) {
      this.updateTotalPrice('singleProduct', id, item.number - 1);
    }
  },
  addCombinationProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.combinationProduct.find(item => item.id === id);
    if (item) {
      this.updateTotalPrice('combinationProduct', id, item.number + 1);
    }
  },
  subCombinationProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.combinationProduct.find(item => item.id === id);
    if (item && item.number > 1) {
      this.updateTotalPrice('combinationProduct', id, item.number - 1);
    }
  },
  addTemporaryProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.temporaryProduct.find(item => item.id === id);
    if (item) {
      this.updateTotalPrice('temporaryProduct', id, item.number + 1);
    }
  },
  subTemporaryProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.temporaryProduct.find(item => item.id === id);
    if (item && item.number > 1) {
      this.updateTotalPrice('temporaryProduct', id, item.number - 1);
    }
  },

  // 取消选择，返回上一页
  cancel() {
    wx.navigateBack();
  },

  // 确认选择，返回上一页并传递数据
  confirm() {
    // 收集所有已选中的商品，统一格式
    const selected = [
      ...this.data.singleProduct
        .filter(item => item.select)
        .map(item => ({ 
          ...item, 
          type: 'singleProduct', 
          productId: item.id,
          amount: item.totalPrice // 统一使用totalPrice作为金额
        })),
      ...this.data.combinationProduct
        .filter(item => item.select)
        .map(item => ({ 
          ...item, 
          type: 'combinationProduct', 
          productId: item.id,
          amount: item.totalPrice, // 统一使用totalPrice作为金额
          products: item.products || []
        })),
      ...this.data.temporaryProduct
        .filter(item => item.select)
        .map(item => ({ 
          ...item, 
          type: 'customProduct', 
          productId: item.id,
          amount: item.totalPrice // 统一使用totalPrice作为金额
        }))
    ];

    if (selected.length === 0) {
      wx.showToast({ title: '请至少选择一个商品', icon: 'none' });
      return;
    }

    // 更新全局数据
    const app = getApp();
    if (!app.globalData.selectedProducts) {
      app.globalData.selectedProducts = [];
    }
    app.globalData.selectedProducts = [...app.globalData.selectedProducts, ...selected];

    // 更新上一页数据
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      const newProducts = [...prevPage.data.product, ...selected];
      prevPage.setData({
        product: newProducts
      }, () => {
        if (prevPage.calculateTotal) {
          prevPage.calculateTotal();
        }
        wx.navigateBack();
      });
    } else {
      wx.navigateBack();
    }
  }
});
    