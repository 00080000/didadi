Page({
  data: {
    product: {
      name: '',        // 商品组名称
      number: '',      // 商品组编号
      tag: '',         // 标签
      remark: '',      // 备注
      status: '',      // 状态
      time: '',        // 有效时间
      list: [],        // 商品列表
      image: ''        // 产品图片
    },
    isLoading: true,   // 加载状态
    errorMsg: ''       // 错误信息
  },

  onLoad(options) {
    // 从跳转参数中获取商品组ID
    const groupId = options.groupId;
    if (!groupId) {
      this.setData({
        isLoading: false,
        errorMsg: '商品组ID不存在'
      });
      return;
    }

    // 调用接口获取商品组详情
    this.fetchProductGroupDetail(groupId);
  },

  // 调用接口：GET /diServer/product/group/{id}
  fetchProductGroupDetail(groupId) {
    this.setData({ isLoading: true });

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/product/group/${groupId}`,
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
            // 解析接口返回的数据并存储商品列表（用于传递给子页面）
            const productList = detail.productList || [];
            wx.setStorageSync('currentGroupProducts', productList); // 临时存储商品列表

            // 解析数据并更新页面
            this.parseGroupData(detail);
          } else {
            this.setData({ errorMsg: '未获取到商品组数据' });
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

  // 解析接口数据（映射到页面显示字段）
  parseGroupData(detail) {
    // 状态映射（1-上架，0-下架，根据实际业务调整）
    const statusMap = {
      '1': '上架',
      '0': '下架'
    };

    this.setData({
      product: {
        name: detail.name || '',                // 商品组名称
        number: detail.code || '',              // 商品组编号
        tag: detail.tag || '',                  // 标签
        remark: detail.remark || '',            // 备注
        status: statusMap[detail.status] || '未知', // 状态
        time: detail.validityTime || '',        // 有效时间
        list: detail.productList || [],         // 商品列表（用于显示数量）
        image: detail.imageList[0] || ''        // 产品图片（取第一张）
      }
    });
  },

  // 跳转到商品组内商品列表页
  goToViewSingleProduct() {
    wx.navigateTo({
      url: '/productPackage/pages/viewSingleProductInCombination/viewSingleProductInCombination'
    });
  }
});