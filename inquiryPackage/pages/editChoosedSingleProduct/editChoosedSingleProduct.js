const { encryptId } = require('../../../utils/util');

Page({
  data: {
    pickerValue: ['渠道价', '销售价', '代理价'],
    index: 0,
    formData: {
      productName: '',
      productModel: '',
      quantity: '',
      price: '',
      totalPrice: ''
    },
    currentIndex: -1,
    product: {}
  },

  onLoad(options) {
    if (options && options.index !== undefined) {
      this.setData({
        currentIndex: parseInt(options.index)
      }, () => {
        this.initFormData();
      });
    }
  },

  // 初始化表单数据
  initFormData() {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    const { currentIndex } = this.data;

    if (prevPage && prevPage.data.product && prevPage.data.product[currentIndex]) {
      const product = prevPage.data.product[currentIndex];
      const quantity = product.number || product.quantity || 1;
      const price = product.price || 0;
      const totalPrice = (quantity * price).toFixed(2);

      this.setData({
        product,
        formData: {
          productName: product.name || '',
          productModel: product.model || product.specs || '',
          quantity: String(quantity),
          price: String(price),
          totalPrice
        }
      });
    }
  },

  pickerChange(e) {
    this.setData({
      index: e.detail.value
    });
  },

  // 输入框变化处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    let processedValue = value;

    // 数字验证
    if (field === 'quantity') {
      processedValue = value.toString().replace(/[^\d]/g, '');
    } else if (field === 'price') {
      processedValue = value.toString().replace(/[^\d.]/g, '');
      const dotIndex = processedValue.indexOf('.');
      if (dotIndex !== -1 && processedValue.lastIndexOf('.') !== dotIndex) {
        processedValue = processedValue.substring(0, processedValue.lastIndexOf('.'));
      }
    }

    // 更新数据并计算总价
    this.setData({
      [`formData.${field}`]: processedValue
    }, () => {
      const { quantity, price } = this.data.formData;
      const totalPrice = (Number(quantity) * Number(price)).toFixed(2);
      this.setData({
        'formData.totalPrice': totalPrice
      });
    });
  },

  cancel() {
    wx.navigateBack();
  },

  confirm() {
    const { formData, currentIndex, product } = this.data;
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];

    if (prevPage && prevPage.data.product) {
      // 更新商品数据
      const updatedProduct = {
        ...product,
        number: Number(formData.quantity) || 1,
        price: Number(formData.price) || 0,
        totalPrice: Number(formData.totalPrice) || 0,
        priceType: this.data.pickerValue[this.data.index]
      };

      // 更新商品列表
      const productList = [...prevPage.data.product];
      productList[currentIndex] = updatedProduct;

      // 传递更新后的数据
      prevPage.setData({
        product: productList
      }, () => {
        // 触发上一页重新计算总价
        if (typeof prevPage.calculateTotal === 'function') {
          prevPage.calculateTotal();
        }
        wx.navigateBack();
      });
    }
  },

  // 删除商品
  deleteProduct() {
    const { currentIndex } = this.data;
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];

    if (prevPage && prevPage.data.product) {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除该商品吗？',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            // 删除商品
            const productList = [...prevPage.data.product];
            productList.splice(currentIndex, 1);

            // 更新上一页数据
            prevPage.setData({
              product: productList
            }, () => {
              if (typeof prevPage.calculateTotal === 'function') {
                prevPage.calculateTotal();
              }
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 1500
              });
              setTimeout(() => {
                wx.navigateBack();
              }, 1000);
            });
          }
        }
      });
    }
  }
});