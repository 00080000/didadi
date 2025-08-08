const app = getApp();
// 引入工具函数（增加解密函数）
const { numberToChinese, decryptId } = require('../../../utils/util');

Page({
  data: {
    item: null,
    id: '', // 存储解密后的原始ID
    originalId: '', // 存储原始传入的ID
    tableColumns: [],
    tableData: [],
    amountChinese: '', // 用于存储金额大写
    errorMsg: ''
  },

  onLoad(options) {
    console.log('传入的参数:', options.id);
    this.setData({
      originalId: options.id || ''
    });
    
    // 处理ID（解密如果需要）
    this.processIdAndLoadData();
  },

  // 处理ID：判断是否加密并解密
  processIdAndLoadData() {
    const { originalId } = this.data;
    
    if (!originalId) {
      this.setData({ errorMsg: '缺少报价单ID参数' });
      return;
    }
    
    try {
      // 尝试解密ID
      // 加密ID长度固定为16位，可作为初步判断依据
      let decodedId;
      if (originalId.length === 16) {
        // 看起来像加密ID，尝试解密
        decodedId = decryptId(originalId);
        console.log('解密后的ID:', decodedId);
      } else {
        // 不是加密格式，直接使用
        decodedId = parseInt(originalId, 10);
        console.log('使用原始ID:', decodedId);
      }
      
      // 验证ID有效性
      if (typeof decodedId !== 'number' || isNaN(decodedId) || decodedId < 1) {
        throw new Error('ID格式无效');
      }
      
      // 保存解密后的ID并加载数据
      this.setData({ id: decodedId }, () => {
        this.loadQuotationData();
      });
      
    } catch (err) {
      console.error('ID处理失败:', err);
      // 解密失败时，尝试直接使用原始ID（兼容旧版本或未加密情况）
      try {
        const numericId = parseInt(originalId, 10);
        if (numericId >= 1) {
          this.setData({ 
            id: numericId,
            errorMsg: 'ID解密失败，尝试使用原始ID'
          }, () => {
            this.loadQuotationData();
          });
        } else {
          this.setData({ errorMsg: '无效的报价单ID' });
        }
      } catch (e) {
        this.setData({ errorMsg: '无效的报价单ID' });
      }
    }
  },

  loadQuotationData() {
    // 显示加载提示
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/quote/${this.data.id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        console.log('loadQuotationData:', res);
        if (res.statusCode === 200 && res.data.code === 200) {
          const viewData = res.data.data || {};
          console.log('viewData:', viewData);
          this.setData({
            item: viewData.quote || {} // 修正数据层级，从quote字段获取主数据
          });
          this.viewQuotationData(viewData); // 传入完整数据
        } else {
          // 请求失败
          this.setData({
            errorMsg: res.data.message || '获取数据失败'
          });
        }
      },
      fail: (err) => {
        console.error('加载数据失败:', err);
        this.setData({
          errorMsg: '网络请求失败，请稍后重试'
        });
      },
      complete: () => {
        // 隐藏加载提示
        wx.hideLoading();
      }
    });
  },

  viewQuotationData(fullData) {
    console.log('完整报价单数据：', fullData);
    app.globalData.quoteData = fullData;
    const { quote, productGroupList, quoteCostCategoryList } = fullData;
    let tableData = [];
    let index = 1;

    // 解析表格列配置
    if (quote.dataJson) {
      try {
        let columns = JSON.parse(quote.dataJson);
        columns = columns.map(col => ({
            ...col,
            width: col.width || '150rpx' 
          }));
        this.setData({
             tableColumns: columns,
             });
      } catch (e) {
        console.error('解析表格配置失败', e);
      }
    }

    // 处理商品分组数据
    if (productGroupList && productGroupList.length) {
      productGroupList.forEach(group => {
        // 添加分组名称行
        tableData.push({
          index: index++,
          productName: group.productGroupName,
          productCode: '',
          unitPrice: '',
          quantity: '',
          money: '',
          remark: ''
        });

        // 添加分组下的商品行
        if (group.quoteProductList && group.quoteProductList.length) {
          group.quoteProductList.forEach(product => {
            const productData = product.productData ? JSON.parse(product.productData) : {};
            tableData.push({
              index: index++,
              productName: productData.productName || '',
              productCode: productData.productCode || '',
              unitPrice: product.unitPrice ? product.unitPrice.toFixed(2) : '',
              quantity: product.quantity || '',
              money: product.calcPrice ? product.calcPrice.toFixed(2) : '',
              remark: product.remark || ''
            });
          });
        }

        // 添加分组小计行
        tableData.push({
          index: index++,
          productName: '小计',
          productCode: '',
          unitPrice: '',
          quantity: '',
          money: group.subtotal ? group.subtotal.toFixed(2) : '',
          remark: ''
        });
      });
    }

    // 添加合计行
    tableData.push({
      index: index++,
      productName: '合计',
      productCode: '',
      unitPrice: '',
      quantity: '',
      money: quote.amountPrice ? quote.amountPrice.toFixed(2) : '',
      remark: ''
    });

    // 添加费用和优惠行
    if (quoteCostCategoryList && quoteCostCategoryList.length) {
      quoteCostCategoryList.forEach(cost => {
        const costData = cost.costCategoryData ? JSON.parse(cost.costCategoryData) : {};
        tableData.push({
          index: index++,
          productName: costData.costName || '',
          productCode: '',
          unitPrice: '',
          quantity: '',
          money: cost.calcPrice ? cost.calcPrice.toFixed(2) : '',
          remark: cost.remark || ''
        });
      });
    }

    // 添加总计行
    tableData.push({
      index: index++,
      productName: '总计',
      productCode: '',
      unitPrice: '',
      quantity: '',
      money: quote.totalPrice ? quote.totalPrice.toFixed(2) : '',
      remark: ''
    });

    this.setData({ tableData });

    // 转换金额为大写
    if (quote.totalPrice) {
      const chinese = numberToChinese(quote.totalPrice);
      this.setData({ amountChinese: chinese });
    }
  },

  goToDownloadQuotation() {
    wx.navigateTo({
      url: '/quotePackage/pages/downloadRecievedQuotation/downloadRecievedQuotation',
    })
  },

  goToDownloadAttachment() {
    wx.navigateTo({
      url: '/quotePackage/pages/downloadAttachment/downloadAttachment',
    })
  },

  // 打印功能
  printQuotation() {
    wx.showToast({
      title: '准备打印...',
      icon: 'loading',
      duration: 1000
    })
    // 实际项目中可调用打印API
  },

  // 关闭错误提示
  closeError() {
    this.setData({ errorMsg: '' });
  }
})
