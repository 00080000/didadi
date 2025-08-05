// quotePackage/pages/editChoosedSingleProduct/editChoosedSingleProduct.js
Page({
    data: {
      index: -1,          // 当前商品索引
      item: null,         // 当前商品数据
      editableFields: [], // 可编辑的字段列表
      formData: {}        // 表单数据
    },
  
    onLoad(options) {
      if (options.index !== undefined && options.item) {
        const index = parseInt(options.index);
        const item = JSON.parse(decodeURIComponent(options.item));
        
        // 初始化表单数据
        const formData = {
          price: item.price || 0,
          number: item.number || 1,
          remark: item.remark || '',
          // 初始化其他可选字段
          unit: item.unit || '',
          specs: item.specs || '',
          brand: item.brand || '',
          tag: item.tag || '',
          produceCompany: item.produceCompany || ''
        };
        
        this.setData({
          index,
          item,
          formData
        }, () => {
          this.loadEditableFields();
        });
      } else {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      }
    },
  
    // 加载可编辑的字段列表（从dataJson中获取）
    loadEditableFields() {
      const app = getApp();
      if (app.globalData.submitData && app.globalData.submitData.quote && app.globalData.submitData.quote.dataJson) {
        try {
          const tableColumns = JSON.parse(app.globalData.submitData.quote.dataJson);
          const editableFields = [];
          
          // 过滤出可编辑的可选字段（排除固定字段和必选不可编辑字段）
          for (let i = 0; i < tableColumns.length; i++) {
            const column = tableColumns[i];
            // 排除固定字段和核心不可编辑字段
            if (column.code && !['productName', 'productCode', 'quantity', 'money', '序号'].includes(column.code)) {
              // 检查是否是单价字段，只保留一个
              if (column.code === 'unitPrice') {
                // 确保单价只添加一次
                let hasPriceField = false;
                for (let j = 0; j < editableFields.length; j++) {
                  if (editableFields[j].code === 'unitPrice' || editableFields[j].code === 'price') {
                    hasPriceField = true;
                    break;
                  }
                }
                if (!hasPriceField) {
                  editableFields.push({
                    code: 'price', // 统一使用price作为键名，避免混淆
                    label: column.label,
                    dataType: this.getDataType(column.code)
                  });
                }
              } else if (!['price', 'number', 'remark'].includes(column.code)) {
                // 添加其他可选字段（排除已单独处理的字段）
                editableFields.push({
                  code: column.code,
                  label: column.label,
                  dataType: this.getDataType(column.code)
                });
              }
            }
          }
          
          this.setData({ editableFields });
        } catch (e) {
          console.error('解析dataJson失败:', e);
        }
      }
    },
  
    // 获取字段的数据类型
    getDataType(code) {
      const typeMap = {
        'price': 'number',
        'unitPrice': 'number',
        'unit': 'text',
        'specs': 'text',
        'brand': 'text',
        'tag': 'text',
        'produceCompany': 'text',
        'remark': 'textarea'
      };
      return typeMap[code] || 'text';
    },
  
    // 输入框变化事件
    onInputChange(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      
      // 处理数字类型字段
      if (field === 'price' || field === 'number') {
        // 确保是有效数字
        const numValue = value === '' ? 0 : parseFloat(value);
        this.setData({
          [`formData.${field}`]: isNaN(numValue) ? 0 : numValue
        });
      } else {
        this.setData({
          [`formData.${field}`]: value
        });
      }
    },
  
    // 取消编辑
    cancel() {
      wx.navigateBack();
    },
  
    // 保存编辑
    confirm() {
      const app = getApp();
      if (!app.globalData.selectedProducts || !app.globalData.submitData) {
        wx.navigateBack();
        return;
      }
  
      // 1. 更新展示用的商品数据
      const products = [...app.globalData.selectedProducts];
      if (products[this.data.index]) {
        const updatedItem = {
          ...products[this.data.index],
          ...this.data.formData,
          // 确保price和unitPrice同步
          unitPrice: this.data.formData.price
        };
        products[this.data.index] = updatedItem;
        app.globalData.selectedProducts = products;
      }
  
      // 2. 更新submitData中的商品数据
      if (app.globalData.submitData.products) {
        const submitProducts = [...app.globalData.submitData.products];
        if (submitProducts[this.data.index]) {
          // 更新原始数据结构
          const updatedSubmitItem = {
            ...submitProducts[this.data.index],
            quantity: this.data.formData.number,
            unitPrice: this.data.formData.price,
            productData: typeof submitProducts[this.data.index].productData === 'string' 
              ? JSON.stringify({
                  ...JSON.parse(submitProducts[this.data.index].productData),
                  unitPrice: this.data.formData.price,
                  unit: this.data.formData.unit,
                  specs: this.data.formData.specs,
                  brand: this.data.formData.brand,
                  tag: this.data.formData.tag,
                  produceCompany: this.data.formData.produceCompany,
                  remark: this.data.formData.remark
                })
              : {
                  ...submitProducts[this.data.index].productData,
                  unitPrice: this.data.formData.price,
                  unit: this.data.formData.unit,
                  specs: this.data.formData.specs,
                  brand: this.data.formData.brand,
                  tag: this.data.formData.tag,
                  produceCompany: this.data.formData.produceCompany,
                  remark: this.data.formData.remark
                }
          };
          submitProducts[this.data.index] = updatedSubmitItem;
          app.globalData.submitData.products = submitProducts;
        }
      }
  
      // 3. 返回上一页
      wx.navigateBack();
    }
  });
      