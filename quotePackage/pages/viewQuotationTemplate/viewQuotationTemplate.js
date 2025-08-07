Page({
    data: {
      id: '',          // 模板ID
      name: '',        // 模板名称
      date: '',        // 创建日期
      headText: '',    // 头部内容
      footText: ''     // 底部内容
    },
  
    onLoad(options) {
      // 解析URL参数
      if (options) {
        this.setData({
          id: options.id || '',
          name: decodeURIComponent(options.name) || '未知模板',
          date: options.date || '',
          headText: decodeURIComponent(options.head) || '<p>无头部内容</p>',
          footText: decodeURIComponent(options.foot) || '<p>无底部内容</p>'
        });
      }
    },
  
    // 返回上一页
    goBack() {
      wx.navigateBack();
    },
  
    // 确认选择此模板
    confirmSelect() {
      // 通过事件通道返回数据给模板选择页
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('templateSelected', {
        templateId: this.data.id,
        templateName: this.data.name,
        headText: this.data.headText,
        footText: this.data.footText
      });
      
      // 返回模板选择页
      wx.navigateBack({
        delta: 1
      });
    }
  })
  