Page({
    data: {
      fileName: '小喇叭公司报价单',
      total: 2368.50,
      time: '2024.07.08',
      contactPickerValue: [], // 联系人列表（从接口获取）
      contactIndex: null,
      id: '', // 报价单ID
      item: {}, // 报价单详情数据
      firm: '', // 商家名称
      email: '', // 联系人邮箱
      mailSubject: '' // 邮件主题
    },
  
    onLoad(options) {
      // 获取传递的报价单ID
      this.setData({
        id: options.id
      });
      // 加载报价单数据
      this.loadQuoteData();
    },
  
    // 加载报价单详情数据
    loadQuoteData() {
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/${this.data.id}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            const viewData = res.data.data || {};
            const quote = viewData.quote || {};
            
            // 填充页面数据及默认值
            this.setData({
              item: quote,
              fileName: quote.name || '小喇叭公司报价单',
              total: quote.amountPrice || 0,
              time: quote.quoteDate || '',
              // 商家名称默认值
              firm: quote.companyName || '',
              // 联系人默认值
              contactPickerValue: [quote.linkMan || ''],
              contactIndex: quote.linkMan ? 0 : null,
              // 邮箱默认值
              email: quote.linkEmail || '',
              // 邮件主题默认值
              mailSubject: `【报价单】${quote.name || ''}`
            });
          } else {
            wx.showToast({
              title: '数据加载失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('加载数据失败：', err);
          wx.showToast({
            title: '网络请求错误',
            icon: 'none'
          });
        }
      });
    },
  
    // 联系人选择器变化
    contactPickerChange(e) {
      this.setData({
        contactIndex: e.detail.value
      });
    },
  
    // 选择商家（跳转页面）
    chooseMerchant() {
      wx.navigateTo({
        url: '/quotePackage/pages/chooseMerchant/chooseMerchant',
      });
    },
  
    // 监听邮箱输入
    onEmailInput(e) {
      this.setData({
        email: e.detail.value
      });
    },
  
    // 监听邮件主题输入
    onSubjectInput(e) {
      this.setData({
        mailSubject: e.detail.value
      });
    },
  
    // 取消按钮
    cancel() {
      wx.navigateBack();
    },
  
    // 确定按钮（发送邮件请求）
    confirm() {
      const { item, email, mailSubject } = this.data;
  
      // 简单校验
      if (!email) {
        return wx.showToast({
          title: '请输入联系人邮箱',
          icon: 'none'
        });
      }
      if (!mailSubject) {
        return wx.showToast({
          title: '请输入邮件主题',
          icon: 'none'
        });
      }
  
      // 组装请求参数
      const requestData = {
        companyLinkmanId: item.enterpriseId || 0, // 从quote.enterpriseId获取
        email: email,
        mailSubject: mailSubject,
        quoteId: item.id || 0, // 从quote.id获取
        quotePreviewUrl: `${getApp().globalData.serverUrl}/#/preview?i=${item.id}` 
      };
      console.log('requestData:',requestData);
      // 发送邮件请求
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/sendQuoteMail`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'Content-Type': 'application/json'
        },
        data: requestData,
        success: (res) => {
            console.log('发送邮件请求:',res);
          if (res.statusCode === 200 && res.data.code === 200) {
            wx.showToast({
              title: '邮件发送成功',
              icon: 'success',
              duration: 1500
            });
          } else {
            wx.showToast({
              title: '邮件发送失败',
              icon: 'none',
              duration: 1500
            });
          }
          // 延迟返回，确保用户看到提示
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        },
        fail: (err) => {
          console.error('发送邮件失败：', err);
          wx.showToast({
            title: '请求出错',
            icon: 'none',
            duration: 1500
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    }
  })