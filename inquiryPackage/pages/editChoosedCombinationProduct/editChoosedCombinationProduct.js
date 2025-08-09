Page({
  data: {
    formData: {
      name: '',
      productCode: '',
      number: 1,
      remark: '',
      products: [] // 子商品列表（包含subtotal字段）
    },
    index: -1, // 商品在列表中的索引
    totalPrice: 0 // 组合商品总价
  },

  onLoad(options) {
    const index = parseInt(options.index || -1);
    let item = null;
    
    try {
      // 解析传递过来的商品数据
      item = options.item ? JSON.parse(decodeURIComponent(options.item)) : null;
    } catch (e) {
      console.error('解析商品数据失败:', e);
      wx.showToast({ title: '数据解析错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    
    if (index === -1 || !item) {
      wx.showToast({ title: '无效的商品数据', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 修复1：兼容多种商品组类型（组合商品/商品组）
    const validTypes = ['combinationProduct', 'productGroup'];
    if (!validTypes.includes(item.type)) {
      wx.showToast({ title: '请选择组合商品或商品组', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 修复2：从可能的嵌套字段中获取子商品（优先取item.products，再取item.productData.products）
    let subProducts = item.products || (item.productData ? item.productData.products : []);
    if (!Array.isArray(subProducts)) subProducts = [];

    // 处理子商品数据，计算小计
    const productsWithSubtotal = subProducts.map(product => {
      const quantity = parseInt(product.quantity || 1);
      const unitPrice = parseFloat(product.unitPrice || product.price || 0); // 兼容price字段
      return {
        ...product,
        quantity,
        unitPrice,
        subtotal: (quantity * unitPrice).toFixed(2)
      };
    });

    // 计算组合商品总价
    const totalPrice = productsWithSubtotal.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);
    
    // 修复3：整合完整的商品数据（包含名称、编码等基础信息）
    this.setData({
      formData: {
        name: item.name || item.productName || '', // 兼容不同字段名
        productCode: item.productCode || '',
        number: item.number || 1,
        remark: item.remark || '',
        products: productsWithSubtotal,
        type: item.type // 保留原始类型
      },
      index,
      totalPrice: totalPrice.toFixed(2)
    });
  },

  // 输入框变化事件
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { formData } = this.data;
    formData[field] = e.detail.value;
    this.setData({ formData });
  },

  // 增加组合内商品数量
  addProduct(e) {
    const { formData } = this.data;
    const index = e.currentTarget.dataset.index;
    if (!formData.products?.[index]) return;
    
    formData.products[index].quantity += 1;
    formData.products[index].subtotal = (
      formData.products[index].quantity * formData.products[index].unitPrice
    ).toFixed(2);
    
    this.setData({ formData }, () => this.calculateTotal());
  },

  // 减少组合内商品数量（最低为1）
  reduceProduct(e) {
    const { formData } = this.data;
    const index = e.currentTarget.dataset.index;
    if (!formData.products?.[index] || formData.products[index].quantity <= 1) return;
    
    formData.products[index].quantity -= 1;
    formData.products[index].subtotal = (
      formData.products[index].quantity * formData.products[index].unitPrice
    ).toFixed(2);
    
    this.setData({ formData }, () => this.calculateTotal());
  },

  // 计算组合商品总价
  calculateTotal() {
    const total = this.data.formData.products.reduce(
      (sum, item) => sum + parseFloat(item.subtotal || 0), 0
    );
    
    this.setData({ 
      totalPrice: total.toFixed(2),
      formData: { ...this.data.formData, price: total.toFixed(2) }
    });
  },

  // 取消编辑
  cancel() {
    wx.navigateBack();
  },

  // 确认保存
  confirm() {
    const { index, formData, totalPrice } = this.data;
    if (index === -1) {
      wx.navigateBack();
      return;
    }
    
    // 构建更新后的商品数据
    const updatedProduct = {
      ...formData,
      price: parseFloat(totalPrice),
      totalPrice: parseFloat(totalPrice) * formData.number
    };
    
    // 更新上一页的商品列表
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage && prevPage.data.product) {
      const newProductList = [...prevPage.data.product];
      newProductList[index] = updatedProduct; // 直接更新上一页的商品数据
      prevPage.setData({ product: newProductList }, () => {
        prevPage.calculateTotal(); // 触发上一页重新计算总价
      });
    }
    
    wx.showToast({ title: '更新成功', icon: 'success', duration: 1500 });
    setTimeout(() => wx.navigateBack(), 1500);
  },

  // 删除组合商品
  deleteCombination() {
    const { index } = this.data;
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个组合商品吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm && prevPage && prevPage.data.product) {
          const newProductList = [...prevPage.data.product];
          newProductList.splice(index, 1); // 从列表中删除
          prevPage.setData({ product: newProductList }, () => {
            prevPage.calculateTotal(); // 重新计算总价
          });
          wx.navigateBack();
        }
      }
    });
  }
});