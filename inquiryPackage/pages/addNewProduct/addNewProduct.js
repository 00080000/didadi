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
    console.log('页面加载，开始获取单商品数据');
    this.fetchSingleProducts();
  },

  // 切换商品类型标签
  chooseSingleProduct() {
    this.setData({ index: 1 }, () => {
      if (this.data.singleProduct.length === 0) {
        console.log('切换到单商品标签，数据为空，开始加载');
        this.fetchSingleProducts(); // 首次切换时加载数据
      } else {
        console.log('切换到单商品标签，使用缓存数据');
      }
    });
  },
  
  chooseCombinationProduct() {
    this.setData({ index: 2 }, () => {
      if (this.data.combinationProduct.length === 0) {
        console.log('切换到组合商品标签，数据为空，开始加载');
        this.fetchCombinationProducts(); // 首次切换时加载数据
      } else {
        console.log('切换到组合商品标签，使用缓存数据');
      }
    });
  },
  
  chooseTemporaryProduct() {
    this.setData({ index: 3 }, () => {
      if (this.data.temporaryProduct.length === 0) {
        console.log('切换到临时商品标签，数据为空，开始加载');
        this.fetchTemporaryProducts(); // 首次切换时加载数据
      } else {
        console.log('切换到临时商品标签，使用缓存数据');
      }
    });
  },

  // 1. 获取单商品列表
  fetchSingleProducts() {
    this.setData({ isLoading: true, errorMsg: '' });
    const { enterpriseId, keyword } = this.data;
    console.log(`开始获取单商品数据，企业ID: ${enterpriseId}, 搜索关键词: ${keyword}`);

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
        console.log('单商品接口返回数据:', res.data);
        if (res.statusCode === 200 && res.data.code === 200) {
          const formattedData = (res.data.rows || []).map(item => ({
            id: item.id,
            name: item.productName || '未知商品',
            type: item.type || item.specs || '无型号',
            price: this.getValidPrice(item, 'single'),
            number: 1,
            select: false,
            productCode: item.productCode || item.code || '无编码',
            totalPrice: this.getValidPrice(item, 'single'), // 计算初始总价
            // 补全单商品特有参数
            unitPrice: item.unitPrice || '0.00',
            validityTime: item.validityTime || '',
            produceCompany: item.produceCompany || '',
            className: item.className || '',
            source: item.source || '',
            templateId: item.templateId || 0,
            createTime: item.createTime || '',
            files: item.files || [],
            tag: item.tag || '',
            sp: item.sp || false,
            pics: item.pics || [],
            brand: item.brand || '',
            status: item.status || '',
            unit: item.unit || '',
            model: item.model || ''
          }));
          console.log(`单商品数据格式化完成，共 ${formattedData.length} 条`);
          this.setData({
            singleProduct: formattedData,
            filterSingleProduct: formattedData
          });
        } else {
          const errorMsg = res.data?.msg || '获取单商品失败';
          console.error('单商品获取失败:', errorMsg);
          this.setData({ errorMsg });
        }
      },
      fail: (err) => {
        console.error('单商品接口请求失败:', err);
        this.setData({ errorMsg: '网络连接失败，无法获取单商品' });
      },
      complete: () => {
        this.setData({ isLoading: false });
        console.log('单商品数据加载完成');
      }
    });
  },

  // 2. 获取组合商品列表
  fetchCombinationProducts() {
    this.setData({ isLoading: true, errorMsg: '' });
    const { enterpriseId, combinationKeyword } = this.data;
    console.log(`开始获取组合商品数据，企业ID: ${enterpriseId}, 搜索关键词: ${combinationKeyword}`);

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
        console.log('组合商品接口返回数据:', res.data);
        if (res.statusCode === 200 && res.data.code === 200) {
          const formattedData = (res.data.rows || []).map(item => ({
            id: item.id,
            name: item.name || '未知组合商品',
            price: 0, // 初始价格设为0，将在详情中计算
            number: 1,
            select: false,
            productCode: item.productCode || item.code || '组合无编码',
            products: [],
            totalPrice: 0, // 初始总价设为0
            // 补全组合商品特有参数
            createBy: item.createBy || '',
            createTime: item.createTime || '',
            updateBy: item.updateBy || '',
            updateTime: item.updateTime || '',
            remark: item.remark || '',
            classId: item.classId || '',
            className: item.className || '',
            tag: item.tag || '',
            status: item.status || 0,
            validityTime: item.validityTime || '',
            userId: item.userId || 0,
            enterpriseId: item.enterpriseId || 0,
            productList: item.productList || null,
            imageList: item.imageList || null,
            fileList: item.fileList || null
          }));
          
          console.log(`组合商品数据初步格式化完成，共 ${formattedData.length} 条，开始获取详情`);
          // 为每个组合商品获取详情（包含内部商品）
          this.fetchCombinationDetails(formattedData);
          
          this.setData({
            combinationProduct: formattedData,
            filterCombinationProduct: formattedData
          });
        } else {
          const errorMsg = res.data?.msg || '获取组合商品失败';
          console.error('组合商品获取失败:', errorMsg);
          this.setData({ errorMsg });
        }
      },
      fail: (err) => {
        console.error('组合商品接口请求失败:', err);
        this.setData({ errorMsg: '网络连接失败，无法获取组合商品' });
      },
      complete: () => {
        this.setData({ isLoading: false });
        console.log('组合商品数据加载流程完成');
      }
    });
  },

  // 获取组合商品详情（包含内部商品）
  fetchCombinationDetails(combinations) {
    if (!combinations || combinations.length === 0) {
      console.log('没有组合商品需要获取详情');
      return;
    }
    
    console.log(`开始获取 ${combinations.length} 个组合商品的详情`);
    combinations.forEach((combination, index) => {
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/product/group/${combination.id}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          console.log(`组合商品 ${combination.id} 详情接口返回数据:`, res.data);
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
              totalPrice: this.getValidPrice(item, 'single') * (item.quantity || 1),
              // 补全组合内商品参数
              validityTime: item.validityTime || '',
              produceCompany: item.produceCompany || '',
              className: item.className || '',
              tag: item.tag || '',
              sp: item.sp || false,
              brand: item.brand || '',
              unit: item.unit || ''
            }));
            
            // 计算组合商品总价（内部商品总价之和）
            const combinationPrice = products.reduce((sum, item) => sum + item.totalPrice, 0);
            
            // 更新组合商品数据
            const updatedCombinations = [...this.data.combinationProduct];
            updatedCombinations[index] = {
              ...updatedCombinations[index],
              products: products,
              price: combinationPrice, // 组合商品单价 = 内部商品总价
              totalPrice: combinationPrice * updatedCombinations[index].number, // 组合总价 = 单价 × 数量
              // 补充组合商品详情参数
              imageList: details.imageList || [],
              fileList: details.fileList || []
            };
            
            this.setData({
              combinationProduct: updatedCombinations,
              filterCombinationProduct: updatedCombinations
            });
            console.log(`组合商品 ${combination.id} 详情更新完成`);
          }
        },
        fail: (err) => {
          console.error(`获取组合商品[${combination.id}]详情失败:`, err);
        }
      });
    });
  },

  // 3. 获取临时商品列表
  fetchTemporaryProducts() {
    this.setData({ isLoading: true, errorMsg: '' });
    const { enterpriseId, temporaryKeyword } = this.data;
    console.log(`开始获取临时商品数据，企业ID: ${enterpriseId}, 搜索关键词: ${temporaryKeyword}`);

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
        console.log('临时商品接口返回数据:', res.data);
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
              totalPrice: price, // 初始总价 = 单价 × 1
              // 补全临时商品特有参数
              createBy: item.createBy || '',
              createTime: item.createTime || '',
              updateBy: item.updateBy || '',
              updateTime: item.updateTime || '',
              remark: item.remark || '',
              classId: item.classId || '',
              className: item.className || '',
              productType: item.productType || 0,
              source: item.source || '',
              enterpriseId: item.enterpriseId || 0,
              canSync: item.canSync || 0,
              canDelete: item.canDelete || 0
            };
          });
          console.log(`临时商品数据格式化完成，共 ${formattedData.length} 条`);
          this.setData({
            temporaryProduct: formattedData,
            filterTemporaryProduct: formattedData
          });
        } else {
          const errorMsg = res.data?.msg || '获取临时商品失败';
          console.error('临时商品获取失败:', errorMsg);
          this.setData({ errorMsg });
        }
      },
      fail: (err) => {
        console.error('临时商品接口请求失败:', err);
        this.setData({ errorMsg: '网络连接失败，无法获取临时商品' });
      },
      complete: () => {
        this.setData({ isLoading: false });
        console.log('临时商品数据加载完成');
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
    console.log(`更新${productType}商品[${id}]的数量为${number}`);
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
    console.log(`单商品搜索，关键词: ${keyword}, 只看已选: ${showSelectedSingleProduct}`);
    let filtered = [];

    if (showSelectedSingleProduct) {
      filtered = singleProduct.filter(item => 
        item.select && item.name.includes(keyword)
      );
    } else {
      filtered = singleProduct.filter(item => item.name.includes(keyword));
    }

    console.log(`单商品搜索完成，找到 ${filtered.length} 条结果`);
    this.setData({ filterSingleProduct: filtered });
  },

  // 组合商品搜索
  inputCombinationProduct() {
    const { showSelectedCombinationProduct, combinationKeyword, combinationProduct } = this.data;
    console.log(`组合商品搜索，关键词: ${combinationKeyword}, 只看已选: ${showSelectedCombinationProduct}`);
    let filtered = [];

    if (showSelectedCombinationProduct) {
      filtered = combinationProduct.filter(item => 
        item.select && item.name.includes(combinationKeyword)
      );
    } else {
      filtered = combinationProduct.filter(item => item.name.includes(combinationKeyword));
    }

    console.log(`组合商品搜索完成，找到 ${filtered.length} 条结果`);
    this.setData({ filterCombinationProduct: filtered });
  },

  // 临时商品搜索
  inputTemporaryProduct() {
    const { showSelectedTemporaryProduct, temporaryKeyword, temporaryProduct } = this.data;
    console.log(`临时商品搜索，关键词: ${temporaryKeyword}, 只看已选: ${showSelectedTemporaryProduct}`);
    let filtered = [];

    if (showSelectedTemporaryProduct) {
      filtered = temporaryProduct.filter(item => 
        item.select && item.name.includes(temporaryKeyword)
      );
    } else {
      filtered = temporaryProduct.filter(item => item.name.includes(temporaryKeyword));
    }

    console.log(`临时商品搜索完成，找到 ${filtered.length} 条结果`);
    this.setData({ filterTemporaryProduct: filtered });
  },

  // 单商品切换"已选"筛选
  singleProductSwitchChange() {
    console.log('单商品切换已选筛选状态');
    this.setData({
      showSelectedSingleProduct: !this.data.showSelectedSingleProduct
    }, () => {
      this.inputProduct();
    });
  },

  // 组合商品切换"已选"筛选
  combinationProductSwitchChange() {
    console.log('组合商品切换已选筛选状态');
    this.setData({
      showSelectedCombinationProduct: !this.data.showSelectedCombinationProduct
    }, () => {
      this.inputCombinationProduct();
    });
  },

  // 临时商品切换"已选"筛选
  temporaryProductSwitchChange() {
    console.log('临时商品切换已选筛选状态');
    this.setData({
      showSelectedTemporaryProduct: !this.data.showSelectedTemporaryProduct
    }, () => {
      this.inputTemporaryProduct();
    });
  },

  // 选择/取消商品
  selectSingleProduct(e) {
    const id = e.currentTarget.dataset.index;
    console.log(`切换单商品[${id}]的选择状态`);
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
    console.log(`切换组合商品[${id}]的选择状态`);
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
    console.log(`切换临时商品[${id}]的选择状态`);
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
      console.log(`增加单商品[${id}]的数量，当前数量: ${item.number}`);
      this.updateTotalPrice('singleProduct', id, item.number + 1);
    }
  },
  
  subSingleProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.singleProduct.find(item => item.id === id);
    if (item && item.number > 1) {
      console.log(`减少单商品[${id}]的数量，当前数量: ${item.number}`);
      this.updateTotalPrice('singleProduct', id, item.number - 1);
    } else {
      console.log(`单商品[${id}]数量已为1，无法再减少`);
    }
  },
  
  addCombinationProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.combinationProduct.find(item => item.id === id);
    if (item) {
      console.log(`增加组合商品[${id}]的数量，当前数量: ${item.number}`);
      this.updateTotalPrice('combinationProduct', id, item.number + 1);
    }
  },
  
  subCombinationProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.combinationProduct.find(item => item.id === id);
    if (item && item.number > 1) {
      console.log(`减少组合商品[${id}]的数量，当前数量: ${item.number}`);
      this.updateTotalPrice('combinationProduct', id, item.number - 1);
    } else {
      console.log(`组合商品[${id}]数量已为1，无法再减少`);
    }
  },
  
  addTemporaryProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.temporaryProduct.find(item => item.id === id);
    if (item) {
      console.log(`增加临时商品[${id}]的数量，当前数量: ${item.number}`);
      this.updateTotalPrice('temporaryProduct', id, item.number + 1);
    }
  },
  
  subTemporaryProduct(e) {
    const id = e.currentTarget.dataset.index;
    const item = this.data.temporaryProduct.find(item => item.id === id);
    if (item && item.number > 1) {
      console.log(`减少临时商品[${id}]的数量，当前数量: ${item.number}`);
      this.updateTotalPrice('temporaryProduct', id, item.number - 1);
    } else {
      console.log(`临时商品[${id}]数量已为1，无法再减少`);
    }
  },

  // 取消选择，返回上一页
  cancel() {
    console.log('用户取消选择，返回上一页');
    wx.navigateBack();
  },

  // 确认选择，返回上一页并传递数据
  confirm() {
    console.log('用户确认选择，开始收集已选商品');
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

    console.log(`已选商品共 ${selected.length} 条:`, selected);
    if (selected.length === 0) {
      console.log('未选择任何商品，提示用户');
      wx.showToast({ title: '请至少选择一个商品', icon: 'none' });
      return;
    }

    // 更新上一页数据
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      console.log('找到上一页，开始传递数据');
      // 获取上一页当前商品列表
      const prevProducts = [...prevPage.data.product || []];
      // 合并新选择的商品
      const newProducts = [...prevProducts, ...selected];
      // 传递数据到上一页
      prevPage.setData({
        product: newProducts
      }, () => {
        // 触发上一页的计算方法更新总金额
        if (typeof prevPage.calculateTotal === 'function') {
          console.log('调用上一页的calculateTotal方法');
          prevPage.calculateTotal();
        }
        console.log('数据传递完成，返回上一页');
        wx.navigateBack();
      });
    } else {
      console.log('未找到上一页，直接返回');
      wx.navigateBack();
    }
  }
});
