Page({
    data: {
      fileName: '小喇叭公司报价单',
      project: '', // 项目名称
      time: '', // 报价日期（精确到秒）
      item: {}, // 商家和联系人信息
      product: [], // 商品列表
      attachment: [], // 附件列表
      id: '', // 报价单ID（编辑时有值）
      submitData: {}, // 提交的完整数据
      isNew: false, // 是否为新建模式
      errorMsg: '' // 错误提示
    },
  
    onLoad(options) {
      console.log('页面参数:', options);
      const hasId = !!options.id; // 判断是否有ID参数
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
          selectedProducts: []
        };
      }
  
      // 新建模式时重置相关全局数据
      if (!hasId) {
        app.globalData.submitData = {
          quote: {},
          productGroupList: [],
          quoteFileList: [],
          selectedProducts: []
        };
        app.globalData.shareSystemSelectedData = null;
        app.globalData.isCreateNewQuote = null;
        app.globalData.selectedProducts = []; // 清空商品全局数据
      }
  
      // 初始化模式状态
      this.setData({
        id: options.id || '',
        isNew: !hasId
      });
  
      // 编辑模式：加载已有数据
      if (hasId) {
        this.loadQuotationData();
      } else {
        // 新建模式：初始化空数据，时间精确到秒
        const currentTime = this.formatDateTime(new Date());
        this.setData({
          item: {
            companyName: '请选择商家',
            linkMan: '',
            linkTel: '',
            projectName: '',
            amountPrice: '0.00', // 初始化总价
            totalPrice: '0.00',   // 初始化合计价
            quoteDate: currentTime // 初始化报价日期（带秒）
          },
          time: currentTime, // 新建默认当前精确时间
          product: [],
          attachment: [],
          submitData: app.globalData.submitData // 关联全局submitData
        });
        // 同步时间到全局数据
        app.globalData.submitData.quote = {
          ...app.globalData.submitData.quote,
          quoteDate: currentTime
        };
      }
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
          selectedProducts: []
        };
      }

      // 关键修复：强制从全局数据同步时间到页面
      const globalQuoteDate = app.globalData.submitData.quote?.quoteDate;
      if (globalQuoteDate) {
        this.setData({
          time: globalQuoteDate,
          item: {
            ...this.data.item,
            quoteDate: globalQuoteDate
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
          
        const newItem = { 
          ...this.data.item, 
          ...submitData.quote || {},
          quoteDate: quoteDate // 确保时间存在且格式正确
        };
        
        this.setData({
          item: newItem,
          attachment: submitData.quoteFileList || this.data.attachment,
          project: newItem.projectName || this.data.project,
          time: quoteDate // 显示格式化后的时间
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
      
      // 更新全局submitData，确保时间存在
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
          quoteDate: app.globalData.submitData.quote?.quoteDate || this.formatDateTime(new Date())
        }
      };
      
      // 更新报价单总价
      const updatedQuote = {
        ...app.globalData.submitData.quote,
        amountPrice: totalPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        quoteDate: app.globalData.submitData.quote?.quoteDate || this.formatDateTime(new Date())
      };
      app.globalData.submitData.quote = updatedQuote;
      
      // 更新本地数据
      this.setData({
        item: updatedQuote,
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
  
            // 更新全局submitData（完全匹配接口返回结构）
            const app = getApp();
            app.globalData.submitData = {
              ...viewData,
              selectedProducts: productList, // 存储商品列表
              quote: {
                ...quote,
                quoteDate: quoteDate // 确保时间精确到秒
              }
            };
  
            // 更新本地数据
            this.setData({
              submitData: app.globalData.submitData,
              item: {
                ...quote,
                quoteDate: quoteDate // 确保时间精确到秒
              },
              product: productList, // 设置解析后的商品列表
              attachment: viewData.quoteFileList || [],
              project: quote.projectName || '',
              time: quoteDate // 显示精确到秒的时间
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
  
    // 打开日期时间选择器
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
          // 强制更新全局数据（关键修复）
          const app = getApp();
          app.globalData.submitData = {
            ...app.globalData.submitData,
            quote: {
              ...app.globalData.submitData.quote,
              quoteDate: selectedTime
            }
          };
          console.log('时间已更新到全局数据:', app.globalData.submitData.quote.quoteDate);
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
      // 关键修复：强制使用页面最新的time值
      const currentTime = this.data.time || this.formatDateTime(new Date());
      
      app.globalData.submitData = {
        ...app.globalData.submitData,
        quote: {
          ...this.data.item,
          quoteDate: currentTime // 使用页面显示的时间
        },
        quoteFileList: this.data.attachment,
        selectedProducts: this.data.product
      };
      console.log('保存数据到全局submitData，时间:', currentTime);
    },
  
    // 取消操作
    cancel() {
      wx.navigateBack();
    },
  
    // 确认提交（使用submitData提交）
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
  
      // 最终保存数据到全局submitData
      this.saveToSubmitData();
  
      // 提交前输出完整的submitData
      console.log('===== 保存修改 - 提交前的submitData =====');
      console.log(JSON.stringify(app.globalData.submitData, null, 2));
  
      // 准备提交数据（与接口返回结构完全一致）
      const submitData = {
        ...app.globalData.submitData,
        quote: {
          ...app.globalData.submitData.quote,
          // 基础信息
          companyId: item.companyId,
          companyName: item.companyName,
          linkMan: item.linkMan || '',
          linkTel: item.linkTel || '',
          linkEmail: item.linkEmail || '',
          projectName: item.projectName || '',
          quoteDate: item.quoteDate || this.data.time, // 确保提交带秒的时间
          // 价格信息
          amountPrice: item.amountPrice || '0.00',
          totalPrice: item.totalPrice || '0.00'
        },
        // 商品数据（保持与接口返回结构一致）
        productGroupList: app.globalData.submitData.productGroupList,
        // 附件数据
        quoteFileList: attachment
      };
  
      // 编辑模式添加ID
      if (!isNew) {
        submitData.quote.id = this.data.id;
      }
  
      // 区分接口地址
      const url = isNew 
        ? `${getApp().globalData.serverUrl}/diServer/quote/create`
        : `${getApp().globalData.serverUrl}/diServer/quote/update`;
  
      // 发送请求
      wx.showLoading({ title: isNew ? '创建中...' : '保存中...' });
      wx.request({
        url: url,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'Content-Type': 'application/json'
        },
        data: submitData, // 提交完整的submitData结构
        success: (res) => {
          wx.hideLoading();
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
    }
  })