Page({
    data: {
      product: [], // 商品列表
      totalAmount: 0.00, // 总价
      fileName: '小喇叭公司报价单',
      ifShow: false, // 新增菜单显示状态
      originalProducts: [], // 用于取消操作的原始数据备份
      searchValue: '', // 搜索输入值
      isAllSelected: false, // 是否全选
      selectedCount: 0, // 已选择商品数量
      isEditMode: false, // 是否编辑模式
      selectMode: false, // 是否选择模式
      showNoData: false, // 是否显示无数据提示
      loading: false, // 加载状态
      page: 1, // 当前页码
      pageSize: 10, // 每页条数
      hasMore: true, // 是否有更多数据
      productFieldList: [] // 商品字段配置列表
    },
  
    onLoad(options) {
      console.log('===== chooseProduct页面加载onLoad =====');
      console.log('页面参数:', options);
      
      const app = getApp();
      // 确保全局数据存在
      if (!app.globalData) {
        app.globalData = {};
      }
      if (!app.globalData.submitData) {
        app.globalData.submitData = {};
      }
      if (!app.globalData.selectedProducts) {
        app.globalData.selectedProducts = [];
      }
      
      // 初始化选择模式
      this.setData({
        selectMode: options.selectMode === 'true',
        productFieldList: app.globalData.submitData?.productFieldList || []
      });
      
      console.log('全局数据中的submitData:', app.globalData.submitData);
      
      // 从submitData获取商品数据（与addQuotation保持一致）
      let sourceProducts = [];
      // 优先从productGroupList获取数据（与提交格式保持一致）
      if (app.globalData.submitData?.productGroupList?.length) {
        console.log('从productGroupList获取商品数据');
        app.globalData.submitData.productGroupList.forEach(group => {
          if (group.quoteProductList && group.quoteProductList.length) {
            sourceProducts = sourceProducts.concat(group.quoteProductList);
          }
        });
      }
      // 其次从submitData.products获取
      else if (app.globalData.submitData && app.globalData.submitData.products && app.globalData.submitData.products.length > 0) {
        console.log('从submitData获取商品数据，数量:', app.globalData.submitData.products.length);
        sourceProducts = app.globalData.submitData.products;
      }
      // 最后从selectedProducts获取
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
          originalProducts: [...normalizedProducts], // 备份原始数据
          showNoData: false
        }, () => {
          console.log('setData完成，当前商品列表:', this.data.product);
          this.calculateTotal(); // 确保计算总价
        });
      } else {
        // 新建场景：初始为空
        console.log('未检测到商品数据，初始化为空列表');
        this.setData({
          product: [],
          originalProducts: [],
          showNoData: true
        }, () => {
          this.calculateTotal(); // 确保计算总价
        });
      }
    },
  
    onShow() {
      // 页面显示时刷新数据，确保编辑后的数据能及时更新
      const app = getApp();
      if (app.globalData.selectedProducts && app.globalData.selectedProducts.length > 0) {
        const normalizedProducts = this.normalizeProductData(app.globalData.selectedProducts);
        this.setData({
          product: normalizedProducts,
          originalProducts: [...normalizedProducts],
          showNoData: normalizedProducts.length === 0
        }, () => {
          this.calculateTotal();
        });
      }
    },
  
    // 标准化商品数据结构（用于展示）
    normalizeProductData(products) {
      console.log('===== 开始标准化商品数据（展示用） =====');
      console.log('标准化前的数据:', products);
      
      // 防止空数据
      if (!products || !Array.isArray(products)) {
        console.warn('传入的商品数据不是有效的数组，返回空数组');
        return [];
      }
      
      const normalized = products.map((item, index) => {
        // 确保item是对象
        if (!item || typeof item !== 'object') {
          console.warn(`第${index}个商品数据无效，使用默认值`);
          item = {};
        }
        
        console.log(`处理第${index}个商品，原始数据:`, item);
        
        // 解析productData（如果存在）
        let productData = {};
        if (item.productData && typeof item.productData === 'string') {
          try {
            productData = JSON.parse(item.productData);
            console.log(`解析productData成功:`, productData);
          } catch (e) {
            console.error(`解析productData失败:`, e);
            productData = {}; // 解析失败时使用空对象
          }
        } else if (typeof item.productData === 'object') {
          productData = item.productData || {};
        }
        
        // 确保所有商品都有基础字段，优先从productData获取，其次从item获取
        const baseItem = {
          id: item.id || `item-${Date.now()}-${index}`,
          productId: item.productId || item.id || `pid-${Date.now()}-${index}`, // 确保有productId
          // 确保商品名称和编码正确显示
          name: productData.productName || item.productName || item.name || '未命名商品',
          productName: productData.productName || item.productName || item.name || '未命名商品',
          productCode: productData.productCode || item.productCode || '未知编码',
          type: this.getProductType(item.type || productData.type) || 'singleProduct',
          price: Number(productData.unitPrice) || Number(item.unitPrice) || Number(item.price) || 0,
          number: Number(item.quantity) || Number(item.number) || 1,
          // 原始数据备份（用于提交时还原格式）
          originalData: item,
          originalProductData: productData,
          // 其他展示用字段
          unit: productData.unit || item.unit || '',
          specs: productData.specs || item.specs || '',
          brand: productData.brand || item.brand || '',
          tag: productData.tag || item.tag || '',
          remark: productData.remark || item.remark || '',
          // 选择相关字段
          checked: false
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
          case 'blankRow':
            baseItem.isEmpty = true;
            break;
        }
  
        console.log(`标准化后的数据(展示用):`, baseItem);
        return baseItem;
      });
      
      console.log('===== 商品数据标准化完成（展示用） =====');
      return normalized;
    },
  
    // 转换商品类型（根据预览页逻辑映射）
    getProductType(originalType) {
      const typeMap = {
        0: 'singleProduct',    // 普通商品
        1: 'combinationProduct', // 组合商品
        2: 'customProduct',    // 自定义商品
        3: 'feeName',          // 费用项
        4: 'blankRow',         // 空白行
        5: 'groupRow'          // 分组行
      };
      return typeMap[originalType] || originalType;
    },
  
    // 计算总价
    calculateTotal() {
      console.log('===== 开始计算总价 =====');
      console.log('当前商品列表:', this.data.product);
      
      // 防止空数据
      if (!this.data.product || !Array.isArray(this.data.product)) {
        console.warn('商品列表数据无效，总价设为0');
        this.setData({ totalAmount: '0.00' });
        return;
      }
      
      let total = 0;
      this.data.product.forEach((item, index) => {
        // 跳过无效项
        if (!item || typeof item !== 'object') {
          console.warn(`第${index}个商品数据无效，跳过计算`);
          return;
        }
        
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
        // 空白行和分组行不计算总价
        
        total += itemTotal;
      });
      
      const formattedTotal = total.toFixed(2);
      console.log(`总价计算完成: ${total} → 格式化后: ${formattedTotal}`);
      
      this.setData({
        totalAmount: formattedTotal
      });
      
      // 更新全局数据中的总金额
      const app = getApp();
      if (app.globalData.submitData?.quote) {
        app.globalData.submitData.quote.amountPrice = formattedTotal;
        app.globalData.submitData.quote.totalPrice = formattedTotal;
      }
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
      
      // 同步更新productGroupList（与提交格式保持一致）
      if (!app.globalData.submitData.productGroupList) {
        app.globalData.submitData.productGroupList = [];
      }
      if (app.globalData.submitData.productGroupList.length === 0) {
        app.globalData.submitData.productGroupList.push({
          quoteProductList: submitProducts
        });
      } else {
        app.globalData.submitData.productGroupList[0].quoteProductList = submitProducts;
      }
      
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
        
        // 同步恢复productGroupList
        if (app.globalData.submitData.productGroupList && app.globalData.submitData.productGroupList.length > 0) {
          app.globalData.submitData.productGroupList[0].quoteProductList = this.convertToSubmitFormat(this.data.originalProducts);
        }
      }
      
      // 恢复展示用数据
      app.globalData.selectedProducts = [...this.data.originalProducts];
      
      wx.navigateBack();
    },
  
    // 计算原始数据的总价（用于取消操作）
    calculateOriginalTotal() {
      // 防止空数据
      if (!this.data.originalProducts || !Array.isArray(this.data.originalProducts)) {
        return '0.00';
      }
      
      let total = 0;
      this.data.originalProducts.forEach(item => {
        if (!item || typeof item !== 'object') return;
        
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
      
      // 隐藏操作菜单
      this.setData({ ifShow: false });
      
      wx.navigateTo({
        url: `/quotePackage/pages/addNewProduct/addNewProduct?length=${this.data.product.length}`,
        events: {
          productAdded: (newProduct) => {
            console.log('从addNewProduct页面接收新商品:', newProduct);
            
            // 为新商品创建符合submitData格式的原始数据
            const newProductOriginal = {
              id: `new-${Date.now()}`,
              productId: newProduct.productId || `new-pid-${Date.now()}`, // 确保有productId
              productName: newProduct.name,
              quantity: newProduct.number,
              unitPrice: newProduct.price,
              productData: JSON.stringify({
                productName: newProduct.name,
                productCode: newProduct.productCode || '',
                unitPrice: newProduct.price,
                unit: newProduct.unit || '',
                specs: newProduct.specs || '',
                brand: newProduct.brand || '',
                tag: newProduct.tag || '',
                remark: newProduct.remark || '',
                type: this.reverseProductType(newProduct.type)
              }),
              type: this.reverseProductType(newProduct.type)
            };
            
            // 构建展示用商品数据
            const displayProduct = {
              ...newProduct,
              productId: newProduct.productId || `new-pid-${Date.now()}`, // 确保有productId
              productName: newProduct.name,
              productCode: newProduct.productCode || '未知编码',
              originalData: newProductOriginal,
              originalProductData: JSON.parse(newProductOriginal.productData),
              checked: false
            };
            
            const updatedProducts = [...this.data.product, displayProduct];
            this.setData({ 
              product: updatedProducts,
              showNoData: updatedProducts.length === 0
            }, () => {
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
        'feeName': 3,
        'blankRow': 4,
        'groupRow': 5
      };
      return typeMap[displayType] || 0;
    },
  
    // 跳转到设置表单样式
    goToSetFormStyle() {
      wx.navigateTo({
        url: '/quotePackage/pages/setFormStyle/setFormStyle',
      });
    },
  
    // 转换商品数据为submitData格式
    convertToSubmitFormat(products) {
      console.log('===== 开始转换商品数据为submitData格式 =====');
      
      if (!products || !Array.isArray(products)) {
        console.warn('传入的商品数据不是有效的数组，返回空数组');
        return [];
      }
      
      const submitProducts = products.map((item) => {
        if (!item || typeof item !== 'object') {
          console.warn(`商品数据项无效，跳过`);
          return null;
        }
  
        // 临时商品(customProduct)特殊处理
        if (item.type === 'customProduct') {
          return {
            // 完全匹配服务器期望的格式
            quantity: item.quantity || item.number || "1",
            unitPrice: item.unitPrice || (item.price ? item.price.toFixed(2) : "0.00"),
            remark: item.remark || "",
            productData: item.productData || {
              productCode: item.productCode || item.code || "",
              productName: item.productName || item.name || "",
              unitPrice: item.unitPrice || (item.price ? item.price.toFixed(2) : "0.00"),
              quantity: item.quantity || item.number || "1",
              remark: item.remark || "",
              type: 2, // 临时商品类型标识
              money: item.money || ((parseFloat(item.unitPrice || item.price || 0) * parseInt(item.quantity || item.number || 1)).toFixed(2))
            }
          };
        }
        
        // 普通商品处理逻辑保持不变
        const submitItem = item.originalData ? JSON.parse(JSON.stringify(item.originalData)) : {};
        
        submitItem.productId = item.productId || item.id;
        submitItem.quantity = item.number;
        submitItem.productName = item.name;
        
        let productData = item.originalProductData ? JSON.parse(JSON.stringify(item.originalProductData)) : {};
        productData.productName = item.name;
        productData.productCode = item.productCode;
        productData.unitPrice = item.price;
        productData.unit = item.unit;
        productData.specs = item.specs;
        productData.brand = item.brand;
        productData.tag = item.tag;
        productData.remark = item.remark;
        
        submitItem.productData = typeof item.originalData?.productData === 'string' 
          ? JSON.stringify(productData) 
          : productData;
        
        if (item.type === 'feeName') {
          submitItem.total = item.total;
          submitItem.unitPrice = item.price;
        }
        
        return submitItem;
      }).filter(Boolean);
      
      console.log('===== 商品数据转换为submitData格式完成 =====');
      return submitProducts;
    },
  
    // 跳转到选择商品字段
    goToChooseProductFields() {
      wx.navigateTo({
        url: '/quotePackage/pages/chooseProductFields/chooseProductFields',
      });
    },
    
    // 切换新增菜单显示状态
    setIfShow() {
      this.setData({
        ifShow: !this.data.ifShow
      });
    },
  
    // 向上移动商品
    changeUp(e) {
      const index = e.currentTarget.dataset.index;
      if (index <= 0) return;
  
      const product = [...this.data.product];
      [product[index - 1], product[index]] = [product[index], product[index - 1]];
      this.setData({ product }, () => this.calculateTotal());
    },
  
    // 向下移动商品
    changeDown(e) {
      const index = e.currentTarget.dataset.index;
      if (index >= this.data.product.length - 1) return;
  
      const product = [...this.data.product];
      [product[index + 1], product[index]] = [product[index], product[index + 1]];
      this.setData({ product }, () => this.calculateTotal());
    },
  
    // 跳转到编辑商品页面
    navigate(e) {
        const index = e.currentTarget.dataset.index;
        const item = this.data.product[index];
        console.log(`===== 点击编辑第${index}个商品 =====`);
        console.log('编辑的商品数据:', item);
        
        // 隐藏操作菜单
        this.setData({ ifShow: false });
        
        // 针对临时商品特殊处理，确保所有字段都被正确传递
        let navigateItem = item;
        if (item.type === 'customProduct') {
          navigateItem = {
            ...item,
            // 确保商品编码被正确提取
            productCode: item.productCode || item.originalProductData?.productCode || '',
            // 确保其他字段完整
            name: item.name || item.productName || '',
            price: item.price || 0,
            number: item.number || 1,
            remark: item.remark || ''
          };
        }
        
        wx.navigateTo({
          url: `/quotePackage/pages/editChoosed${this.getEditPageName(item.type)}/editChoosed${this.getEditPageName(item.type)}?index=${index}&item=${encodeURIComponent(JSON.stringify(navigateItem))}`
        });
      },
  
    // 获取编辑页面名称
    getEditPageName(type) {
      const pageMap = {
        singleProduct: 'SingleProduct',
        combinationProduct: 'CombinationProduct',
        customProduct: 'CuntomProduct',  // 注意: 这里保持了原拼写"CuntomProduct"与文件名称一致
        feeName: 'Fee',
        groupRow: 'GroupRow',
        blankRow: 'BlankRow'
      };
      return pageMap[type] || 'SingleProduct';
    },
  
    // 加空白行功能改为跳转到临时商品页面
    addBlankRow() {
      this.setData({ ifShow: false });
      // 跳转到添加临时商品页面
      wx.navigateTo({
        url: '/quotePackage/pages/addTemporaryProducts/addTemporaryProducts'
      });
    },
  
    // 搜索输入变化
    onSearchInput(e) {
      const value = e.detail.value.trim();
      this.setData({
        searchValue: value,
        page: 1
      }, () => {
        this.filterProducts();
      });
    },
  
    // 过滤商品
    filterProducts() {
      const { originalProducts, searchValue } = this.data;
      if (!searchValue) {
        // 无搜索条件，显示所有商品
        this.setData({
          product: [...originalProducts],
          showNoData: originalProducts.length === 0
        });
        return;
      }
  
      // 根据搜索值过滤商品
      const filtered = originalProducts.filter(item => {
        const searchStr = searchValue.toLowerCase();
        return (
          item.productName.toLowerCase().indexOf(searchStr) !== -1 ||
          item.productCode.toLowerCase().indexOf(searchStr) !== -1 ||
          (item.brand && item.brand.toLowerCase().indexOf(searchStr) !== -1) ||
          (item.tag && item.tag.toLowerCase().indexOf(searchStr) !== -1)
        );
      });
  
      this.setData({
        product: filtered,
        showNoData: filtered.length === 0
      });
    },
  
    // 切换选择状态
    toggleSelect(e) {
      const index = e.currentTarget.dataset.index;
      const { product } = this.data;
      
      // 更新单个商品的选择状态
      product[index].checked = !product[index].checked;
      this.setData({ product }, () => {
        this.updateSelectStatus();
      });
    },
  
    // 全选/取消全选
    toggleAllSelect() {
      const { isAllSelected, product } = this.data;
      const newState = !isAllSelected;
      
      // 更新所有商品的选择状态
      const updatedProducts = product.map(item => ({
        ...item,
        checked: newState
      }));
      
      this.setData({
        product: updatedProducts,
        isAllSelected: newState,
        selectedCount: newState ? updatedProducts.length : 0
      });
    },
  
    // 更新选择状态
    updateSelectStatus() {
      const { product } = this.data;
      const selectedCount = product.filter(item => item.checked).length;
      const isAllSelected = selectedCount > 0 && selectedCount === product.length;
      
      this.setData({
        selectedCount,
        isAllSelected
      });
    },
  
    // 切换编辑模式
    toggleEditMode() {
      this.setData({
        isEditMode: !this.data.isEditMode,
        // 退出编辑模式时取消所有选择
        isAllSelected: false,
        product: this.data.product.map(item => ({
          ...item,
          checked: false
        })),
        selectedCount: 0
      });
    },
  
    // 删除选中商品
    deleteSelected() {
      if (this.data.selectedCount === 0) {
        wx.showToast({
          title: '请选择要删除的商品',
          icon: 'none',
          duration: 2000
        });
        return;
      }
  
      wx.showModal({
        title: '确认删除',
        content: `确定要删除选中的${this.data.selectedCount}个商品吗？`,
        success: (res) => {
          if (res.confirm) {
            const remainingProducts = this.data.product.filter(item => !item.checked);
            this.setData({
              product: remainingProducts,
              originalProducts: [...remainingProducts],
              isEditMode: false,
              selectedCount: 0,
              isAllSelected: false,
              showNoData: remainingProducts.length === 0
            }, () => {
              this.calculateTotal();
              wx.showToast({
                title: `已删除${this.data.selectedCount}个商品`,
                icon: 'success',
                duration: 2000
              });
            });
          }
        }
      });
    },
  
    // 选择商品（仅在选择模式下）
    selectProduct(e) {
      if (!this.data.selectMode) return;
      
      const index = e.currentTarget.dataset.index;
      const { product } = this.data;
      
      // 更新选择状态
      product[index].checked = !product[index].checked;
      this.setData({ product }, () => {
        this.updateSelectStatus();
      });
    },
  
    // 确认选择商品（仅在选择模式下）
    confirmSelection() {
      if (!this.data.selectMode) return;
      
      const { product } = this.data;
      const selectedProducts = product.filter(item => item.checked);
      
      if (selectedProducts.length === 0) {
        wx.showToast({
          title: '请选择商品',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 将选择的商品添加到全局数据
      const app = getApp();
      if (!app.globalData.selectedProducts) {
        app.globalData.selectedProducts = [];
      }
      
      // 去重添加
      selectedProducts.forEach(newProduct => {
        const exists = app.globalData.selectedProducts.some(
          item => item.productId === newProduct.productId
        );
        if (!exists) {
          app.globalData.selectedProducts.push(newProduct);
        }
      });
      
      // 返回上一页
      wx.navigateBack();
    },
  
    // 下拉加载更多
    onReachBottom() {
      // 保持空实现，避免报错
    },
  
    // 重置筛选条件
    resetFilter() {
      this.setData({
        searchValue: '',
        page: 1
      }, () => {
        this.filterProducts();
      });
    }
  });
