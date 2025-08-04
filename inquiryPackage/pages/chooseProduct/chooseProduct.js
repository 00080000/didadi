Page({
  data: {
    product: [], // 当前页面的商品列表
    totalAmount: 0.00, // 总金额
    fileName: '小喇叭公司询价单',
    ifShow: false
  },

  onLoad(options) {
    // 接收第一个页面传递的历史商品数据
    if (options && options.currentProducts) {
      try {
        // 解析并加载已添加的商品
        const historyProducts = JSON.parse(decodeURIComponent(options.currentProducts));
        this.setData({
          product: historyProducts
        }, () => {
          this.calculateTotal();
          console.log('加载的历史商品:', this.data.product);
        });
      } catch (err) {
        console.error('解析历史商品数据失败:', err);
      }
    }
    this.calculateTotal();
  },

  // 从商品选择页返回时更新数据
  onShow() {
    console.log('当前页面的商品数据:', this.data.product);
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
        // 合并新商品并更新
        this.setData({
          product: [...this.data.product, ...newProducts]
        }, () => {
          this.calculateTotal();
          console.log('新增商品后的数据:', this.data.product);
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
        quantity = 1;
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

  confirm() {
    if (this.data.product.length === 0) {
      return wx.showToast({
        title: '请至少选择一个商品',
        icon: 'none'
      });
    }

    const selected = this.data.product.map(item => ({
      ...item,
      price: Number(item.price) || 0,
      amount: item.type === 'combinationProduct' ? 1 : (Number(item.number) || 1)
    }));

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
  
  // 修改核心：直接传回当前页面所有商品
  passDataToPrevPage(selected) {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      // 直接将当前页面所有商品传递给主页面
      prevPage.setData({
        product: selected // 替换为当前页面的所有商品
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
