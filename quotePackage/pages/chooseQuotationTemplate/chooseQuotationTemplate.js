// quotePackage/pages/chooseQuotationTemplate/chooseQuotationTemplate.js
Page({
    data: {
      template: [],      // 模板列表
      selectIndex: -1    // 选中的索引
    },
  
    onLoad() {
      this.loadTemplateList();
      // 获取页面栈引用
      const pages = getCurrentPages();
      this.setFormPage = pages[pages.length - 2]; // 上一页是设置页
    },
  
    // 加载模板列表
    loadTemplateList() {
      wx.showLoading({ title: '加载模板中...' });
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quoteTemplate/list?type=1`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 && res.data.code === 200) {
            this.setData({
              template: res.data.rows.map(item => ({
                id: item.id,
                name: item.templateName,
                date: item.createTime?.split(' ')[0] || '',
                headText: item.headText,
                footText: item.footText
              }))
            });
          } else {
            wx.showToast({ title: '加载模板失败', icon: 'none' });
          }
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '网络请求失败', icon: 'none' });
        }
      });
    },
  
    // 选择模板
    chooseTemplate(e) {
      this.setData({
        selectIndex: e.currentTarget.dataset.index
      });
    },
  
    // 取消选择
    cancelChoice() {
      this.setData({
        selectIndex: -1
      });
    },
  
    // 预览模板
    goToViewTemplate() {
      const selected = this.data.template[this.data.selectIndex];
      if (!selected) {
        wx.showToast({ title: '请先选择模板', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/quotePackage/pages/viewQuotationTemplate/viewQuotationTemplate`,
        events: {
          // 接收预览页返回的选择结果
          templateSelected: (data) => {
            // 同步更新全局数据
            this.updateGlobalData(data);
            
            // 直接更新设置页数据
            if (this.setFormPage) {
              this.setFormPage.setData({
                templateName: data.templateName || '',
                headText: data.headText || '<p>无头部内容</p>',
                footText: data.footText || '<p>无底部内容</p>',
                templateId: data.templateId
              }, () => {
                this.setFormPage.syncToGlobalData();
              });
            }
            
            // 转发事件给上一页
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.emit('templateSelected', data);
            wx.navigateBack();
          }
        },
        success: (res) => {
          // 向预览页传递模板数据
          res.eventChannel.emit('templateData', {
            id: selected.id,
            name: selected.name,
            date: selected.date,
            headText: selected.headText,
            footText: selected.footText
          });
        }
      });
    },
  
    // 取消
    cancel() {
      wx.navigateBack();
    },
  
    // 确认选择
    confirm() {
      const selected = this.data.template[this.data.selectIndex];
      if (!selected) {
        wx.showToast({ title: '请先选择模板', icon: 'none' });
        return;
      }
      
      const templateData = {
        templateId: selected.id,
        templateName: selected.name,
        headText: selected.headText,
        footText: selected.footText
      };
      
      // 更新全局数据
      this.updateGlobalData(templateData);
      
      // 直接更新设置页数据
      if (this.setFormPage) {
        this.setFormPage.setData({
          templateName: templateData.templateName,
          headText: templateData.headText,
          footText: templateData.footText,
          templateId: templateData.templateId
        }, () => {
          this.setFormPage.syncToGlobalData();
        });
      }
      
      // 通过事件通道返回数据给上一页
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('templateSelected', templateData);
      wx.navigateBack();
    },
    
    // 更新全局数据
    updateGlobalData(data) {
      const app = getApp();
      if (!app.globalData.submitData) app.globalData.submitData = {};
      if (!app.globalData.submitData.quote) app.globalData.submitData.quote = {};
      
      app.globalData.submitData.quote = {
        ...app.globalData.submitData.quote,
        ...data
      };
    }
  })
