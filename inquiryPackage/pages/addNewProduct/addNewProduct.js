Page({
  data: {
    index: 1, // 1:单商品 2:组合商品 3:临时商品
    keyword: '',
    filterProducts: [],
    selectedProducts: [],
    isLoading: false,
    enterpriseId: 11,
    timer: null
  },

  onLoad() {
    this.fetchProductsByType(1);
  },

  onUnload() {
    clearTimeout(this.data.timer);
  },

  switchType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    this.setData({ 
      index: type, 
      keyword: '',
      selectedProducts: []
    }, () => {
      this.fetchProductsByType(type);
    });
  },

  fetchProductsByType(type) {
    this.setData({ isLoading: true });
    const { enterpriseId, keyword } = this.data;
    let url = '';
    let params = { enterpriseId };

    if (type === 1) {
      // 单商品库
      url = `${getApp().globalData.serverUrl}/diServer/product/list`;
      if (keyword) params.productName = keyword;
    } else if (type === 2) {
      // 组合商品库
      url = `${getApp().globalData.serverUrl}/diServer/product/group/list`;
      if (keyword) params.name = keyword;
    } else if (type === 3) {
      // 临时商品库
      url = `${getApp().globalData.serverUrl}/diServer/product/notStandardList`;
      if (keyword) params.productName = keyword;
    }

    wx.request({
      url,
      method: 'GET',
      data: params,
      header: { 
        'Authorization': `Bearer ${getApp().globalData.token}`,
        'accept': '*/*'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const products = (res.data.rows || []).map(item => {
            // 统一数据格式
            const baseInfo = {
              id: item.id,
              name: item.productName || item.name || '未知商品',
              number: 1,
              select: false
            };

            // 补充不同类型商品的特有属性
            if (type === 1) {
              return {
                ...baseInfo,
                type: 'singleProduct',
                price: item.price || 0,
                typeInfo: item.type || '型号未知'
              };
            } else if (type === 2) {
              return {
                ...baseInfo,
                type: 'combinationProduct',
                price: item.totalPrice || 0
              };
            } else {
              return {
                ...baseInfo,
                type: 'customProduct',
                price: item.price || 0
              };
            }
          });
          this.setData({ filterProducts: products });
        } else {
          wx.showToast({ 
            title: res.data?.msg || '加载商品失败', 
            icon: 'none' 
          });
          this.setData({ filterProducts: [] });
        }
      },
      fail: (err) => {
        console.error('商品请求失败:', err);
        wx.showToast({ title: '网络连接失败', icon: 'none' });
        this.setData({ filterProducts: [] });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    clearTimeout(this.data.timer);
    this.data.timer = setTimeout(() => {
      this.setData({ keyword }, () => {
        this.fetchProductsByType(this.data.index);
      });
    }, 300);
  },

  toggleSelect(e) {
    const { id } = e.currentTarget.dataset;
    const { filterProducts, selectedProducts } = this.data;
    
    const updatedProducts = filterProducts.map(item => {
      if (item.id === id) {
        item.select = !item.select;
        
        if (item.select) {
          // 添加到已选列表
          selectedProducts.push({...item});
        } else {
          // 从已选列表移除
          const index = selectedProducts.findIndex(p => p.id === id);
          if (index > -1) selectedProducts.splice(index, 1);
        }
      }
      return item;
    });

    this.setData({ 
      filterProducts: updatedProducts, 
      selectedProducts: [...selectedProducts]
    });
  },

  changeNumber(e) {
    const { id, action } = e.currentTarget.dataset;
    const { filterProducts, selectedProducts } = this.data;
    
    const updatedProducts = filterProducts.map(item => {
      if (item.id === id) {
        item.number = action === 'add' 
          ? item.number + 1 
          : Math.max(1, item.number - 1);
        
        // 更新已选商品的数量
        const selectedItem = selectedProducts.find(p => p.id === id);
        if (selectedItem) {
          selectedItem.number = item.number;
        }
      }
      return item;
    });

    this.setData({ 
      filterProducts: updatedProducts,
      selectedProducts: [...selectedProducts]
    });
  },

  confirm() {
    if (this.data.selectedProducts.length === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }

    // 返回上一级页面（商品浏览页）
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    
    if (prevPage) {
      // 将选中商品添加到商品列表
      const newProducts = [...prevPage.data.product, ...this.data.selectedProducts];
      prevPage.setData({ product: newProducts }, () => {
        prevPage.calculateTotal(); // 重新计算总价
        wx.navigateBack();
      });
    } else {
      wx.navigateBack();
    }
  },

  cancel() {
    wx.navigateBack();
  }
});
