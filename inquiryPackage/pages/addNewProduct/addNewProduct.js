Page({
    data: {
      index: 1, // 1:单商品 2:组合商品 3:临时商品
      keyword: '',
      filterProducts: [],
      selectedProducts: [],
      isLoading: false,
      enterpriseId: 11, // 企业ID，根据实际情况调整
      timer: null
    },
  
    onLoad() {
      // 加载单商品作为默认类型
      this.fetchProductsByType(1);
    },
  
    onUnload() {
      // 清理定时器防止内存泄漏
      clearTimeout(this.data.timer);
    },
  
    // 切换商品类型
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
  
    // 根据类型获取商品列表
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
              // 统一数据格式，确保与报价单数据结构兼容
              const baseInfo = {
                id: item.id,
                name: item.productName || item.name || '未知商品',
                number: 1,
                select: false,
                // 保存原始数据用于后续转换
                originalData: item,
                originalProductData: item.productData ? JSON.parse(item.productData) : {}
              };
  
              // 补充不同类型商品的特有属性
              if (type === 1) {
                return {
                  ...baseInfo,
                  type: 'singleProduct',
                  price: Number(item.price || 0),
                  unitPrice: Number(item.price || 0), // 与报价单数据结构对齐
                  quantity: 1, // 与报价单数据结构对齐
                  typeInfo: item.type || '型号未知',
                  unit: item.unit || '',
                  specs: item.specs || ''
                };
              } else if (type === 2) {
                return {
                  ...baseInfo,
                  type: 'combinationProduct',
                  price: Number(item.totalPrice || 0),
                  unitPrice: Number(item.totalPrice || 0),
                  quantity: 1
                };
              } else {
                return {
                  ...baseInfo,
                  type: 'customProduct',
                  price: Number(item.price || 0),
                  unitPrice: Number(item.price || 0),
                  quantity: 1,
                  unit: item.unit || '',
                  specs: item.specs || ''
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
  
    // 搜索输入处理（防抖）
    onSearchInput(e) {
      const keyword = e.detail.value.trim();
      clearTimeout(this.data.timer);
      this.data.timer = setTimeout(() => {
        this.setData({ keyword }, () => {
          this.fetchProductsByType(this.data.index);
        });
      }, 300);
    },
  
    // 切换商品选择状态
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
  
    // 修改商品数量
    changeNumber(e) {
      const { id, action } = e.currentTarget.dataset;
      const { filterProducts, selectedProducts } = this.data;
      
      const updatedProducts = filterProducts.map(item => {
        if (item.id === id) {
          // 更新数量（至少为1）
          item.number = action === 'add' 
            ? item.number + 1 
            : Math.max(1, item.number - 1);
          
          // 同步更新已选列表中的数量
          const selectedItem = selectedProducts.find(p => p.id === id);
          if (selectedItem) {
            selectedItem.number = item.number;
            selectedItem.quantity = item.number; // 同步到quantity字段
          }
        }
        return item;
      });
  
      this.setData({ 
        filterProducts: updatedProducts,
        selectedProducts: [...selectedProducts]
      });
    },
  
    // 确认选择商品
    confirm() {
      if (this.data.selectedProducts.length === 0) {
        wx.showToast({ title: '请选择商品', icon: 'none' });
        return;
      }
  
      // 获取上一页（chooseProduct页面）
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      
      if (prevPage) {
        // 通过事件通知方式传递数据，避免直接修改上一页数据
        const eventChannel = this.getOpenerEventChannel();
        if (eventChannel) {
          // 发送已选商品数据到上一页
          eventChannel.emit('productAdded', this.data.selectedProducts);
          wx.navigateBack();
        } else {
          // 兼容处理：直接更新上一页数据
          const newProducts = [...prevPage.data.product, ...this.data.selectedProducts];
          prevPage.setData({ product: newProducts }, () => {
            prevPage.calculateTotal(); // 重新计算总价
            wx.navigateBack();
          });
        }
      } else {
        wx.navigateBack();
      }
    },
  
    // 取消选择
    cancel() {
      wx.navigateBack();
    }
  });