// quotePackage/pages/setFormStyle/setFormStyle.js
Page({
    data: {
      templateName: '', // 模板名称
      headText: '',     // 头部文本
      footText: '',     // 底部文本
      templateId: null  // 选中的模板ID
    },
  
    onLoad() {
      // 从全局数据获取当前报价单的模板信息
      const app = getApp();
      if (app.globalData.submitData?.quote) {
        this.setData({
          headText: app.globalData.submitData.quote.headText || '',
          footText: app.globalData.submitData.quote.footText || '',
          templateId: app.globalData.submitData.quote.templateId || null
        });
      }
    },
  
    // 跳转选择模板页面
    goToChooseTemplate() {
      wx.navigateTo({
        url: '/quotePackage/pages/chooseQuotationTemplate/chooseQuotationTemplate',
      }).then(() => {
        // 监听模板选择结果
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('templateSelected', (data) => {
          this.setData({
            templateName: data.templateName,
            headText: data.headText,
            footText: data.footText,
            templateId: data.templateId
          });
        });
      });
    },
  
    // 头部文本变化
    onHeadTextChange(e) {
      this.setData({
        headText: e.detail.value
      });
    },
  
    // 底部文本变化
    onFootTextChange(e) {
      this.setData({
        footText: e.detail.value
      });
    },
  
    // 取消
    cancel() {
      wx.navigateBack();
    },
  
    // 确认保存
    confirm() {
      const app = getApp();
      // 更新全局数据
      if (app.globalData.submitData?.quote) {
        app.globalData.submitData.quote = {
          ...app.globalData.submitData.quote,
          headText: this.data.headText,
          footText: this.data.footText,
          templateId: this.data.templateId
        };
      }
      wx.navigateBack();
    }
  })