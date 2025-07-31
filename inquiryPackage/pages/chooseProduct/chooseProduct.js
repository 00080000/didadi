Page({
  data: {
    product: [], // 当前页面的商品列表
    totalAmount: 0.00, // 总金额
    fileName: '小喇叭公司询价单',
    ifShow: false
  },

  onLoad() {
    this.calculateTotal();
  },

  // 从商品选择页返回时更新数据
  onShow() {
    const pages = getCurrentPages();
    const addProductPage = pages.find(page => page.route === 'quotePackage/pages/addNewProduct/addNewProduct');
    
    if (addProductPage && addProductPage.data.selectedProducts) {
      // 去重处理
      const newProducts = addProductPage.data.selectedProducts.filter(newItem => {
        return !this.data.product.some(existItem => 
          existItem.id === newItem.id && existItem.type === newItem.type
        );
      });

      if (newProducts.length > 0) {
        this.setData({
          product: [...this.data.product, ...newProducts]
        }, () => {
          this.calculateTotal();
        });
      }

      // 清空选择页的已选数据
      addProductPage.setData({ selectedProducts: [] });
    }

    this.calculateTotal();
  },

  // 核心修复：正确计算当前页面商品的总金额
  calculateTotal() {
    let totalAmount = 0;
    
    // 遍历当前页面的product数组（而非其他页面的数组）
    this.data.product.forEach(item => {
      // 确保价格和数量为数字类型
      const price = Number(item.price) || 0;
      let quantity = 1;

      // 根据商品类型计算数量
      if (item.type === "singleProduct" || item.type === 'customProduct') {
        quantity = Number(item.number) || 1; // 单商品/临时商品取number
      } else if (item.type === "combinationProduct") {
        quantity = 1; // 组合商品固定为1
      }

      // 累加总金额（保留4位小数避免精度问题）
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
    wx.navigateTo({
      url: '/quotePackage/pages/addNewProduct/addNewProduct',
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
    
    if (item.type === "singleProduct") {
      wx.navigateTo({
        url: `/inquiryPackage/pages/editChoosedSingleProduct/editChoosedSingleProduct?index=${index}`,
      });
    } else if (item.type === "combinationProduct") {
      wx.navigateTo({
        url: `/inquiryPackage/pages/editChoosedCombinationProduct/editChoosedCombinationProduct?index=${index}`,
      });
    } else if (item.type === "customProduct") {
      wx.navigateTo({
        url: `/inquiryPackage/pages/editChoosedCuntomProduct/editChoosedCuntomProduct?index=${index}`,
      });
    } else if (item.type === "feeName") {
      wx.navigateTo({
        url: `/inquiryPackage/pages/editFee/editFee?index=${index}`,
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

  // 修复确认按钮逻辑：使用当前页面的product数组
  confirm() {
    // 1. 验证商品是否为空
    if (this.data.product.length === 0) {
      return wx.showToast({
        title: '请至少选择一个商品',
        icon: 'none'
      });
    }

    // 2. 处理当前页面的商品数据（统一格式）
    const selected = this.data.product.map(item => ({
      ...item,
      price: Number(item.price) || 0, // 确保价格为数字
      amount: item.type === 'combinationProduct' ? 1 : (Number(item.number) || 1)
    }));

    // 3. 检查是否有0价格商品
    const zeroPriceItems = selected.filter(item => item.price === 0);
    if (zeroPriceItems.length > 0) {
      wx.showModal({
        title: '提示',
        content: `以下商品价格为0：\n${zeroPriceItems.map(item => item.name).join('、')}`,
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
  
  // 传递数据到上一页
  passDataToPrevPage(selected) {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      // 容错处理：如果上一页没有product数组则初始化
      const prevProducts = prevPage.data.product || [];
      prevPage.setData({
        product: [...prevProducts, ...selected]
      }, () => {
        // 触发上一页的计算方法
        if (typeof prevPage.calculateTotal === 'function') {
          prevPage.calculateTotal();
        }
        wx.navigateBack();
      });
    }
  }
});