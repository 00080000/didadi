// quotePackage/pages/chooseQuotationTemplate/chooseQuotationTemplate.js
Page({
    data: {
      template: [],      // 模板列表
      selectIndex: -1    // 选中的索引
    },
  
    onLoad() {
      this.loadTemplateList();
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
        url: `/quotePackage/pages/viewQuotationTemplate/viewQuotationTemplate?templateId=${selected.id}`
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
      // 通过事件通道返回数据给上一页
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('templateSelected', {
        templateId: selected.id,
        templateName: selected.name,
        headText: selected.headText,
        footText: selected.footText
      });
      wx.navigateBack();
    }
  })