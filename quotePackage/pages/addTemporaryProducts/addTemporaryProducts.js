Page({
    data: {
      // 临时商品的初始数据
      temporaryProduct: {
        name: '',         // 商品名称（必填）
        code: '',         // 商品编码（可编辑，必填）
        price: '',        // 单价（必填）
        number: 1,        // 数量，默认为1（必填）
        remark: '',       // 备注（必填）
        type: 'customProduct', // 标记为自定义商品类型
        id: '' // 临时ID
      }
    },

    onLoad() {
      // 生成临时ID
      const tempId = `temp-${Date.now()}`;
      
      // 页面加载时生成建议商品编码，但允许用户修改
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      // 生成类似"202508061234"的编码
      const productCode = `${year}${month}${day}${random}`;
      
      this.setData({
        'temporaryProduct.code': productCode,
        'temporaryProduct.id': tempId
      });
    },

    // 输入框内容变化时更新数据
    onInputChange(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      
      // 特殊处理数字类型的字段
      if (field === 'price') {
        // 价格处理：允许用户自由输入，提交时再格式化
        this.setData({
          [`temporaryProduct.${field}`] : value
        });
      } else if (field === 'number') {
        // 数量处理：确保为正整数
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1) {
          this.setData({
            [`temporaryProduct.${field}`] : numValue
          });
        }
      } else {
        this.setData({
          [`temporaryProduct.${field}`] : value
        });
      }
    },

    // 保存临时商品
    saveTemporaryProduct() {
      const { name, price, code, number, remark, id, type } = this.data.temporaryProduct;
      
      // 验证所有必填字段
      if (!name.trim()) {
        return wx.showToast({ title: '请输入商品名称', icon: 'none' });
      }
      
      if (!code.trim()) {
        return wx.showToast({ title: '请输入商品编码', icon: 'none' });
      }
      
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return wx.showToast({ title: '请输入有效的单价', icon: 'none' });
      }
      
      if (!number || number < 1) {
        return wx.showToast({ title: '请输入有效的数量', icon: 'none' });
      }
      
      if (!remark.trim()) {
        return wx.showToast({ title: '请输入备注信息', icon: 'none' });
      }
      
      // 格式化数据（完全匹配服务器预期格式）
      const unitPrice = parseFloat(price).toFixed(2);
      const quantity = parseInt(number);
      const money = (parseFloat(unitPrice) * quantity).toFixed(2);
      
      // 构建符合要求的临时商品数据结构
      const productData = {
        // 基础信息
        id,
        productId: id, // 确保productId存在
        name,
        productName: name,
        code,
        productCode: code,
        price: parseFloat(unitPrice),
        unitPrice: unitPrice,
        number: quantity,
        quantity: quantity.toString(),
        remark,
        type,
        
        // 核心：符合服务器要求的productData结构
        productData: {
          productCode: code,
          productName: name,
          unitPrice: unitPrice,
          quantity: quantity.toString(),
          remark: remark,
          type: 2, // 临时商品类型标识为2
          money: money
        },
        
        // 原始数据备份（用于提交时保持格式一致）
        originalData: {
          productId: id,
          quantity: quantity.toString(),
          unitPrice: unitPrice,
          remark: remark,
          productData: JSON.stringify({
            productCode: code,
            productName: name,
            unitPrice: unitPrice,
            quantity: quantity.toString(),
            remark: remark,
            type: 2,
            money: money
          }),
          type: 2 // 临时商品类型值
        },
        originalProductData: {
          productCode: code,
          productName: name,
          unitPrice: unitPrice,
          quantity: quantity.toString(),
          remark: remark,
          type: 2,
          money: money
        }
      };
      
      // 获取当前页面栈
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2]; // chooseProduct页面
      
      if (prevPage) {
        // 将临时商品添加到上一页的商品列表
        const newProducts = [...prevPage.data.product, productData];
        
        // 更新上一页的数据
        prevPage.setData({
          product: newProducts,
          originalProducts: [...newProducts],
          showNoData: newProducts.length === 0
        }, () => {
          // 同步到全局数据
          const app = getApp();
          if (!app.globalData.selectedProducts) {
            app.globalData.selectedProducts = [];
          }
          app.globalData.selectedProducts = [...app.globalData.selectedProducts, productData];
          
          // 触发上一页重新计算总价
          prevPage.calculateTotal();
          
          // 返回上一页
          wx.navigateBack({ delta: 1 });
        });
      } else {
        wx.navigateBack({ delta: 1 });
      }
    },

    // 取消操作，返回上一页
    cancel() {
      wx.navigateBack();
    }
  });
