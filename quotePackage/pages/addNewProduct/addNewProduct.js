Page({
    data: {
      index: 1, // 1:单商品 2:组合商品 3:临时商品
      showSelectedSingleProduct: false,
      showSelectedCombinationProduct: false,
      showSelectedTemporaryProduct: false,
      // 原始数据存储
      singleProduct: [],
      combinationProduct: [],
      temporaryProduct: [],
      // 筛选后的数据（已排除当前页面已选商品）
      filterSingleProduct: [],
      filterCombinationProduct: [],
      filterTemporaryProduct: [],
      // 搜索关键字
      keyword: '',
      combinationKeyword: '',
      temporaryKeyword: '',
      // 接口参数
      enterpriseId: 11, // 企业ID
      isLoading: false, // 加载状态
      errorMsg: '' // 错误提示
    },
  
    onLoad() {
      // 页面加载时默认加载单商品
      this.fetchSingleProducts();
    },
  
    // 切换商品类型标签
    chooseSingleProduct() {
      this.setData({ index: 1 }, () => {
        if (this.data.singleProduct.length === 0) {
          this.fetchSingleProducts(); // 首次切换时加载数据
        } else {
          // 重新应用过滤（排除已选商品）
          this.filterProductsBySelection();
        }
      });
    },
    chooseCombinationProduct() {
      this.setData({ index: 2 }, () => {
        if (this.data.combinationProduct.length === 0) {
          this.fetchCombinationProducts(); // 首次切换时加载数据
        } else {
          // 重新应用过滤
          this.filterProductsBySelection();
        }
      });
    },
    chooseTemporaryProduct() {
      this.setData({ index: 3 }, () => {
        if (this.data.temporaryProduct.length === 0) {
          this.fetchTemporaryProducts(); // 首次切换时加载数据
        } else {
          // 重新应用过滤
          this.filterProductsBySelection();
        }
      });
    },
  
    // 1. 获取单商品列表
    fetchSingleProducts() {
      this.setData({ isLoading: true, errorMsg: '' });
      const { enterpriseId, keyword } = this.data;
  
      const params = {
        enterpriseId,
        ...(keyword && { productName: keyword }) // 关键字搜索
      };
  
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/product/list`,
        method: 'GET',
        data: params,
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'accept': '*/*'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            console.log('单商品接口原始数据:', res.data.rows);
  
            // 格式化数据
            const formattedData = (res.data.rows || []).map(item => ({
              id: item.id,
              productId: item.id, // 确保有productId
              name: item.productName || '未知商品',
              type: item.type || item.specs || '无型号',
              price: this.getValidPrice(item),
              number: 1,
              select: false,
              productCode: item.productCode || item.code || '无编码',
              originalData: {
                id: item.id,
                productId: item.id, // 确保有productId
                productName: item.productName || '未知商品',
                type: 0,
                unitPrice: this.getValidPrice(item),
                quantity: 1,
                productData: JSON.stringify(this.getProductData(item, 1))
              },
              originalProductData: this.getProductData(item, 1)
            }));
            
            this.setData({
              singleProduct: formattedData
            }, () => {
              // 数据加载完成后过滤已选商品
              this.filterProductsBySelection();
            });
          } else {
            this.setData({ errorMsg: res.data?.msg || '获取单商品失败' });
          }
        },
        fail: () => {
          this.setData({ errorMsg: '网络连接失败，无法获取单商品' });
        },
        complete: () => {
          this.setData({ isLoading: false });
        }
      });
    },
  
    // 2. 获取组合商品列表
    fetchCombinationProducts() {
      this.setData({ isLoading: true, errorMsg: '' });
      const { enterpriseId, combinationKeyword } = this.data;
  
      const params = {
        enterpriseId,
        ...(combinationKeyword && { name: combinationKeyword })
      };
  
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/product/group/list`,
        method: 'GET',
        data: params,
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            console.log('组合商品接口原始数据:', res.data.rows);
  
            const formattedData = (res.data.rows || []).map(item => ({
              id: item.id,
              productId: item.id, // 确保有productId
              name: item.name || '未知组合商品',
              price: this.getValidPrice(item),
              number: 1,
              select: false,
              productCode: item.productCode || item.code || '组合无编码',
              originalData: {
                id: item.id,
                productId: item.id, // 确保有productId
                productName: item.name || '未知组合商品',
                type: 1,
                unitPrice: this.getValidPrice(item),
                quantity: 1,
                productData: JSON.stringify(this.getProductData(item, 2))
              },
              originalProductData: this.getProductData(item, 2)
            }));
            
            this.setData({
              combinationProduct: formattedData
            }, () => {
              // 数据加载完成后过滤已选商品
              this.filterProductsBySelection();
            });
          } else {
            this.setData({ errorMsg: res.data?.msg || '获取组合商品失败' });
          }
        },
        fail: () => {
          this.setData({ errorMsg: '网络连接失败，无法获取组合商品' });
        },
        complete: () => {
          this.setData({ isLoading: false });
        }
      });
    },
  
    // 3. 获取临时商品列表
    fetchTemporaryProducts() {
      this.setData({ isLoading: true, errorMsg: '' });
      const { enterpriseId, temporaryKeyword } = this.data;
  
      const params = {
        enterpriseId,
        ...(temporaryKeyword && { productName: temporaryKeyword })
      };
  
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/product/notStandardList`,
        method: 'GET',
        data: params,
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'accept': '*/*'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            console.log('临时商品接口原始数据:', res.data.rows);
  
            const formattedData = (res.data.rows || []).map(item => ({
              id: item.id,
              productId: item.id, // 确保有productId
              name: item.productName || '未知临时商品',
              price: this.getValidPrice(item),
              number: 1,
              select: false,
              productCode: item.productCode || item.code || '临时无编码',
              originalData: {
                id: item.id,
                productId: item.id, // 确保有productId
                productName: item.productName || '未知临时商品',
                type: 2,
                unitPrice: this.getValidPrice(item),
                quantity: 1,
                productData: JSON.stringify(this.getProductData(item, 3))
              },
              originalProductData: this.getProductData(item, 3)
            }));
            
            this.setData({
              temporaryProduct: formattedData
            }, () => {
              // 数据加载完成后过滤已选商品
              this.filterProductsBySelection();
            });
          } else {
            this.setData({ errorMsg: res.data?.msg || '获取临时商品失败' });
          }
        },
        fail: () => {
          this.setData({ errorMsg: '网络连接失败，无法获取临时商品' });
        },
        complete: () => {
          this.setData({ isLoading: false });
        }
      });
    },
  
    // 核心过滤方法：在当前页面中隐藏已选择的商品
    filterProductsBySelection() {
      const { 
        singleProduct, combinationProduct, temporaryProduct,
        keyword, combinationKeyword, temporaryKeyword,
        showSelectedSingleProduct, showSelectedCombinationProduct, showSelectedTemporaryProduct
      } = this.data;
      
      // 1. 处理单商品过滤（排除当前页面已选择的商品）
      let filteredSingle = singleProduct.filter(item => !item.select);
      // 应用搜索关键词
      if (keyword) {
        filteredSingle = filteredSingle.filter(item => item.name.includes(keyword));
      }
      // 如果开启了"已选"筛选，则只显示已选择的商品
      if (showSelectedSingleProduct) {
        filteredSingle = singleProduct.filter(item => item.select && item.name.includes(keyword));
      }
      
      // 2. 处理组合商品过滤
      let filteredCombination = combinationProduct.filter(item => !item.select);
      if (combinationKeyword) {
        filteredCombination = filteredCombination.filter(item => item.name.includes(combinationKeyword));
      }
      if (showSelectedCombinationProduct) {
        filteredCombination = combinationProduct.filter(item => item.select && item.name.includes(combinationKeyword));
      }
      
      // 3. 处理临时商品过滤
      let filteredTemporary = temporaryProduct.filter(item => !item.select);
      if (temporaryKeyword) {
        filteredTemporary = filteredTemporary.filter(item => item.name.includes(temporaryKeyword));
      }
      if (showSelectedTemporaryProduct) {
        filteredTemporary = temporaryProduct.filter(item => item.select && item.name.includes(temporaryKeyword));
      }
      
      // 更新筛选后的数据
      this.setData({
        filterSingleProduct: filteredSingle,
        filterCombinationProduct: filteredCombination,
        filterTemporaryProduct: filteredTemporary
      });
      
      console.log('过滤后单商品数量:', filteredSingle.length);
      console.log('过滤后组合商品数量:', filteredCombination.length);
      console.log('过滤后临时商品数量:', filteredTemporary.length);
    },
  
    // 构建标准化的productData
    getProductData(item, type) {
      const baseData = {
        productName: item.productName || item.name || '未知商品',
        unitPrice: Number(this.getValidPrice(item)),
        type: type === 1 ? 0 : type === 2 ? 1 : 2
      };
  
      if (type === 1) {
        return {
          ...baseData,
          productCode: item.productCode || '',
          model: item.model || '',
          unit: item.unit || '',
          brand: item.brand || '',
          produceCompany: item.produceCompany || ''
        };
      } else if (type === 2) {
        return {
          ...baseData,
          code: item.code || '',
          remark: item.remark || ''
        };
      } else {
        return {
          ...baseData,
          productType: item.productType || 1,
          source: item.source || ''
        };
      }
    },
  
    // 提取有效价格
    getValidPrice(item) {
      const priceFields = ['price', 'unitPrice', 'totalPrice', 'salePrice', 'retailPrice'];
      for (const field of priceFields) {
        if (item[field] !== undefined && item[field] !== null) {
          const numericPrice = Number(item[field]);
          return isNaN(numericPrice) ? 0 : Math.max(0, numericPrice);
        }
      }
      console.warn(`商品[${item.name || item.id}]未找到有效价格字段`, item);
      return 0;
    },
  
    // 单商品搜索
    inputProduct(e) {
      this.setData({ keyword: e.detail.value.trim() }, () => {
        this.filterProductsBySelection();
      });
    },
  
    // 组合商品搜索
    inputCombinationProduct(e) {
      this.setData({ combinationKeyword: e.detail.value.trim() }, () => {
        this.filterProductsBySelection();
      });
    },
  
    // 临时商品搜索
    inputTemporaryProduct(e) {
      this.setData({ temporaryKeyword: e.detail.value.trim() }, () => {
        this.filterProductsBySelection();
      });
    },
  
    // 单商品切换"已选"筛选
    singleProductSwitchChange() {
      this.setData({
        showSelectedSingleProduct: !this.data.showSelectedSingleProduct
      }, () => {
        this.filterProductsBySelection();
      });
    },
  
    // 组合商品切换"已选"筛选
    combinationProductSwitchChange() {
      this.setData({
        showSelectedCombinationProduct: !this.data.showSelectedCombinationProduct
      }, () => {
        this.filterProductsBySelection();
      });
    },
  
    // 临时商品切换"已选"筛选
    temporaryProductSwitchChange() {
      this.setData({
        showSelectedTemporaryProduct: !this.data.showSelectedTemporaryProduct
      }, () => {
        this.filterProductsBySelection();
      });
    },
  
    // 选择/取消单商品
    selectSingleProduct(e) {
      const id = e.currentTarget.dataset.index;
      const singleProduct = this.data.singleProduct.map(item => {
        if (item.id === id) item.select = !item.select;
        return item;
      });
  
      this.setData({ singleProduct }, () => {
        this.filterProductsBySelection();
      });
    },
  
    // 选择/取消组合商品
    selectCombinationProduct(e) {
      const id = e.currentTarget.dataset.index;
      const combinationProduct = this.data.combinationProduct.map(item => {
        if (item.id === id) item.select = !item.select;
        return item;
      });
  
      this.setData({ combinationProduct }, () => {
        this.filterProductsBySelection();
      });
    },
  
    // 选择/取消临时商品
    selectTemporaryProduct(e) {
      const id = e.currentTarget.dataset.index;
      const temporaryProduct = this.data.temporaryProduct.map(item => {
        if (item.id === id) item.select = !item.select;
        return item;
      });
  
      this.setData({ temporaryProduct }, () => {
        this.filterProductsBySelection();
      });
    },
  
    // 商品数量调整方法
    addSingleProduct(e) {
      const id = e.currentTarget.dataset.index;
      const singleProduct = this.data.singleProduct.map(item => {
        if (item.id === id) {
          item.number++;
          item.originalData.quantity = item.number;
        }
        return item;
      });
      this.setData({ singleProduct });
    },
    subSingleProduct(e) {
      const id = e.currentTarget.dataset.index;
      const singleProduct = this.data.singleProduct.map(item => {
        if (item.id === id && item.number > 1) {
          item.number--;
          item.originalData.quantity = item.number;
        }
        return item;
      });
      this.setData({ singleProduct });
    },
    addCombinationProduct(e) {
      const id = e.currentTarget.dataset.index;
      const combinationProduct = this.data.combinationProduct.map(item => {
        if (item.id === id) {
          item.number++;
          item.originalData.quantity = item.number;
        }
        return item;
      });
      this.setData({ combinationProduct });
    },
    subCombinationProduct(e) {
      const id = e.currentTarget.dataset.index;
      const combinationProduct = this.data.combinationProduct.map(item => {
        if (item.id === id && item.number > 1) {
          item.number--;
          item.originalData.quantity = item.number;
        }
        return item;
      });
      this.setData({ combinationProduct });
    },
    addTemporaryProduct(e) {
      const id = e.currentTarget.dataset.index;
      const temporaryProduct = this.data.temporaryProduct.map(item => {
        if (item.id === id) {
          item.number++;
          item.originalData.quantity = item.number;
        }
        return item;
      });
      this.setData({ temporaryProduct });
    },
    subTemporaryProduct(e) {
      const id = e.currentTarget.dataset.index;
      const temporaryProduct = this.data.temporaryProduct.map(item => {
        if (item.id === id && item.number > 1) {
          item.number--;
          item.originalData.quantity = item.number;
        }
        return item;
      });
      this.setData({ temporaryProduct });
    },
  
    // 取消选择，返回上一页
    cancel() {
      wx.navigateBack();
    },
  
    // 确认选择，返回上一页并传递数据
    confirm() {
      // 收集所有已选中的商品
      const selected = [
        ...this.data.singleProduct
          .filter(item => item.select)
          .map(item => ({ ...item, type: 'singleProduct' })),
        ...this.data.combinationProduct
          .filter(item => item.select)
          .map(item => ({ ...item, type: 'combinationProduct' })),
        ...this.data.temporaryProduct
          .filter(item => item.select)
          .map(item => ({ ...item, type: 'customProduct' }))
      ];
  
      if (selected.length === 0) {
        wx.showToast({ title: '请至少选择一个商品', icon: 'none' });
        return;
      }
  
      console.log('选中的商品及编码:', selected.map(item => ({
        name: item.name,
        productCode: item.productCode,
        price: item.price
      })));
  
      // 优先使用事件通道传递数据
      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel) {
        selected.forEach(product => {
          eventChannel.emit('productAdded', product);
        });
        wx.navigateBack();
      } else {
        // 兼容旧方式
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage) {
          prevPage.setData({
            product: [...prevPage.data.product, ...selected]
          }, () => {
            prevPage.calculateTotal();
            wx.navigateBack();
          });
        }
      }
    }
  })