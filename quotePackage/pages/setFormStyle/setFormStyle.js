// quotePackage/pages/setFormStyle/setFormStyle.js
Page({
    data: {
      templateName: '', // 模板名称
      headText: '',     // 头部文本
      footText: '',     // 底部文本
      templateId: null, // 选中的模板ID
      buttonDisabled: false // 按钮状态控制
    },
  
    onLoad() {
      // 从全局数据获取当前报价单的模板信息
      this.syncFromGlobalData();
      
      // 监听模板选择事件
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('templateSelected', (data) => {
        this.setData({
          templateName: data.templateName || '',
          headText: data.headText || '<p>无头部内容</p>',
          footText: data.footText || '<p>无底部内容</p>',
          templateId: data.templateId,
          buttonDisabled: false 
        }, () => {
          this.syncToGlobalData();
        });
      });
    },
    
    // 页面显示时同步数据，确保数据最新
    onShow() {
      this.syncFromGlobalData();
      this.setData({ buttonDisabled: false }); 
    },
  
    // 从全局数据同步
    syncFromGlobalData() {
      const app = getApp();
      if (app.globalData.submitData?.quote) {
        this.setData({
          headText: app.globalData.submitData.quote.headText || '<p>无头部内容</p>',
          footText: app.globalData.submitData.quote.footText || '<p>无底部内容</p>',
          templateId: app.globalData.submitData.quote.templateId || null,
          templateName: app.globalData.submitData.quote.templateName || ''
        });
      }
    },
    
    // 同步数据到全局
    syncToGlobalData() {
      const app = getApp();
      if (!app.globalData.submitData) {
        app.globalData.submitData = {};
      }
      if (!app.globalData.submitData.quote) {
        app.globalData.submitData.quote = {};
      }
      app.globalData.submitData.quote = {
        ...app.globalData.submitData.quote,
        headText: this.data.headText,
        footText: this.data.footText,
        templateId: this.data.templateId,
        templateName: this.data.templateName
      };
    },
  
    // 跳转选择模板页面
    goToChooseTemplate() {
      wx.navigateTo({
        url: '/quotePackage/pages/chooseQuotationTemplate/chooseQuotationTemplate'
      });
    },
  
    // 取消
    cancel() {
      if (this.data.buttonDisabled) return;
      this.setData({ buttonDisabled: true });
      wx.navigateBack({
        success: () => {
          this.setData({ buttonDisabled: false });
        }
      });
    },
  
    // 确认保存
    confirm() {
      if (this.data.buttonDisabled) return;
      this.setData({ buttonDisabled: true });
      this.syncToGlobalData();
      wx.navigateBack({
        success: () => {
          this.setData({ buttonDisabled: false });
        }
      });
    }
  })
