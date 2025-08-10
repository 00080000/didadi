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

  processIdAndLoadData() {
    const { originalId } = this.data;
    
    if (!originalId) {
      this.setData({ errorMsg: '缺少报价单ID参数' });
      return;
    }
    
    try {
      // 优先尝试解密所有格式
      const decodedId = decryptId(originalId);
      console.log('解密成功，ID:', decodedId);
      
      // 验证ID有效性
      if (typeof decodedId !== 'number' || isNaN(decodedId) || decodedId < 1) {
        throw new Error('解密后ID无效');
      }
      
      // 保存解密后的ID并加载数据
      this.setData({ id: decodedId }, () => {
        this.loadQuotationData();
      });
      
    } catch (err) {
      console.error('ID解密失败:', err);
      // 解密失败时，尝试直接使用原始ID（兼容未加密情况）
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
          console.log('loadQuotationData:',res);
        if (res.statusCode === 200 && res.data.code === 200) {
          const viewData = res.data.data || {};
          this.setData({
            item: viewData.quote || {}
          });
          this.viewQuotationData(viewData);
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
        this.setData({ tableColumns: columns });
      } catch (e) {
        console.error('解析表格配置失败', e);
      }
    }

    // 处理商品分组数据
    if (productGroupList && productGroupList.length) {
      productGroupList.forEach(group => {
        // 只在分组名称存在且有效时添加分组名称行
        if (group.productGroupName) {
          // 构建分组行数据（动态匹配所有列）
          const groupRow = { index };
          this.data.tableColumns.forEach(col => {
            // 只为商品名称列设置分组名，其他列留空
            groupRow[col.code || col.label] = col.code === 'productName' ? group.productGroupName : '';
          });
          tableData.push(groupRow);
          index++;
        }

        // 添加分组下的商品行
        if (group.quoteProductList && group.quoteProductList.length) {
          group.quoteProductList.forEach(product => {
            let productData = {};
            try {
              productData = product.productData ? JSON.parse(product.productData) : {};
            } catch (e) {
              console.error('解析商品数据失败:', e, product.productData);
              productData = {};
            }
            
            // 构建商品行数据（动态匹配所有列）
            const productRow = { index };
            this.data.tableColumns.forEach(col => {
              if (col.code) {
                // 优先从productData获取，然后是product对象，最后留空
                productRow[col.code] = productData[col.code] !== undefined 
                  ? productData[col.code] 
                  : product[col.code] !== undefined 
                    ? product[col.code] 
                    : '';
                
                // 处理价格和金额的格式化
                if (['unitPrice', 'calcPrice', 'money'].includes(col.code)) {
                  productRow[col.code] = productRow[col.code] ? Number(productRow[col.code]).toFixed(2) : '';
                }
              }
            });
            
            tableData.push(productRow);
            index++;
          });
        }

        // 只在分组小计存在且有效时添加分组小计行
        if (group.subtotal || group.subtotal === 0) {
          const subtotalRow = { index };
          this.data.tableColumns.forEach(col => {
            if (col.code === 'productName') {
              subtotalRow[col.code] = '小计';
            } else if (col.code === 'money') {
              subtotalRow[col.code] = group.subtotal ? Number(group.subtotal).toFixed(2) : '';
            } else {
              subtotalRow[col.code] = '';
            }
          });
          tableData.push(subtotalRow);
          index++;
        }
      });
    }

    // 添加合计行
    if (quote.amountPrice || quote.amountPrice === 0) {
      const totalRow = { index };
      this.data.tableColumns.forEach(col => {
        if (col.code === 'productName') {
          totalRow[col.code] = '合计';
        } else if (col.code === 'money') {
          totalRow[col.code] = quote.amountPrice ? Number(quote.amountPrice).toFixed(2) : '';
        } else {
          totalRow[col.code] = '';
        }
      });
      tableData.push(totalRow);
      index++;
    }

    // 添加费用和优惠行
    if (quoteCostCategoryList && quoteCostCategoryList.length) {
      quoteCostCategoryList.forEach(cost => {
        const costData = cost.costCategoryData ? JSON.parse(cost.costCategoryData) : {};
        const costRow = { index };
        this.data.tableColumns.forEach(col => {
          if (col.code === 'productName') {
            costRow[col.code] = costData.costName || '';
          } else if (col.code === 'money') {
            costRow[col.code] = cost.calcPrice ? Number(cost.calcPrice).toFixed(2) : '';
          } else if (col.code === 'remark') {
            costRow[col.code] = cost.remark || '';
          } else {
            costRow[col.code] = '';
          }
        });
        tableData.push(costRow);
        index++;
      });
    }

    // 添加总计行
    if (quote.totalPrice || quote.totalPrice === 0) {
      const grandTotalRow = { index };
      this.data.tableColumns.forEach(col => {
        if (col.code === 'productName') {
          grandTotalRow[col.code] = '总计';
        } else if (col.code === 'money') {
          grandTotalRow[col.code] = quote.totalPrice ? Number(quote.totalPrice).toFixed(2) : '';
        } else {
          grandTotalRow[col.code] = '';
        }
      });
      tableData.push(grandTotalRow);
      index++;
    }

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
      title: '请前往电脑端打印...',
      icon: 'loading',
      duration: 1000
    })
  },

  closeError() {
    this.setData({ errorMsg: '' });
  }
})