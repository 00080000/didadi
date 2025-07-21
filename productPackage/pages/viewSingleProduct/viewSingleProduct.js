Page({
  data: {
    product: {
      name: '',        // 商品名称
      number: '',      // 商品编号
      type: '',        // 型号
      tag: '',         // 标签
      unit: '',        // 单位
      price: '',       // 单价
      brand: '',       // 品牌
      producer: '',    // 生产商
      image: '',       // 产品图片
      time: '',        // 有效时间
      status: ''       // 状态
    },
    isLoading: true,   // 加载状态
    errorMsg: ''       // 错误信息
  },

  onLoad(options) {
    // 从跳转参数中获取商品ID
    const productId = options.productId;
    if (!productId) {
      this.setData({
        isLoading: false,
        errorMsg: '商品ID不存在'
      });
      return;
    }

    // 调用接口获取商品详情
    this.fetchProductDetail(productId);
  },

  // 调用接口：GET /diServer/product/{id}
  fetchProductDetail(productId) {
    this.setData({ isLoading: true });

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/${productId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`,
        'accept': '*/*'
      },
      success: (res) => {
        // 接口请求成功
        if (res.statusCode === 200 && res.data.code === 200) {
          const detail = res.data.data;
          if (detail) {
            // 解析接口返回的数据（映射到页面需要的字段）
            this.parseProductData(detail);
          } else {
            this.setData({ errorMsg: '未获取到商品数据' });
          }
        } else {
          // 接口返回业务错误
          this.setData({
            errorMsg: res.data?.msg || `获取失败（状态码：${res.statusCode}）`
          });
        }
      },
      fail: () => {
        // 网络请求失败
        this.setData({ errorMsg: '网络连接失败，请重试' });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 解析接口数据（将接口返回的字段映射到页面显示字段）
  parseProductData(detail) {
    // 接口返回的dataMap中包含商品具体值
    const dataMap = detail.dataMap || {};
    
    // 状态映射（根据实际业务补充）
    const statusMap = {
      '1': '上架',
      '0': '下架'
    };

    this.setData({
      product: {
        name: dataMap.productName || '',       // 商品名称
        number: dataMap.productCode || '',     // 商品编号
        type: dataMap.model || '',             // 型号
        tag: dataMap.tag || '',                // 标签
        unit: dataMap.unit || '',              // 单位
        price: dataMap.unitPrice ? dataMap.unitPrice.toFixed(2) : '', // 单价（保留两位小数）
        brand: dataMap.brand || '',            // 品牌
        producer: dataMap.produceCompany || '',// 生产商
        image: dataMap.pics || '',             // 产品图片（如果接口返回图片URL）
        time: dataMap.validityTime || '',      // 有效时间（格式转换）
        status: statusMap[detail.status] || '未知' // 状态
      }
    });
  }
});