Page({
    data: {
      // 临时商品的初始数据
      temporaryProduct: {
        name: '',         // 商品名称
        code: '',         // 商品编码
        price: '',        // 单价
        number: 1,        // 数量，默认为1
        remark: '',       // 备注
        type: 'customProduct', // 标记为自定义商品类型
        id: new Date().getTime() // 生成临时ID
      }
    },
  
    // 输入框内容变化时更新数据
    onInputChange(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      
      // 特殊处理数字类型的字段
      if (field === 'price' || field === 'number') {
        // 确保价格和数量为有效数字
        const numValue = field === 'price' ? parseFloat(value) : parseInt(value);
        if (!isNaN(numValue) && numValue >= 0) {
          this.setData({
            [`temporaryProduct.${field}`] : value
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
      const { name, price } = this.data.temporaryProduct;
      
      // 验证必填字段
      if (!name.trim()) {
        return wx.showToast({
          title: '请输入商品名称',
          icon: 'none'
        });
      }
      
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return wx.showToast({
          title: '请输入有效的单价',
          icon: 'none'
        });
      }
      
      // 格式化数据
      const productData = {
        ...this.data.temporaryProduct,
        price: parseFloat(price).toFixed(2),
        number: parseInt(this.data.temporaryProduct.number) || 1
      };
      
      // 获取当前页面栈
      const pages = getCurrentPages();
      // 获取上一页（即调用当前页面的页面）
      const prevPage = pages[pages.length - 2];
      
      if (prevPage) {
        // 将临时商品添加到上一页的商品列表
        const newProducts = [...prevPage.data.product, productData];
        
        // 更新上一页的数据
        prevPage.setData({
          product: newProducts
        }, () => {
          // 触发上一页的计算方法更新总金额
          prevPage.calculateTotal();
          // 返回上一页
          wx.navigateBack();
        });
      } else {
        // 如果无法获取上一页，直接返回
        wx.navigateBack();
      }
    },
  
    // 取消操作，返回上一页
    cancel() {
      wx.navigateBack();
    }
  });
      