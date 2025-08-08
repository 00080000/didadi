Page({
    data: {
      id: '',          // 模板ID
      name: '',        // 模板名称
      date: '',        // 创建日期
      headText: '',    // 头部内容
      footText: '',    // 底部内容
      buttonDisabled: false // 按钮状态控制
    },
  
    onLoad() {
      // 获取事件通道
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('templateData', (data) => {
        this.setData({
          id: data.id,
          name: data.name || '未知模板',
          date: data.date || '',
          headText: data.headText || '<p>无头部内容</p>',
          footText: data.footText || '<p>无底部内容</p>'
        });
      });
      
      // 获取页面栈引用
      const pages = getCurrentPages();
      this.choosePage = pages[pages.length - 2]; // 上一页是选择页
      this.setFormPage = pages[pages.length - 3]; // 上两页是设置页
    },
  
    // 加载模板详情（备用方案）
    loadTemplateDetail(templateId) {
      wx.showLoading({ title: '加载中...' });
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quoteTemplate/${templateId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 && res.data.code === 200) {
            const item = res.data.data;
            this.setData({
              id: item.id,
              name: item.templateName || '未知模板',
              date: item.createTime?.split(' ')[0] || '',
              headText: item.headText || '<p>无头部内容</p>',
              footText: item.footText || '<p>无底部内容</p>'
            });
          }
        }
      });
    },
  
    // 返回上一页
    goBack() {
      if (this.data.buttonDisabled) return;
      this.setData({ buttonDisabled: true });
      wx.navigateBack({
        success: () => {
          this.setData({ buttonDisabled: false });
        }
      });
    },
  
    // 确认选择此模板
    confirmSelect() {
      if (this.data.buttonDisabled) return;
      this.setData({ buttonDisabled: true });
      
      const templateData = {
        templateId: this.data.id,
        templateName: this.data.name,
        headText: this.data.headText,
        footText: this.data.footText
      };
      
      // 更新全局数据
      const app = getApp();
      if (!app.globalData.submitData) app.globalData.submitData = {};
      if (!app.globalData.submitData.quote) app.globalData.submitData.quote = {};
      app.globalData.submitData.quote = {
        ...app.globalData.submitData.quote,
        ...templateData
      };
      
      // 直接更新设置页数据
      if (this.setFormPage) {
        this.setFormPage.setData({
          templateName: templateData.templateName,
          headText: templateData.headText,
          footText: templateData.footText,
          templateId: templateData.templateId,
          buttonDisabled: false // 确保设置页按钮可点击
        }, () => {
          this.setFormPage.syncToGlobalData();
        });
      }
      
      // 通知选择页
      if (this.choosePage) {
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('templateSelected', templateData);
      }
      
      // 返回设置页
      wx.navigateBack({
        delta: 2,
        success: () => {
          this.setData({ buttonDisabled: false });
        }
      });
    }
  })
