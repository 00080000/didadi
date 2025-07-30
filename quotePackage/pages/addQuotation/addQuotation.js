Page({
    data: {
      fileName: '小喇叭公司报价单',
      project: '', // 项目名称
      time: '', // 报价日期
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
  
      // 关键修复1：新建模式时强制清空全局数据
      if (!hasId) {
        app.globalData.submitData = null;
        app.globalData.shareSystemSelectedData = null;
        app.globalData.isCreateNewQuote = null;
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
        // 新建模式：强制初始化空数据
        this.setData({
          item: {
            companyName: '请选择商家',
            linkMan: '',
            linkTel: '',
            projectName: ''
          },
          time: this.formatDate(new Date()), // 新建默认当前日期
          product: [],
          attachment: [],
          submitData: {} // 确保本地提交数据为空
        });
      }
    },
  
    onShow() {
      const app = getApp();
      const { isNew } = this.data;
  
      // 关键修复2：新建模式单独处理，确保数据隔离
      if (isNew) {
        // 只处理从选择商家页面返回的新数据
        if (app.globalData.shareSystemSelectedData) {
          const selectedData = app.globalData.shareSystemSelectedData;
          console.log('新建模式 - 选择的商家联系人:', selectedData);
          
          // 更新商家和联系人信息
          const updatedItem = Object.assign({}, this.data.item, {
            companyId: selectedData.companyId,
            companyName: selectedData.companyName || this.data.item.companyName,
            linkMan: selectedData.contactName || this.data.item.linkMan,
            linkTel: selectedData.contactTel || this.data.item.linkTel,
            linkEmail: selectedData.contactEmail || this.data.item.linkEmail
          });
  
          this.setData({
            item: updatedItem
          });
  
          // 清空选择数据，避免重复处理
          app.globalData.shareSystemSelectedData = null;
        }
        // 新建模式不处理其他全局数据，防止污染
        return;
      }
  
      // 编辑模式正常处理全局数据
      if (app.globalData && app.globalData.submitData) {
        const submitData = app.globalData.submitData;
        const newItem = Object.assign({}, this.data.item, submitData.quote || {});
        
        this.setData({
          submitData: submitData,
          item: newItem,
          attachment: submitData.quoteFileList || this.data.attachment,
          project: newItem.projectName || this.data.project,
          time: newItem.quoteDate || this.data.time
        });
      }
  
      if (app.globalData.shareSystemSelectedData) {
        const selectedData = app.globalData.shareSystemSelectedData;
        console.log('编辑模式 - 选择的商家联系人:', selectedData);
        
        const updatedItem = Object.assign({}, this.data.item, {
          companyId: selectedData.companyId,
          companyName: selectedData.companyName || this.data.item.companyName,
          linkMan: selectedData.contactName || this.data.item.linkMan,
          linkTel: selectedData.contactTel || this.data.item.linkTel,
          linkEmail: selectedData.contactEmail || this.data.item.linkEmail
        });
  
        const updatedSubmitData = Object.assign({}, this.data.submitData, {
          quote: updatedItem
        });
        
        this.setData({
          item: updatedItem,
          submitData: updatedSubmitData
        });
  
        app.globalData.submitData = updatedSubmitData;
        app.globalData.shareSystemSelectedData = null;
      }
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
            
            this.setData({
              submitData: viewData,
              item: quote,
              product: viewData.productList || [],
              attachment: viewData.quoteFileList || [],
              project: quote.projectName || '',
              time: quote.quoteDate || this.formatDate(new Date())
            });
  
            // 同步到全局
            const app = getApp();
            app.globalData.submitData = this.data.submitData;
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
  
    // 计算商品总价
    getTotalAmount() {
      let total = 0;
      for (let i = 0; i < this.data.product.length; i++) {
        const item = this.data.product[i];
        total += (item.price || 0) * (item.amount || 0);
      }
      return total.toFixed(2); // 保留两位小数
    },
  
    // 格式化日期为yyyy-mm-dd
    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
  
    // 跳转编辑文档信息
    goToEditFileInformation() {
      wx.navigateTo({
        url: '/quotePackage/pages/editFileInformation/editFileInformation'
      });
    },
  
    // 选择商家
    goToChooseMerchant() {
      wx.navigateTo({
        url: '/quotePackage/pages/chooseMerchant/chooseMerchant'
      });
    },
  
    // 选择商品
    goToChooseProduct() {
      wx.navigateTo({
        url: '/quotePackage/pages/chooseProduct/chooseProduct'
      });
    },
  
    // 添加附件
    goToAddAttachment() {
      wx.navigateTo({
        url: '/quotePackage/pages/uploadAttachment/uploadAttachment'
      });
    },
  
    // 取消操作
    cancel() {
      wx.navigateBack();
    },
  
    // 确认提交（新建/保存）
    confirm() {
      const app = getApp();
      const { isNew, item, product, attachment, submitData } = this.data;
      
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
  
      // 准备提交数据
      const postData = Object.assign({}, submitData.quote || {}, {
        // 基础信息
        companyId: item.companyId,
        companyName: item.companyName,
        linkMan: item.linkMan || '',
        linkTel: item.linkTel || '',
        linkEmail: item.linkEmail || '',
        projectName: item.projectName || '',
        quoteDate: item.quoteDate || this.data.time,
        
        // 商品和价格
        amountPrice: this.getTotalAmount(),
        productList: product,
        
        // 附件
        fileList: attachment
      });
  
      // 区分接口地址
      let url = '';
      if (isNew) {
        // 新建报价单接口
        url = `${getApp().globalData.serverUrl}/diServer/quote/create`;
        app.globalData.isCreateNewQuote = true; // 全局标识：新建
      } else {
        // 编辑报价单接口（需携带ID）
        url = `${getApp().globalData.serverUrl}/diServer/quote/update`;
        postData.id = this.data.id;
        app.globalData.isCreateNewQuote = false; // 全局标识：编辑
      }
  
      // 发送请求
      wx.showLoading({ title: isNew ? '创建中...' : '保存中...' });
      wx.request({
        url: url,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'Content-Type': 'application/json'
        },
        data: postData,
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 && res.data.code === 200) {
            wx.showToast({
              title: isNew ? '创建成功' : '保存成功',
              icon: 'success',
              duration: 1500
            });
            // 延迟返回，确保用户看到提示
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
  