Page({
    data: {
      formData: {
        productName: '',
        productCode: '',
        price: '',
        number: '',
        unit: '',
        specs: '',
        brand: '',
        tag: '',
        produceCompany: '',
        remark: ''
      },
      index: -1,
      productId: '',
      editableFields: [] // 用于动态显示可编辑字段
    },
  
    onLoad(options) {
      if (options && options.index !== undefined) {
        this.setData({
          index: parseInt(options.index)
        }, () => {
          this.initFormData();
          this.loadEditableFields(); // 加载可编辑字段配置
        });
      }
    },
  
    // 初始化表单数据
    initFormData() {
      const app = getApp();
      let targetProduct = null;
      const { index } = this.data;
      
      // 从productGroupList获取商品数据（优先）
      if (app.globalData.submitData?.productGroupList?.length) {
        app.globalData.submitData.productGroupList.some(group => {
          if (group.quoteProductList?.[index]) {
            targetProduct = group.quoteProductList[index];
            return true;
          }
          return false;
        });
      }
      
      // 从selectedProducts获取商品数据（备用）
      if (!targetProduct) {
        const products = app.globalData.selectedProducts || [];
        targetProduct = products[index];
      }
      
      if (targetProduct) {
        // 解析productData
        let productData = targetProduct.productData || {};
        if (typeof productData === 'string') {
          try {
            productData = JSON.parse(productData);
          } catch (e) {
            console.error('解析productData失败:', e);
            productData = {};
          }
        }
  
        // 统一变量名，确保数据正确映射
        this.setData({
          productId: targetProduct.productId,
          formData: {
            productName: targetProduct.name || productData.productName || '',
            productCode: targetProduct.productCode || productData.productCode || '',
            price: targetProduct.price !== undefined ? String(targetProduct.price) : String(productData.unitPrice || ''),
            number: targetProduct.number !== undefined ? String(targetProduct.number) : String(productData.quantity || ''),
            unit: targetProduct.unit || productData.unit || '',
            specs: targetProduct.specs || productData.specs || '',
            brand: targetProduct.brand || productData.brand || '',
            tag: targetProduct.tag || productData.tag || '',
            produceCompany: targetProduct.produceCompany || productData.produceCompany || '',
            remark: targetProduct.remark || productData.remark || ''
          }
        });
        console.log('productName:',targetProduct);
      }
    },
  
    // 加载可编辑字段配置
    loadEditableFields() {
      const app = getApp();
      const { productFieldList } = app.globalData.submitData || {};
      
      // 过滤出需要在编辑页面显示的可编辑字段
      if (productFieldList && productFieldList.length) {
        const editableFields = productFieldList
          .filter(field => !['productName', 'productCode', 'quantity', 'unitPrice', 'money'].includes(field.productFieldCode))
          .map(field => ({
            code: field.productFieldCode,
            label: field.productFieldName,
            dataType: field.productFieldCode === 'remark' ? 'textarea' : 'text'
          }));
        
        this.setData({ editableFields });
      }
    },
  
    // 输入框变化处理
    onInputChange(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      
      // 特殊处理数字字段
      let processedValue = value;
      if (field === 'number') {
        processedValue = value.toString().replace(/[^\d]/g, ''); // 只允许数字
      } else if (field === 'price') {
        processedValue = value.toString().replace(/[^\d.]/g, ''); // 允许数字和小数点
        // 确保只有一个小数点
        const dotIndex = processedValue.indexOf('.');
        if (dotIndex !== -1 && processedValue.lastIndexOf('.') !== dotIndex) {
          processedValue = processedValue.substring(0, processedValue.lastIndexOf('.'));
        }
      }
      
      this.setData({
        [`formData.${field}`]: processedValue
      });
    },
  
    // 确认保存
    confirm() {
      const app = getApp();
      const { index } = this.data;
      if (index === -1 || !app.globalData.submitData) {
        wx.navigateBack();
        return;
      }
  
      const { formData } = this.data;
      const price = parseFloat(formData.price || 0);
      const quantity = parseInt(formData.number || 0);
      const calcPrice = price * quantity;
  
      // 1. 更新selectedProducts（用于展示）
      if (app.globalData.selectedProducts) {
        const products = [...app.globalData.selectedProducts];
        if (products[index]) {
          products[index] = {
            ...products[index],
            ...formData,
            unitPrice: price,
            quantity: quantity,
            calcPrice: calcPrice
          };
          app.globalData.selectedProducts = products;
        }
      }
  
      // 2. 更新productGroupList（用于提交）
      if (app.globalData.submitData.productGroupList) {
        app.globalData.submitData.productGroupList.forEach(group => {
          if (group.quoteProductList && group.quoteProductList[index]) {
            // 处理productData
            let originalProductData = group.quoteProductList[index].productData || '{}';
            if (typeof originalProductData === 'string') {
              try {
                originalProductData = JSON.parse(originalProductData);
              } catch (e) {
                originalProductData = {};
              }
            }
  
            // 更新productData
            const updatedProductData = {
              ...originalProductData,
              productName: formData.productName,
              productCode: formData.productCode,
              unitPrice: formData.price,
              quantity: formData.number,
              unit: formData.unit,
              specs: formData.specs,
              brand: formData.brand,
              tag: formData.tag,
              produceCompany: formData.produceCompany,
              remark: formData.remark
            };
  
            // 更新商品信息
            group.quoteProductList[index] = {
              ...group.quoteProductList[index],
              productName: formData.productName,
              productCode: formData.productCode,
              quantity: quantity,
              unitPrice: price,
              calcPrice: calcPrice,
              productData: JSON.stringify(updatedProductData)
            };
          }
        });
      }
  
      // 3. 更新总金额
      this.updateTotalPrice(app.globalData.submitData);
  
      // 4. 返回上一页并刷新
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.refreshProductList) {
        prevPage.refreshProductList(); // 调用上一页的刷新方法
      }
      wx.navigateBack();
    },

    // 删除商品
    deleteProduct() {
      const { index } = this.data;
      if (index === -1) {
        return wx.showToast({ title: '删除失败', icon: 'none' });
      }

      wx.showModal({
        title: '确认删除',
        content: '确定要删除该商品吗？',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            const app = getApp();
            
            // 1. 更新selectedProducts
            if (app.globalData.selectedProducts) {
              const products = [...app.globalData.selectedProducts];
              products.splice(index, 1);
              app.globalData.selectedProducts = products;
            }

            // 2. 更新productGroupList
            if (app.globalData.submitData?.productGroupList) {
              app.globalData.submitData.productGroupList.forEach(group => {
                if (group.quoteProductList) {
                  group.quoteProductList.splice(index, 1);
                }
              });
            }

            // 3. 更新总金额
            this.updateTotalPrice(app.globalData.submitData);

            // 4. 通知上一页刷新
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage && prevPage.refreshProductList) {
              prevPage.refreshProductList();
            }

            // 5. 返回上一页并提示
            wx.showToast({
              title: '商品已删除',
              icon: 'success',
              duration: 1500
            });
            setTimeout(() => {
              wx.navigateBack({ delta: 1 });
            }, 1000);
          }
        }
      });
    },
  
    // 更新总金额
    updateTotalPrice(submitData) {
      let total = 0;
      if (submitData.productGroupList && submitData.productGroupList.length) {
        submitData.productGroupList.forEach(group => {
          let groupTotal = 0;
          if (group.quoteProductList && group.quoteProductList.length) {
            group.quoteProductList.forEach(product => {
              groupTotal += parseFloat(product.calcPrice || 0);
            });
          }
          group.subtotal = groupTotal;
          total += groupTotal;
        });
      }
      
      // 更新报价单总金额
      if (submitData.quote) {
        submitData.quote.amountPrice = total.toFixed(2);
        submitData.quote.totalPrice = total.toFixed(2);
      }
    },
  
    // 取消编辑
    cancel() {
      wx.navigateBack();
    }
  });
