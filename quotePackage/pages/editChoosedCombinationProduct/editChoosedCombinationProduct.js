Page({
    data: {
      formData: {
        name: '',
        productCode: '',
        number: 1,
        remark: '',
        products: [] // 每个商品项包含subtotal字段（子项总价）
      },
      index: -1, // 商品在列表中的索引
      totalPrice: 0 // 组合商品总价
    },
  
    onLoad(options) {
      const app = getApp();
      const index = parseInt(options.index || -1);
      let item = null;
      
      try {
        // 解析传递过来的商品数据
        item = options.item ? JSON.parse(decodeURIComponent(options.item)) : null;
      } catch (e) {
        console.error('解析商品数据失败:', e);
        wx.showToast({ title: '数据解析错误', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }
      
      if (index !== -1 && item && item.type === 'combinationProduct') {
        // 处理商品数据，计算每个子商品的小计
        const productsWithSubtotal = (item.products || []).map(product => {
          const quantity = parseInt(product.quantity || 1);
          const unitPrice = parseFloat(product.unitPrice || 0);
          return {
            ...product,
            quantity,
            unitPrice,
            subtotal: (quantity * unitPrice).toFixed(2) // 计算子项总价并保留2位小数
          };
        });
  
        // 计算组合商品总价
        const totalPrice = productsWithSubtotal.reduce((sum, product) => {
          return sum + parseFloat(product.subtotal);
        }, 0);
        
        this.setData({
          formData: { 
            ...item,
            products: productsWithSubtotal // 使用带小计的商品列表
          },
          index,
          totalPrice: totalPrice.toFixed(2)
        });
      } else {
        wx.showToast({ title: '无效的组合商品', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
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
      
      if (!formData.products || !formData.products[index]) return;
      
      // 增加数量并重新计算小计
      formData.products[index].quantity = (formData.products[index].quantity || 0) + 1;
      formData.products[index].subtotal = (
        formData.products[index].quantity * formData.products[index].unitPrice
      ).toFixed(2);
      
      this.setData({ formData }, () => {
        this.calculateTotal();
      });
    },
  
    // 减少组合内商品数量（最低为1）
    reduceProduct(e) {
      const { formData } = this.data;
      const index = e.currentTarget.dataset.index;
      
      if (!formData.products || !formData.products[index]) return;
      if (formData.products[index].quantity <= 1) return;
      
      // 减少数量并重新计算小计
      formData.products[index].quantity -= 1;
      formData.products[index].subtotal = (
        formData.products[index].quantity * formData.products[index].unitPrice
      ).toFixed(2);
      
      this.setData({ formData }, () => {
        this.calculateTotal();
      });
    },
  
    // 计算组合商品总价
    calculateTotal() {
      const { formData } = this.data;
      const total = formData.products.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal || 0);
      }, 0);
      
      this.setData({ 
        totalPrice: total.toFixed(2),
        // 更新组合商品单价为总价
        formData: {
          ...formData,
          price: total.toFixed(2)
        }
      });
    },
  
    // 取消编辑
    cancel() {
      wx.navigateBack();
    },
  
    // 确认保存
    confirm() {
      const app = getApp();
      const { index, formData, totalPrice } = this.data;
      
      if (index === -1) {
        wx.navigateBack();
        return;
      }
      
      // 构建更新后的商品数据
      const updatedProduct = {
        ...formData,
        price: parseFloat(totalPrice),
        totalPrice: parseFloat(totalPrice) * formData.number,
        type: 'combinationProduct'
      };
      
      // 更新全局选中商品列表
      app.globalData.selectedProducts[index] = updatedProduct;
      
      // 更新提交数据中的组合商品信息
      this.updateSubmitData(updatedProduct, index);
      
      // 刷新上一页数据
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        if (prevPage.refreshProductList) {
          prevPage.refreshProductList();
        } else if (prevPage.calculateTotal) {
          prevPage.setData({
            product: app.globalData.selectedProducts
          }, () => {
            prevPage.calculateTotal();
          });
        }
      }
      
      wx.showToast({
        title: '更新成功',
        icon: 'success',
        duration: 1500
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    },
  
    // 更新提交数据中的组合商品信息
    updateSubmitData(product, index) {
      const app = getApp();
      if (!app.globalData.submitData?.productGroupList) return;
      
      // 计算组合商品总价
      const totalPrice = parseFloat(this.data.totalPrice);
      
      // 更新提交数据中的对应字段
      app.globalData.submitData.productGroupList.forEach(group => {
        if (group.quoteProductList[index]) {
          group.quoteProductList[index].unitPrice = totalPrice;
          group.quoteProductList[index].calcPrice = totalPrice * product.number;
          group.quoteProductList[index].productData = JSON.stringify({
            ...product,
            type: 1, // 标记为组合商品（对应类型映射）
            products: product.products || []
          });
        }
      });
    },
  
    // 删除组合商品
    deleteCombination() {
      const app = getApp();
      const { index } = this.data;
      
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个组合商品吗？',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            // 从全局列表中删除
            app.globalData.selectedProducts.splice(index, 1);
            
            // 从提交数据中删除
            app.globalData.submitData.productGroupList.forEach(group => {
              if (group.quoteProductList.length > index) {
                group.quoteProductList.splice(index, 1);
              }
            });
            
            // 刷新上一页
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage) {
              if (prevPage.refreshProductList) {
                prevPage.refreshProductList();
              } else if (prevPage.calculateTotal) {
                prevPage.setData({
                  product: app.globalData.selectedProducts
                }, () => {
                  prevPage.calculateTotal();
                });
              }
            }
            
            wx.navigateBack();
          }
        }
      });
    }
  });