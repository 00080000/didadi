Page({
    data: {
      product: [], // 商品列表
      totalAmount: 0.00, // 总价
      fileName: '小喇叭公司报价单',
      ifShow: false, // 新增菜单显示状态
      originalProducts: [] // 用于取消操作的原始数据备份
    },
  
    onLoad(options) {
      console.log('===== chooseProduct页面加载onLoad =====');
      console.log('页面参数:', options);
      
      const app = getApp();
      console.log('全局数据中的submitData:', app.globalData.submitData);
      
      // 从submitData获取商品数据（与addQuotation保持一致）
      let sourceProducts = [];
      if (app.globalData.submitData && app.globalData.submitData.products && app.globalData.submitData.products.length > 0) {
        console.log('从submitData获取商品数据，数量:', app.globalData.submitData.products.length);
        sourceProducts = app.globalData.submitData.products;
      }
      // 兼容处理：如果submitData中没有，从selectedProducts获取
      else if (app.globalData.selectedProducts && app.globalData.selectedProducts.length > 0) {
        console.log('从selectedProducts获取商品数据，数量:', app.globalData.selectedProducts.length);
        sourceProducts = app.globalData.selectedProducts;
      }
  
      if (sourceProducts.length > 0) {
        // 标准化商品数据结构（展示用）
        const normalizedProducts = this.normalizeProductData(sourceProducts);
        console.log('标准化后的商品数据(展示用):', normalizedProducts);
        
        this.setData({
          product: normalizedProducts,
          originalProducts: [...normalizedProducts] // 备份原始数据
        }, () => {
          console.log('setData完成，当前商品列表:', this.data.product);
        });
      } else {
        // 新建场景：初始为空
        console.log('未检测到商品数据，初始化为空列表');
        this.setData({
          product: [],
          originalProducts: []
        });
      }
      // 计算初始总价
      this.calculateTotal();
    },
  
    // 标准化商品数据结构（用于展示）
    normalizeProductData(products) {
      console.log('===== 开始标准化商品数据（展示用） =====');
      console.log('标准化前的数据:', products);
      
      const normalized = products.map((item, index) => {
        console.log(`处理第${index}个商品，原始数据:`, item);
        
        // 解析productData（如果存在）
        let productData = {};
        if (item.productData && typeof item.productData === 'string') {
          try {
            productData = JSON.parse(item.productData);
            console.log(`解析productData成功:`, productData);
          } catch (e) {
            console.error(`解析productData失败:`, e);
          }
        } else if (typeof item.productData === 'object') {
          productData = item.productData;
        }
        
        // 确保所有商品都有基础字段，优先从productData获取，其次从item获取
        const baseItem = {
          id: item.id || `item-${Date.now()}-${index}`,
          name: productData.productName || item.productName || '未命名商品',
          type: this.getProductType(item.type || productData.type) || 'singleProduct',
          price: Number(productData.unitPrice) || Number(item.unitPrice) || Number(item.price) || 0,
          number: Number(item.quantity) || Number(item.number) || 1,
          // 原始数据备份（用于提交时还原格式）
          originalData: item,
          originalProductData: productData,
          // 其他展示用字段
          unit: productData.unit || item.unit || '',
          specs: productData.specs || item.specs || '',
          remark: productData.remark || item.remark || ''
        };
  
        // 根据商品类型补充特定字段
        switch(baseItem.type) {
          case 'combinationProduct':
            baseItem.products = item.products || [];
            break;
          case 'feeName':
            baseItem.total = item.total !== undefined ? Number(item.total) : 1;
            break;
          case 'groupRow':
            baseItem.description = item.description || '';
            break;
        }
  
        console.log(`标准化后的数据(展示用):`, baseItem);
        return baseItem;
      });
      
      console.log('===== 商品数据标准化完成（展示用） =====');
      return normalized;
    },
  
    // 转换商品数据为submitData格式
    convertToSubmitFormat(products) {
      console.log('===== 开始转换商品数据为submitData格式 =====');
      
      const submitProducts = products.map((item) => {
        // 基于原始数据进行修改，保持与submitData一致的格式
        const submitItem = item.originalData ? JSON.parse(JSON.stringify(item.originalData)) : {};
        
        // 更新基本信息
        submitItem.quantity = item.number;
        submitItem.productName = item.name;
        
        // 更新productData（保持原有结构）
        let productData = item.originalProductData ? JSON.parse(JSON.stringify(item.originalProductData)) : {};
        productData.productName = item.name;
        productData.unitPrice = item.price;
        productData.unit = item.unit;
        productData.specs = item.specs;
        productData.remark = item.remark;
        
        // 保持productData的数据类型（与submitData一致）
        submitItem.productData = typeof item.originalData.productData === 'string' 
          ? JSON.stringify(productData) 
          : productData;
        
        // 处理不同类型商品的特殊字段
        if (item.type === 'feeName') {
          submitItem.total = item.total;
          submitItem.unitPrice = item.price;
        }
        
        console.log(`转换后的数据项:`, submitItem);
        return submitItem;
      });
      
      console.log('===== 商品数据转换为submitData格式完成 =====');
      return submitProducts;
    },
  
    // 转换商品类型（根据预览页逻辑映射）
    getProductType(originalType) {
      const typeMap = {
        0: 'singleProduct',    // 普通商品
        1: 'combinationProduct', // 组合商品
        2: 'customProduct',    // 自定义商品
        3: 'feeName'           // 费用项
      };
      return typeMap[originalType] || originalType;
    },
  
    // 计算总价
    calculateTotal() {
      console.log('===== 开始计算总价 =====');
      console.log('当前商品列表:', this.data.product);
      
      let total = 0;
      this.data.product.forEach((item, index) => {
        let itemTotal = 0;
        
        if (item.type === "singleProduct" || item.type === 'customProduct') {
          itemTotal = (item.price || 0) * (item.number || 0);
          console.log(`第${index}个商品[${item.name}]，单价:${item.price}，数量:${item.number}，小计:${itemTotal}`);
        } else if (item.type === 'combinationProduct') {
          itemTotal = item.price || 0;
          console.log(`第${index}个组合商品[${item.name}]，总价:${itemTotal}`);
        } else if (item.type === 'feeName') {
          itemTotal = (item.price || 0) * (item.total || 0);
          console.log(`第${index}个费用项[${item.name}]，单价:${item.price}，数量:${item.total}，小计:${itemTotal}`);
        }
        
        total += itemTotal;
      });
      
      const formattedTotal = total.toFixed(2);
      console.log(`总价计算完成: ${total} → 格式化后: ${formattedTotal}`);
      
      this.setData({
        totalAmount: formattedTotal
      });
    },
  
    // 确认选择（仅更新submitData）
    confirm() {
      const app = getApp();
      console.log('===== 点击确认按钮，更新submitData =====');
      
      // 初始化submitData（如果不存在）
      if (!app.globalData.submitData) {
        app.globalData.submitData = {};
      }
      
      // 转换商品数据为submitData格式并更新
      const submitProducts = this.convertToSubmitFormat(this.data.product);
      app.globalData.submitData.products = submitProducts;
      
      // 更新总价
      app.globalData.submitData.totalAmount = this.data.totalAmount;
      
      // 同步更新selectedProducts用于页面展示
      app.globalData.selectedProducts = this.data.product;
      
      console.log('更新后的submitData:', app.globalData.submitData);
      
      wx.navigateBack();
    },
  
    // 取消操作（恢复原始submitData数据）
    cancel() {
      const app = getApp();
      
      // 恢复商品列表到submitData
      if (app.globalData.submitData) {
        app.globalData.submitData.products = this.convertToSubmitFormat(this.data.originalProducts);
        app.globalData.submitData.totalAmount = this.calculateOriginalTotal();
      }
      
      // 恢复展示用数据
      app.globalData.selectedProducts = [...this.data.originalProducts];
      
      wx.navigateBack();
    },
  
    // 计算原始数据的总价（用于取消操作）
    calculateOriginalTotal() {
      let total = 0;
      this.data.originalProducts.forEach(item => {
        if (item.type === "singleProduct" || item.type === 'customProduct') {
          total += (item.price || 0) * (item.number || 0);
        } else if (item.type === 'combinationProduct') {
          total += item.price || 0;
        } else if (item.type === 'feeName') {
          total += (item.price || 0) * (item.total || 0);
        }
      });
      return total.toFixed(2);
    },
  
    // 添加新商品（确保符合submitData格式）
    goToAddProduct() {
      console.log('===== 点击添加新商品 =====');
      
      wx.navigateTo({
        url: `/quotePackage/pages/addNewProduct/addNewProduct?length=${this.data.product.length}`,
        events: {
          productAdded: (newProduct) => {
            console.log('从addNewProduct页面接收新商品:', newProduct);
            
            // 为新商品创建符合submitData格式的原始数据
            const newProductOriginal = {
              id: `new-${Date.now()}`,
              productName: newProduct.name,
              quantity: newProduct.number,
              unitPrice: newProduct.price,
              productData: JSON.stringify({
                productName: newProduct.name,
                unitPrice: newProduct.price,
                unit: newProduct.unit || '',
                specs: newProduct.specs || '',
                remark: newProduct.remark || '',
                type: this.reverseProductType(newProduct.type)
              }),
              type: this.reverseProductType(newProduct.type)
            };
            
            // 构建展示用商品数据
            const displayProduct = {
              ...newProduct,
              originalData: newProductOriginal,
              originalProductData: JSON.parse(newProductOriginal.productData)
            };
            
            const updatedProducts = [...this.data.product, displayProduct];
            this.setData({ product: updatedProducts }, () => {
              this.calculateTotal();
            });
          }
        }
      });
    },
  
    // 反向转换商品类型（从展示类型到原始类型值）
    reverseProductType(displayType) {
      const typeMap = {
        'singleProduct': 0,
        'combinationProduct': 1,
        'customProduct': 2,
        'feeName': 3
      };
      return typeMap[displayType] || 0;
    },
  
    // 其他原有方法保持不变...
    goToSetFormStyle() {
      wx.navigateTo({
        url: '/quotePackage/pages/setFormStyle/setFormStyle',
      });
    },
  
    goToChooseProductFields() {
      wx.navigateTo({
        url: '/quotePackage/pages/chooseProductFields/chooseProductFields',
      });
    },
  
    setIfShow() {
      this.setData({
        ifShow: !this.data.ifShow
      });
    },
  
    changeUp(e) {
      const index = e.currentTarget.dataset.index;
      if (index <= 0) return;
  
      const product = [...this.data.product];
      [product[index - 1], product[index]] = [product[index], product[index - 1]];
      this.setData({ product }, () => this.calculateTotal());
    },
  
    changeDown(e) {
      const index = e.currentTarget.dataset.index;
      if (index >= this.data.product.length - 1) return;
  
      const product = [...this.data.product];
      [product[index + 1], product[index]] = [product[index], product[index + 1]];
      this.setData({ product }, () => this.calculateTotal());
    },
  
    navigate(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.product[index];
      console.log(`===== 点击编辑第${index}个商品 =====`);
      console.log('编辑的商品数据:', item);
      
      wx.navigateTo({
        url: `/quotePackage/pages/editChoosed${this.getEditPageName(item.type)}/editChoosed${this.getEditPageName(item.type)}?index=${index}&item=${encodeURIComponent(JSON.stringify(item))}`
      });
    },
  
    getEditPageName(type) {
      const pageMap = {
        singleProduct: 'SingleProduct',
        combinationProduct: 'CombinationProduct',
        customProduct: 'CuntomProduct',
        feeName: 'Fee'
      };
      return pageMap[type] || 'SingleProduct';
    },
  
    addBlankRow() {
      const newRow = {
        id: `blank-${Date.now()}`,
        name: '空白行',
        type: 'blankRow',
        originalData: {
          id: `blank-${Date.now()}`,
          type: 4,
          productData: JSON.stringify({ type: 4 })
        },
        originalProductData: { type: 4 }
      };
      console.log('添加空白行:', newRow);
      
      const product = [...this.data.product, newRow];
      this.setData({ product, ifShow: false }, () => this.calculateTotal());
    },
  
    addGroupRow() {
      const newRow = {
        id: `group-${Date.now()}`,
        name: '新分组',
        type: 'groupRow',
        description: '',
        originalData: {
          id: `group-${Date.now()}`,
          type: 5,
          productData: JSON.stringify({ 
            type: 5,
            productName: '新分组',
            description: ''
          })
        },
        originalProductData: { 
          type: 5,
          productName: '新分组',
          description: ''
        }
      };
      console.log('添加分组行:', newRow);
      
      const product = [...this.data.product, newRow];
      this.setData({ product, ifShow: false }, () => this.calculateTotal());
    },
  
    addFeeRow() {
      const newRow = {
        id: `fee-${Date.now()}`,
        name: '新费用',
        total: 1,
        price: 0,
        type: 'feeName',
        originalData: {
          id: `fee-${Date.now()}`,
          type: 3,
          total: 1,
          unitPrice: 0,
          productData: JSON.stringify({
            type: 3,
            productName: '新费用',
            unitPrice: 0
          })
        },
        originalProductData: {
          type: 3,
          productName: '新费用',
          unitPrice: 0
        }
      };
      console.log('添加费用行:', newRow);
      
      const product = [...this.data.product, newRow];
      this.setData({ product, ifShow: false }, () => this.calculateTotal());
    }
  });
      