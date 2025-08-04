Page({
    data: {
      fileName: '小喇叭公司报价单',
      project: '', // 项目名称
      time: '', // 报价日期（精确到秒）
      validityTime: '', // 有效期（精确到秒）
      item: {}, // 商家和联系人信息
      product: [], // 商品列表
      attachment: [], // 附件列表
      id: '', // 报价单ID（编辑时有值）
      submitData: {}, // 提交的完整数据
      isNew: false, // 是否为新建模式
      isCopy: false, // 是否为复制模式
      errorMsg: '' // 错误提示
    },
  
    onLoad(options) {
      console.log('页面参数:', options);
      const hasId = !!options.id;
      // 判断是否为复制模式（从有id的页面进入但需要新建）
      const isCopy = hasId && options.copy === 'true';
      const app = getApp();
  
      // 确保全局数据存在
      if (!app.globalData) {
        app.globalData = {};
      }
      
      // 初始化全局submitData（确保存在）
      if (!app.globalData.submitData) {
        app.globalData.submitData = {
          quote: {},
          productGroupList: [],
          quoteFileList: [],
          selectedProducts: [],
          productFieldList: []
        };
      }
  
      // 新建或复制模式时重置相关全局数据
      if (!hasId || isCopy) {
        app.globalData.submitData = {
          quote: {},
          productGroupList: [],
          quoteFileList: [],
          selectedProducts: [],
          productFieldList: [
            { productFieldCode: "productName", productFieldName: "商品名称" },
            { productFieldCode: "productCode", productFieldName: "商品编码" },
            { productFieldCode: "unitPrice", productFieldName: "单价" },
            { productFieldCode: "quantity", productFieldName: "数量" },
            { productFieldCode: "money", productFieldName: "金额" },
            { productFieldCode: "remark", productFieldName: "备注" }
          ]
        };
        app.globalData.shareSystemSelectedData = null;
        app.globalData.isCreateNewQuote = null;
        app.globalData.selectedProducts = []; // 清空商品全局数据
      }
  
      // 初始化模式状态
      this.setData({
        id: options.id || '',
        isNew: !hasId || isCopy,
        isCopy: isCopy
      });
  
      // 编辑模式：加载已有数据
      if (hasId && !isCopy) {
        this.loadQuotationData();
      } else {
        // 新建或复制模式：初始化数据
        const currentTime = this.formatDateTime(new Date());
        
        // 计算7天后的日期时间作为默认有效期
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        const validityTime = this.formatDateTime(sevenDaysLater);

        // 获取用户信息补全报价人信息
        const userInfo = app.globalData.userInfo || {};
        
        // 如果是复制模式，先加载原报价单数据再修改
        if (isCopy) {
          this.loadCopyData(options.id, currentTime, validityTime, userInfo);
        } else {
          // 新建模式初始化
          this.setData({
            item: {
              companyName: '请选择商家',
              linkMan: '',
              linkTel: '',
              projectName: '',
              amountPrice: '0.00', // 初始化总价
              totalPrice: '0.00',   // 初始化合计价
              quoteDate: currentTime, // 初始化报价日期（带秒）
              validityTime: validityTime, // 设置7天后的有效期
              // 补全报价人信息
              createBy: userInfo.userName || '',
              userId: userInfo.userId || '',
              enterpriseId: userInfo.enterpriseId || '',
              uname: userInfo.userName || '',
              linkMan: userInfo.nickName || userInfo.userName || '',
              linkTel: userInfo.phonenumber || '',
              linkEmail: userInfo.email || ''
            },
            time: currentTime, // 新建默认当前精确时间
            validityTime: validityTime, // 保存有效期到数据
            product: [],
            attachment: [],
            submitData: app.globalData.submitData // 关联全局submitData
          });
          // 同步时间和有效期到全局数据
          app.globalData.submitData.quote = {
            ...app.globalData.submitData.quote,
            quoteDate: currentTime,
            validityTime: validityTime,
            // 补全报价人信息
            createBy: userInfo.userName || '',
            userId: userInfo.userId || '',
            enterpriseId: userInfo.enterpriseId || '',
            uname: userInfo.userName || '',
            linkMan: userInfo.nickName || userInfo.userName || '',
            linkTel: userInfo.phonenumber || '',
            linkEmail: userInfo.email || ''
          };
        }
      }
    },
  
    // 加载复制的数据
    loadCopyData(originalId, currentTime, validityTime, userInfo) {
      wx.showLoading({ title: '复制中...' });
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/${originalId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 && res.data.code === 200) {
            const viewData = res.data.data || {};
            const originalQuote = viewData.quote || {};
            
            // 从原报价单复制数据，但移除id并更新时间
            const copiedQuote = {
              ...originalQuote,
              id: undefined, // 移除id
              quoteNo: undefined, // 移除原报价单号
              createTime: undefined, // 移除原创建时间
              updateTime: undefined, // 移除原更新时间
              quoteDate: currentTime, // 更新为当前时间
              validityTime: validityTime, // 更新有效期为7天后
              // 用当前用户信息覆盖报价人信息
              createBy: userInfo.userName || '',
              userId: userInfo.userId || '',
              enterpriseId: userInfo.enterpriseId || '',
              uname: userInfo.userName || '',
              linkMan: userInfo.nickName || userInfo.userName || '',
              linkTel: userInfo.phonenumber || '',
              linkEmail: userInfo.email || ''
            };

            // 处理商品列表
            let productList = [];
            if (viewData.productGroupList && viewData.productGroupList.length) {
              viewData.productGroupList.forEach(group => {
                if (group.quoteProductList && group.quoteProductList.length) {
                  group.quoteProductList.forEach(product => {
                    try {
                      const productData = product.productData ? JSON.parse(product.productData) : {};
                      productList.push({
                        ...product,
                        ...productData,
                        id: product.id,
                        name: productData.productName || product.name || '未知商品',
                        price: Number(product.unitPrice || 0),
                        unitPrice: Number(product.unitPrice || 0),
                        quantity: Number(product.quantity || 0),
                        number: Number(product.quantity || 0),
                        calcPrice: Number(product.calcPrice || 0)
                      });
                    } catch (e) {
                      console.error('解析商品数据失败:', e);
                      productList.push({
                        ...product,
                        name: product.name || '未知商品',
                        price: Number(product.unitPrice || 0),
                        unitPrice: Number(product.unitPrice || 0),
                        quantity: Number(product.quantity || 0),
                        number: Number(product.quantity || 0),
                        calcPrice: Number(product.calcPrice || 0)
                      });
                    }
                  });
                }
              });
            }

            // 更新全局数据
            const app = getApp();
            app.globalData.submitData = {
              ...viewData,
              quote: copiedQuote,
              selectedProducts: productList,
              productFieldList: viewData.productFieldList || [
                { productFieldCode: "productName", productFieldName: "商品名称" },
                { productFieldCode: "productCode", productFieldName: "商品编码" },
                { productFieldCode: "unitPrice", productFieldName: "单价" },
                { productFieldCode: "quantity", productFieldName: "数量" },
                { productFieldCode: "money", productFieldName: "金额" },
                { productFieldCode: "remark", productFieldName: "备注" }
              ]
            };
            app.globalData.selectedProducts = productList;

            // 更新本地数据
            this.setData({
              item: copiedQuote,
              time: currentTime,
              validityTime: validityTime,
              product: productList,
              attachment: viewData.quoteFileList || [],
              project: copiedQuote.projectName || '',
              submitData: app.globalData.submitData
            });
          } else {
            this.setData({
              errorMsg: res.data.message || '复制报价单失败'
            });
            wx.showToast({ title: this.data.errorMsg, icon: 'none' });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('复制失败:', err);
          this.setData({ errorMsg: '网络请求错误' });
          wx.showToast({ title: '网络请求错误', icon: 'none' });
        }
      });
    },
  
    onShow() {
      const app = getApp();
      const { isNew } = this.data;
  
      // 确保全局数据存在
      if (!app.globalData) {
        app.globalData = {};
      }
      
      if (!app.globalData.submitData) {
        app.globalData.submitData = {
          quote: {},
          productGroupList: [],
          quoteFileList: [],
          selectedProducts: [],
          productFieldList: []
        };
      }
  
      // 强制从全局数据同步时间和有效期到页面
      const globalQuote = app.globalData.submitData.quote || {};
      if (globalQuote.quoteDate) {
        this.setData({
          time: globalQuote.quoteDate,
          item: {
            ...this.data.item,
            quoteDate: globalQuote.quoteDate
          }
        });
      }
      
      // 同步有效期
      if (globalQuote.validityTime) {
        this.setData({
          validityTime: globalQuote.validityTime,
          item: {
            ...this.data.item,
            validityTime: globalQuote.validityTime
          }
        });
      }
  
      // 同步全局submitData到本地
      this.setData({
        submitData: app.globalData.submitData
      });
  
      // 新建模式处理
      if (isNew) {
        // 处理商家选择返回数据
        if (app.globalData.shareSystemSelectedData) {
          const selectedData = app.globalData.shareSystemSelectedData;
          console.log('新建模式 - 选择的商家联系人:', selectedData);
          
          const updatedItem = {
            ...this.data.item,
            companyId: selectedData.companyId,
            companyName: selectedData.companyName || this.data.item.companyName,
            linkMan: selectedData.contactName || this.data.item.linkMan,
            linkTel: selectedData.contactTel || this.data.item.linkTel,
            linkEmail: selectedData.contactEmail || this.data.item.linkEmail
          };
  
          this.setData({ item: updatedItem });
          // 更新到全局submitData
          app.globalData.submitData.quote = updatedItem;
          app.globalData.shareSystemSelectedData = null;
        }
  
        // 处理商品选择返回数据（核心同步点）
        if (app.globalData.selectedProducts) {
          this.setData({
            product: app.globalData.selectedProducts
          });
          // 同步到全局submitData并更新总价
          this.syncProductsToSubmitData(app.globalData.selectedProducts);
        }
        return;
      }
  
      // 编辑模式处理
      const submitData = app.globalData.submitData;
      if (submitData) {
        // 确保时间格式正确（使用带秒的格式）
        const quoteDate = submitData.quote?.quoteDate 
          ? this.formatDateTime(new Date(submitData.quote.quoteDate))
          : this.formatDateTime(new Date());
          
        // 处理有效期
        const validityTime = submitData.quote?.validityTime
          ? this.formatDateTime(new Date(submitData.quote.validityTime))
          : this.formatDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
          
        const newItem = { 
          ...this.data.item, 
          ...submitData.quote || {},
          quoteDate: quoteDate, // 确保时间存在且格式正确
          validityTime: validityTime // 确保有效期存在
        };
        
        this.setData({
          item: newItem,
          attachment: submitData.quoteFileList || this.data.attachment,
          project: newItem.projectName || this.data.project,
          time: quoteDate, // 显示格式化后的时间
          validityTime: validityTime // 显示有效期
        });
      }
  
      // 处理商家选择返回数据（编辑模式）
      if (app.globalData.shareSystemSelectedData) {
        const selectedData = app.globalData.shareSystemSelectedData;
        console.log('编辑模式 - 选择的商家联系人:', selectedData);
        
        const updatedItem = {
          ...this.data.item,
          companyId: selectedData.companyId,
          companyName: selectedData.companyName || this.data.item.companyName,
          linkMan: selectedData.contactName || this.data.item.linkMan,
          linkTel: selectedData.contactTel || this.data.item.linkTel,
          linkEmail: selectedData.contactEmail || this.data.item.linkEmail
        };
  
        // 更新到全局submitData
        app.globalData.submitData.quote = updatedItem;
        
        this.setData({ item: updatedItem });
        app.globalData.shareSystemSelectedData = null;
      }
  
      // 处理商品选择返回数据（编辑模式 - 核心同步点）
      if (app.globalData.selectedProducts) {
        this.setData({
          product: app.globalData.selectedProducts
        });
        // 同步到全局submitData并更新总价
        this.syncProductsToSubmitData(app.globalData.selectedProducts);
      }
    },
  
    // 同步商品数据到submitData并更新总价
    syncProductsToSubmitData(products) {
      const app = getApp();
      // 计算总价
      let totalPrice = 0;
      
      // 格式化商品数据，确保与接口返回格式一致
      const formattedProducts = products.map(product => {
        // 计算商品小计（兼容不同字段名）
        const price = Number(product.price || product.unitPrice || 0);
        const quantity = Number(product.number || product.quantity || 0);
        const itemTotal = price * quantity;
        totalPrice += itemTotal;
        
        // 确保productData为字符串格式（与接口返回一致）
        const productData = typeof product.productData === 'object' 
          ? JSON.stringify(product.productData)
          : product.productData || '{}';
        
        return {
          ...product,
          unitPrice: price,
          quantity: quantity,
          productData: productData,
          calcPrice: itemTotal.toFixed(2) // 计算小计
        };
      });
      
      // 更新全局submitData，确保时间和有效期存在
      app.globalData.submitData = {
        ...app.globalData.submitData,
        selectedProducts: formattedProducts,
        // 更新productGroupList（保持与接口返回结构一致）
        productGroupList: app.globalData.submitData.productGroupList 
          ? app.globalData.submitData.productGroupList.map(group => ({
              ...group,
              quoteProductList: formattedProducts
            }))
          : [{
              quoteProductList: formattedProducts
            }],
        quote: {
          ...app.globalData.submitData.quote,
          quoteDate: app.globalData.submitData.quote?.quoteDate || this.formatDateTime(new Date()),
          validityTime: app.globalData.submitData.quote?.validityTime || this.formatDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        }
      };
      
      // 更新报价单总价
      const updatedQuote = {
        ...app.globalData.submitData.quote,
        amountPrice: totalPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        quoteDate: app.globalData.submitData.quote?.quoteDate || this.formatDateTime(new Date()),
        validityTime: app.globalData.submitData.quote?.validityTime || this.formatDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      };
      app.globalData.submitData.quote = updatedQuote;
      
      // 更新本地数据
      this.setData({
        item: updatedQuote,
        validityTime: updatedQuote.validityTime,
        submitData: app.globalData.submitData
      });
      
      console.log('商品数据同步完成，总价:', totalPrice.toFixed(2));
      console.log('同步后的selectedProducts:', formattedProducts);
    },
  
    // 加载报价单详情数据（仅编辑模式）
    loadQuotationData() {
      wx.showLoading({ title: '加载中...' });
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/${this.data.id}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 && res.data.code === 200) {
            const viewData = res.data.data || {};
            const quote = viewData.quote || {};
            
            // 处理时间格式，确保精确到秒
            const quoteDate = quote.quoteDate 
              ? this.formatDateTime(new Date(quote.quoteDate))
              : this.formatDateTime(new Date());
            
            // 处理有效期，确保精确到秒
            const validityTime = quote.validityTime
              ? this.formatDateTime(new Date(quote.validityTime))
              : this.formatDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            
            // 从productGroupList中提取商品数据（与接口返回格式保持一致）
            let productList = [];
            if (viewData.productGroupList && viewData.productGroupList.length) {
              viewData.productGroupList.forEach(group => {
                if (group.quoteProductList && group.quoteProductList.length) {
                  // 解析每个商品的详细数据
                  group.quoteProductList.forEach(product => {
                    try {
                      const productData = product.productData ? JSON.parse(product.productData) : {};
                      productList.push({
                        ...product,
                        ...productData,
                        // 保留提交所需的核心字段
                        id: product.id,
                        name: productData.productName || product.name || '未知商品',
                        price: Number(product.unitPrice || 0),
                        unitPrice: Number(product.unitPrice || 0),
                        quantity: Number(product.quantity || 0),
                        number: Number(product.quantity || 0), // 兼容number字段
                        calcPrice: Number(product.calcPrice || 0)
                      });
                    } catch (e) {
                      console.error('解析商品数据失败:', e);
                      // 解析失败时仍添加基础信息
                      productList.push({
                        ...product,
                        name: product.name || '未知商品',
                        price: Number(product.unitPrice || 0),
                        unitPrice: Number(product.unitPrice || 0),
                        quantity: Number(product.quantity || 0),
                        number: Number(product.quantity || 0),
                        calcPrice: Number(product.calcPrice || 0)
                      });
                    }
                  });
                }
              });
            }
  
            // 初始化商品字段列表（编辑模式）
            const productFieldList = viewData.productFieldList || [
              { productFieldCode: "productName", productFieldName: "商品名称" },
              { productFieldCode: "productCode", productFieldName: "商品编码" },
              { productFieldCode: "unitPrice", productFieldName: "单价" },
              { productFieldCode: "quantity", productFieldName: "数量" },
              { productFieldCode: "money", productFieldName: "金额" },
              { productFieldCode: "remark", productFieldName: "备注" }
            ];
  
            // 更新全局submitData（完全匹配接口返回结构）
            const app = getApp();
            app.globalData.submitData = {
              ...viewData,
              selectedProducts: productList, // 存储商品列表
              productFieldList: productFieldList,
              quote: {
                ...quote,
                quoteDate: quoteDate, // 确保时间精确到秒
                validityTime: validityTime // 确保有效期存在
              }
            };
  
            // 更新本地数据
            this.setData({
              submitData: app.globalData.submitData,
              item: {
                ...quote,
                quoteDate: quoteDate, // 确保时间精确到秒
                validityTime: validityTime // 确保有效期存在
              },
              product: productList, // 设置解析后的商品列表
              attachment: viewData.quoteFileList || [],
              project: quote.projectName || '',
              time: quoteDate, // 显示精确到秒的时间
              validityTime: validityTime // 显示有效期
            });
  
            // 同步商品数据到全局selectedProducts
            app.globalData.selectedProducts = productList;
            console.log('编辑模式初始化 - 同步商品数据到全局:', app.globalData.selectedProducts);
          } else {
            this.setData({
              errorMsg: res.data.message || '获取报价单数据失败'
            });
            wx.showToast({ title: this.data.errorMsg, icon: 'none' });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('加载失败:', err);
          this.setData({ errorMsg: '网络请求错误' });
          wx.showToast({ title: '网络请求错误', icon: 'none' });
        }
      });
    },
  
    // 格式化日期为yyyy-mm-dd
    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
  
    // 格式化日期时间为yyyy-mm-dd hh:mm:ss（精确到秒）
    formatDateTime(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
  
    // 打开日期时间选择器（报价日期）
    openDateTimePicker() {
      const currentDate = this.data.time 
        ? new Date(this.data.time)
        : new Date();
        
      wx.showDateTimePicker({
        startYear: 2020,
        endYear: 2030,
        date: currentDate,
        success: (res) => {
          const selectedTime = this.formatDateTime(new Date(res.date));
          // 更新本地时间
          this.setData({ 
            time: selectedTime,
            item: {
              ...this.data.item,
              quoteDate: selectedTime
            }
          });
          // 强制更新全局数据
          const app = getApp();
          app.globalData.submitData = {
            ...app.globalData.submitData,
            quote: {
              ...app.globalData.submitData.quote,
              quoteDate: selectedTime
            }
          };
          console.log('报价日期已更新到全局数据:', app.globalData.submitData.quote.quoteDate);
        }
      });
    },
    
    // 打开有效期选择器
    openValidityTimePicker() {
      // 默认选中当前有效期或7天后的日期
      const currentValidity = this.data.validityTime
        ? new Date(this.data.validityTime)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
      wx.showDateTimePicker({
        startYear: 2020,
        endYear: 2030,
        date: currentValidity,
        success: (res) => {
          const selectedTime = this.formatDateTime(new Date(res.date));
          // 更新本地有效期
          this.setData({ 
            validityTime: selectedTime,
            item: {
              ...this.data.item,
              validityTime: selectedTime
            }
          });
          // 强制更新全局数据
          const app = getApp();
          app.globalData.submitData = {
            ...app.globalData.submitData,
            quote: {
              ...app.globalData.submitData.quote,
              validityTime: selectedTime
            }
          };
          console.log('有效期已更新到全局数据:', app.globalData.submitData.quote.validityTime);
        }
      });
    },
  
    // 跳转编辑文档信息
    goToEditFileInformation() {
      // 先保存当前数据到全局submitData
      this.saveToSubmitData();
      wx.navigateTo({
        url: '/quotePackage/pages/editFileInformation/editFileInformation'
      });
    },
  
    // 选择商家
    goToChooseMerchant() {
      // 先保存当前数据到全局submitData
      this.saveToSubmitData();
      wx.navigateTo({
        url: '/quotePackage/pages/chooseMerchant/chooseMerchant'
      });
    },
  
    // 选择商品
    goToChooseProduct() {
      // 先保存当前数据到全局submitData
      this.saveToSubmitData();
      wx.navigateTo({
        url: '/quotePackage/pages/chooseProduct/chooseProduct'
      });
    },
  
    // 添加附件
    goToAddAttachment() {
      // 先保存当前数据到全局submitData
      this.saveToSubmitData();
      wx.navigateTo({
        url: '/quotePackage/pages/uploadAttachment/uploadAttachment'
      });
    },
  
    // 保存数据到全局submitData
    saveToSubmitData() {
      const app = getApp();
      // 强制使用页面最新的time和validityTime值
      const currentTime = this.data.time || this.formatDateTime(new Date());
      const currentValidityTime = this.data.validityTime || this.formatDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      
      app.globalData.submitData = {
        ...app.globalData.submitData,
        quote: {
          ...this.data.item,
          quoteDate: currentTime, // 使用页面显示的时间
          validityTime: currentValidityTime // 使用页面显示的有效期
        },
        quoteFileList: this.data.attachment,
        selectedProducts: this.data.product
      };
      console.log('保存数据到全局submitData，时间:', currentTime, '有效期:', currentValidityTime);
    },
  
    // 取消操作
    cancel() {
      wx.navigateBack();
    },
  
    // 确认提交（使用正确格式的postData提交）
    confirm() {
      const app = getApp();
      const { isNew, item, product, attachment } = this.data;
      
      // 校验必填项
      if (!item.companyId || item.companyName === '请选择商家') {
        return wx.showToast({ title: '请选择商家', icon: 'none' });
      }
      if (product.length === 0) {
        return wx.showToast({ title: '请添加商品', icon: 'none' });
      }
      if (!item.projectName || item.projectName.trim() === '') {
        return wx.showToast({ title: '请填写项目名称', icon: 'none' });
      }
      // 验证时间是否存在
      if (!item.quoteDate) {
        return wx.showToast({ title: '请设置报价时间', icon: 'none' });
      }
      // 验证有效期是否存在
      if (!item.validityTime) {
        return wx.showToast({ title: '请设置有效期', icon: 'none' });
      }
  
      // 最终保存数据到全局submitData
      this.saveToSubmitData();
  
      // 构建符合接口要求的提交数据
      const postData = this.buildSubmitData();
  
      // 提交前输出完整的postData
      console.log('===== 提交前的postData =====');
      console.log(JSON.stringify(postData, null, 2));
  
      // 区分接口地址
      const url = isNew 
        ? `${getApp().globalData.serverUrl}/diServer/quote/submit`
        : `${getApp().globalData.serverUrl}/diServer/quote/submit`;
  
      // 发送请求
      wx.showLoading({ title: isNew ? '创建中...' : '保存中...' });
      wx.request({
        url: url,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'Content-Type': 'application/json'
        },
        data: postData, // 提交格式化后的postData
        success: (res) => {
          wx.hideLoading();
          console.log('提交响应:', res);
          if (res.statusCode === 200 && res.data.code === 200) {
            wx.showToast({
              title: isNew ? '创建成功' : '保存成功',
              icon: 'success',
              duration: 1500
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showToast({
              title: res.data.message || (isNew ? '创建失败' : '保存失败'),
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('提交失败:', err);
          wx.showToast({ title: '网络请求错误', icon: 'none' });
        }
      });
    },
  
    // 构建符合接口要求的提交数据
    buildSubmitData() {
      const app = getApp();
      const { item, product, attachment } = this.data;
      const globalData = app.globalData.submitData;
  
      // 处理商品字段列表，只保留必要字段
      const productFieldList = (globalData.productFieldList || []).map(field => ({
        productFieldCode: field.productFieldCode,
        productFieldName: field.productFieldName
      }));
  
      // 处理商品分组及商品信息（解决商品不能为空错误）
      const quoteProductGroupFormList = (globalData.productGroupList || []).map(group => ({
        quoteProductFormList: (group.quoteProductList || []).map(product => ({
          productId: product.productId,
          quantity: product.quantity || 1,
          unitPrice: (product.unitPrice || 0).toFixed(2)
        }))
      }));
  
      // 确保至少有一个商品分组
      if (quoteProductGroupFormList.length === 0 && product.length > 0) {
        quoteProductGroupFormList.push({
          quoteProductFormList: product.map(p => ({
            productId: p.productId,
            quantity: p.quantity || 1,
            unitPrice: (p.unitPrice || 0).toFixed(2)
          }))
        });
      }
  
      // 处理文件列表
      const formattedFileList = (attachment || []).map(file => ({
        ...file,
        createTime: file.createTime || this.formatDateTime(new Date()),
        quoteId: globalData.quote?.id || null
      }));
  
      // 构建最终提交数据
      return {
        // 成本分类列表（空）
        costCategoryFormList: [],
        
        // 商品字段列表
        productFieldList: productFieldList,
        
        // 报价单主信息
        quote: {
          ...globalData.quote,
          ...item,
          // 基础信息
          companyId: String(item.companyId || ''), // 确保为字符串类型
          companyName: item.companyName || '',
          linkMan: item.linkMan || '',
          linkTel: item.linkTel || '',
          linkEmail: item.linkEmail || '',
          projectName: item.projectName || '',
          quoteDate: item.quoteDate || this.data.time,
          validityTime: item.validityTime || this.data.validityTime, // 包含有效期
          
          // 价格信息
          amountPrice: item.amountPrice || '0.00',
          totalPrice: item.totalPrice || '0.00',
          
          // 补充文件列表
          fileList: formattedFileList
        },
        
        // 报价文件列表
        quoteFileList: formattedFileList,
        
        // 商品分组信息（解决商品不能为空错误）
        quoteProductGroupFormList: quoteProductGroupFormList
      };
    }
  })