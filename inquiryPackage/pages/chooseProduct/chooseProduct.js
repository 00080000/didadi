Page({
  data: {
    product: [], // 当前页面的商品列表
    totalAmount: 0.00, // 总金额
    fileName: '小喇叭公司询价单',
    ifShow: false,
    selectedFields: [] // 选中的商品字段
  },

  onLoad(options) {
    // 初始化全局数据
    const app = getApp();
    if (!app.globalData.selectedFields) {
      app.globalData.selectedFields = {
        all: ['productName', 'unitPrice'] // 默认字段
      };
    } else {
      this.setData({
        selectedFields: app.globalData.selectedFields.all
      });
    }

    // 接收传递的历史商品数据
    if (options && options.currentProducts) {
      try {
        // 解析并加载已添加的商品
        const historyProducts = JSON.parse(decodeURIComponent(options.currentProducts));
        // 过滤历史商品数据，只保留选中的字段
        const filteredProducts = this.filterProductFields(historyProducts);
        this.setData({
          product: filteredProducts
        }, () => {
          this.calculateTotal();
        });
      } catch (err) {
        console.error('解析历史商品数据失败:', err);
      }
    }
    this.calculateTotal();
  },

  // 更新商品显示字段
  updateProductFields(selectedFields) {
    this.setData({
      selectedFields: selectedFields
    }, () => {
      // 过滤现有商品数据
      const filteredProducts = this.filterProductFields(this.data.product);
      this.setData({
        product: filteredProducts
      });
    });
  },

  // 过滤商品数据，只保留选中的字段
  filterProductFields(products) {
    if (!products || !this.data.selectedFields.length) return products;

    return products.map(product => {
      // 创建新对象，只包含选中的字段
      const filteredProduct = {};
      
      // 保留基础标识字段
      ['name','id', 'type', 'number', 'price', 'select'].forEach(field => {
        if (product[field] !== undefined) {
          filteredProduct[field] = product[field];
        }
      });
      
      // 添加选中的业务字段
      this.data.selectedFields.forEach(field => {
        if (product[field] !== undefined) {
          filteredProduct[field] = product[field];
        }
      });
      
      // 处理组合商品的子商品
      if (product.products && product.products.length > 0) {
        filteredProduct.products = product.products.map(subProduct => {
          const filteredSub = {};
          this.data.selectedFields.forEach(field => {
            if (subProduct[field] !== undefined) {
              filteredSub[field] = subProduct[field];
            }
          });
          // 保留子商品的基础字段
          ['id', 'number', 'price'].forEach(field => {
            if (subProduct[field] !== undefined) {
              filteredSub[field] = subProduct[field];
            }
          });
          return filteredSub;
        });
      }
      
      return filteredProduct;
    });
  },

  // 从商品选择页返回时更新数据
  onShow() {
    const pages = getCurrentPages();
    const addProductPage = pages.find(page => page.route === 'quotePackage/pages/addNewProduct/addNewProduct');
    
    if (addProductPage && addProductPage.data.selectedProducts) {
      // 去重处理：排除已存在的商品
      const newProducts = addProductPage.data.selectedProducts.filter(newItem => {
        return !this.data.product.some(existItem => 
          existItem.id === newItem.id && existItem.type === newItem.type
        );
      });

      if (newProducts.length > 0) {
        // 过滤新商品数据，只保留选中的字段
        const filteredNewProducts = this.filterProductFields(newProducts);
        
        // 合并新商品并更新
        this.setData({
          product: [...this.data.product, ...filteredNewProducts]
        }, () => {
          this.calculateTotal();
        });
      }

      // 清空选择页的已选数据，避免重复添加
      addProductPage.setData({ selectedProducts: [] });
    }

    this.calculateTotal();
  },

  // 计算总金额
  calculateTotal() {
    let totalAmount = 0;
    
    this.data.product.forEach(item => {
      const price = Number(item.price) || 0;
      let quantity = 1;

      if (item.type === "singleProduct" || item.type === 'customProduct') {
        quantity = Number(item.number) || 1;
      } else if (item.type === "combinationProduct") {
        quantity = Number(item.number) || 1;
      }

      totalAmount += Number((price * quantity).toFixed(4));
    });

    this.setData({
      totalAmount: totalAmount.toFixed(2)
    });
  },

  goToSetFormStyle() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/setFormStyle/setFormStyle',
    });
  },

  goToChooseProductFields() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseProductFields/chooseProductFields',
    });
  },

  goToAddProduct() {
    // 携带当前页面的商品数据到选择页（用于去重）
    const currentProducts = encodeURIComponent(JSON.stringify(this.data.product));
    wx.navigateTo({
      url: `/inquiryPackage/pages/addNewProduct/addNewProduct?currentProducts=${currentProducts}`,
    });
  },

  goToAddTemporaryProduct(){
    wx.navigateTo({
      url: `/inquiryPackage/pages/addTemporaryProducts/addTemporaryProducts`,
    });
  },

  setIfShow() {
    this.setData({
      ifShow: !this.data.ifShow
    });
  },

  // 向上调整商品顺序
  changeUp(e) {
    const index = e.currentTarget.dataset.index;
    if (index <= 0) return;
    
    const product = [...this.data.product];
    [product[index - 1], product[index]] = [product[index], product[index - 1]];
    
    this.setData({ product });
  },

  // 向下调整商品顺序
  changeDown(e) {
    const index = e.currentTarget.dataset.index;
    if (index >= this.data.product.length - 1) return;
    
    const product = [...this.data.product];
    [product[index + 1], product[index]] = [product[index], product[index + 1]];
    
    this.setData({ product });
  },

  // 跳转到编辑页
  navigate(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.product[index];
    
    // 对商品数据进行编码，确保能正确传递
    const encodedItem = encodeURIComponent(JSON.stringify(item));
    
    if (item.type === "singleProduct") {
      wx.navigateTo({
        url: `/inquiryPackage/pages/editChoosedSingleProduct/editChoosedSingleProduct?index=${index}&item=${encodedItem}`,
      });
    } else if (item.type === "combinationProduct") {
      wx.navigateTo({
        url: `/inquiryPackage/pages/editChoosedCombinationProduct/editChoosedCombinationProduct?index=${index}&item=${encodedItem}`,
      });
    } else if (item.type === "customProduct") {
      wx.navigateTo({
        url: `/inquiryPackage/pages/editChoosedCuntomProduct/editChoosedCuntomProduct?index=${index}&item=${encodedItem}`,
      });
    } else if (item.type === "feeName") {
      wx.navigateTo({
        url: `/inquiryPackage/pages/editFee/editFee?index=${index}&item=${encodedItem}`,
      });
    }
  },

  // 删除商品
  deleteProduct(e) {
    const index = e.currentTarget.dataset.index;
    const product = [...this.data.product];
    product.splice(index, 1);
    
    this.setData({ product }, () => {
      this.calculateTotal();
    });
  },

  cancel() {
    wx.navigateBack();
  },

  confirm() {
    if (this.data.product.length === 0) {
      return wx.showToast({
        title: '请至少选择一个商品',
        icon: 'none'
      });
    }

    // 只返回选中的字段
    const selected = this.filterProductFields(this.data.product).map(item => ({
      ...item,
      price: Number(item.price) || 0,
      amount: item.type === 'combinationProduct' ? 1 : (Number(item.number) || 1)
    }));

    const zeroPriceItems = selected.filter(item => item.price === 0);
    if (zeroPriceItems.length > 0) {
      wx.showModal({
        title: '提示',
        content: `以下商品价格为0：\n${zeroPriceItems.map(item => item.productName || item.name).join('、')}`,
        confirmText: '继续',
        cancelText: '修改',
        success: (res) => {
          if (res.confirm) {
            this.passDataToPrevPage(selected);
          }
        }
      });
    } else {
      this.passDataToPrevPage(selected);
    }
  },
  
  // 传回过滤后的商品数据（只包含选中的参数）
  passDataToPrevPage(selected) {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      // 只传递选中的字段
      prevPage.setData({
        product: selected
      }, () => {
        // 触发上一页的计算方法更新总金额
        if (typeof prevPage.calculateTotal === 'function') {
          prevPage.calculateTotal();
        }
        wx.navigateBack();
      });
    }
  }
});
