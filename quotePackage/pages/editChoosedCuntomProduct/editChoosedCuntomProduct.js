Page({
    data: {
      formData: {}, // 表单数据
      productIndex: -1, // 商品在列表中的索引
      // 临时商品所有字段都可编辑，包括商品编码
      editableFields: [
        { code: 'productCode', label: '商品编码', dataType: 'text', required: true },
        { code: 'name', label: '商品名称', dataType: 'text', required: true },
        { code: 'price', label: '单价', dataType: 'number', required: true },
        { code: 'number', label: '数量', dataType: 'number', required: true },
        { code: 'remark', label: '备注', dataType: 'textarea', required: false }
      ]
    },
  
    onLoad(options) {
      console.log('===== 编辑临时商品页面加载 =====');
      console.log('接收的参数:', options);
      
      // 获取上一页传递的商品数据和索引
      if (options.item && options.index !== undefined) {
        try {
          const parsedProduct = JSON.parse(decodeURIComponent(options.item));
          console.log('解析后的商品数据:', parsedProduct);
          
          // 确保所有字段都被正确填充
          this.setData({
            formData: {
              productCode: parsedProduct.productCode || parsedProduct.originalProductData?.productCode || '',
              name: parsedProduct.name || parsedProduct.productName || '',
              price: parsedProduct.price || 0,
              number: parsedProduct.number || parsedProduct.quantity || 1,
              remark: parsedProduct.remark || ''
            },
            productIndex: parseInt(options.index)
          });
          console.log('表单初始化数据:', this.data.formData);
        } catch (e) {
          console.error('解析商品数据失败:', e);
          wx.showToast({
            title: '数据加载失败',
            icon: 'none',
            duration: 2000
          });
          // 失败时返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        }
      } else {
        console.error('缺少商品数据或索引参数');
        wx.showToast({
          title: '参数错误',
          icon: 'none',
          duration: 2000
        });
        // 错误时返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      }
    },
  
    // 输入框变化处理
    onInputChange(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
  
      // 特殊处理数字类型
      if (field === 'price') {
        // 确保价格为有效的正数
        const priceValue = parseFloat(value);
        if (!isNaN(priceValue) && priceValue >= 0) {
          this.setData({ [`formData.${field}`]: priceValue });
        }
      } else if (field === 'number') {
        // 确保数量为有效的正整数
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1) {
          this.setData({ [`formData.${field}`]: numValue });
        }
      } else {
        // 文本类型直接赋值
        this.setData({ [`formData.${field}`]: value });
      }
    },
  
    // 保存编辑后的商品
    saveEditedProduct() {
      const { formData, productIndex } = this.data;
      const { productCode, name, price, number, remark } = formData;
  
      // 验证必填字段
      if (!productCode.trim()) {
        return wx.showToast({ title: '请输入商品编码', icon: 'none' });
      }
      if (!name.trim()) {
        return wx.showToast({ title: '请输入商品名称', icon: 'none' });
      }
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return wx.showToast({ title: '请输入有效的单价', icon: 'none' });
      }
      if (!number || number < 1) {
        return wx.showToast({ title: '请输入有效的数量', icon: 'none' });
      }
  
      // 格式化数据
      const unitPrice = parseFloat(price).toFixed(2);
      const quantity = parseInt(number);
      const money = (parseFloat(unitPrice) * quantity).toFixed(2);
  
      // 获取上一页并更新数据
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2]; // chooseProduct页面
  
      if (prevPage && productIndex !== -1) {
        // 更新商品列表
        const updatedProducts = [...prevPage.data.product];
        const originalProduct = updatedProducts[productIndex];
  
        // 更新商品数据（包括商品编码）
        updatedProducts[productIndex] = {
          ...originalProduct,
          name,
          productName: name,
          productCode: productCode, // 更新商品编码
          price: parseFloat(unitPrice),
          number: quantity,
          remark,
          unitPrice,
          quantity: quantity.toString(),
          // 更新原始数据中的productData
          originalProductData: {
            ...originalProduct.originalProductData,
            productCode: productCode, // 更新商品编码
            productName: name,
            unitPrice,
            quantity: quantity.toString(),
            remark,
            money
          },
          // 更新原始数据
          originalData: {
            ...originalProduct.originalData,
            productCode: productCode, // 更新商品编码
            productName: name,
            unitPrice: parseFloat(unitPrice),
            quantity: quantity,
            remark,
            money
          }
        };
  
        // 更新上一页数据
        prevPage.setData({
          product: updatedProducts,
          originalProducts: [...updatedProducts]
        }, () => {
          // 更新全局数据
          const app = getApp();
          app.globalData.selectedProducts = updatedProducts;
          
          // 重新计算总价
          prevPage.calculateTotal();
          
          // 返回上一页并提示成功
          wx.showToast({
            title: '商品更新成功',
            icon: 'success',
            duration: 1500
          });
          setTimeout(() => {
            wx.navigateBack({ delta: 1 });
          }, 1000);
        });
      }
    },

    // 删除商品
    deleteProduct() {
      const { productIndex } = this.data;
      if (productIndex === -1) {
        return wx.showToast({ title: '删除失败', icon: 'none' });
      }

      wx.showModal({
        title: '确认删除',
        content: '确定要删除该商品吗？',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            // 获取上一页并更新数据
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2]; // chooseProduct页面
            
            if (prevPage) {
              // 删除商品
              const updatedProducts = [...prevPage.data.product];
              updatedProducts.splice(productIndex, 1);
              
              // 更新上一页数据
              prevPage.setData({
                product: updatedProducts,
                originalProducts: [...updatedProducts]
              }, () => {
                // 更新全局数据
                const app = getApp();
                app.globalData.selectedProducts = updatedProducts;
                
                // 重新计算总价
                prevPage.calculateTotal();
                
                // 返回上一页并提示成功
                wx.showToast({
                  title: '商品已删除',
                  icon: 'success',
                  duration: 1500
                });
                setTimeout(() => {
                  wx.navigateBack({ delta: 1 });
                }, 1000);
              });
            }
          }
        }
      });
    },
  
    // 取消编辑
    cancel() {
      wx.navigateBack();
    }
  })
