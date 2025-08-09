Page({
    data: {
      fileName: '小喇叭公司报价单',
      total: 2368.50,
      time: '2024.07.08',
      contactPickerValue: [], // 联系人名称列表
      contactList: [], // 完整联系人数据（含ID、邮箱等）
      contactIndex: null,
      id: '', // 报价单ID
      item: {}, // 报价单详情数据
      firm: '', // 商家名称
      email: '', // 联系人邮箱
      mailSubject: '', // 邮件主题
      selectedMerchant: null, // 选中的商家
      selectedContact: null // 选中的联系人
    },
  
    onLoad(options) {
      this.setData({ id: options.id });
      this.loadQuoteData();
    },
  

// 修改onShow方法，保存返回的联系人ID
onShow() {
    const app = getApp();
    if (app.globalData.shareSystemSelectedData) {
      const selectedData = app.globalData.shareSystemSelectedData;
      console.log('返回的完整数据:', selectedData);
      
      // 保存返回的联系人ID用于后续匹配
      this.setData({
        firm: selectedData.companyName || '',
        selectedMerchant: {
          id: selectedData.companyId,
          name: selectedData.companyName
        },
        email: selectedData.contactEmail || selectedData.contactTel || '',
        selectedContactId: selectedData.contactId || ''
      });
      console.log('email:',this.data.email,)
  
      // 加载该商家联系人列表
      if (selectedData.companyId) {
          console.log('加载该商家联系人列表');
        this.fetchContactsByCompanyId(selectedData.companyId);
      }
  
      app.globalData.shareSystemSelectedData = null;
    }
  },
  

  
    // 加载报价单详情数据
    loadQuoteData() {
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/${this.data.id}`,
        method: 'GET',
        header: { 'Authorization': `Bearer ${getApp().globalData.token}` },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            const viewData = res.data.data || {};
            const quote = viewData.quote || {};
            
            this.setData({
              item: quote,
              fileName: quote.name || '小喇叭公司报价单',
              total: quote.amountPrice || 0,
              time: quote.quoteDate || '',
              firm: quote.companyName || '',
              email: quote.linkEmail || '',
              mailSubject: `【报价单】${quote.name || ''}`
            });
  
            // 如果有商家ID，加载联系人
            if (quote.companyId) {
              this.fetchContactsByCompanyId(quote.companyId);
            }
          } else {
            wx.showToast({ title: '数据加载失败', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('加载数据失败：', err);
          wx.showToast({ title: '网络请求错误', icon: 'none' });
        }
      });
    },
  
    // 根据商家ID获取联系人列表
  fetchContactsByCompanyId(companyId) {
    wx.showLoading({ title: '加载联系人...' });
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/companyLinkman/list?companyId=${companyId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${getApp().globalData.token}` },
      success: (res) => {
        wx.hideLoading();
        console.log('res:',res);
        if (res.statusCode === 200 && res.data.code === 200) {
          const contacts = res.data.rows || [];
          console.log('contacts:',contacts);
          const contactNames = contacts.map(contact => contact.userName || '未知联系人');
          
          let selectedIndex = 0;
          const { selectedContactId } = this.data;
          if (selectedContactId) {
            // 遍历联系人列表，找到与返回的contactId匹配的项
            for (let i = 0; i < contacts.length; i++) {
              if (String(contacts[i].id) === String(selectedContactId)) {
                selectedIndex = i;
                break; // 找到后退出循环
              }
            }
          }
          
          // 设置数据时选中找到的索引
          this.setData({
            contactList: contacts,
            contactPickerValue: contactNames,
            contactIndex: contacts.length > 0 ? selectedIndex : null,
            // 同步更新邮箱
            email: contacts[selectedIndex]?.email || contacts[selectedIndex]?.tel || ''
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('加载联系人失败：', err);
      }
    });
  },
  
    // 联系人选择器变化
    contactPickerChange(e) {
      const index = e.detail.value;
      const selectedContact = this.data.contactList[index] || {};
      this.setData({
        contactIndex: index,
        email: selectedContact.email || selectedContact.tel || '', // 同步更新邮箱
        selectedContact: selectedContact
      });
    },
  
    // 选择商家（跳转页面）
    chooseMerchant() {
      wx.navigateTo({
        url: '/quotePackage/pages/chooseMerchant/chooseMerchant'
      });
    },
  
    // 监听邮箱输入
    onEmailInput(e) {
      this.setData({ email: e.detail.value });
    },
  
    // 监听邮件主题输入
    onSubjectInput(e) {
      this.setData({ mailSubject: e.detail.value });
    },
  
    // 取消按钮
    cancel() {
      wx.navigateBack();
    },
  
    // 确定按钮（发送邮件请求）
    confirm() {
      const { item, email, mailSubject, selectedContact } = this.data;
  
      // 校验
      if (!email) {
        return wx.showToast({ title: '请输入联系人邮箱', icon: 'none' });
      }
      if (!mailSubject) {
        return wx.showToast({ title: '请输入邮件主题', icon: 'none' });
      }
      if (!this.data.firm) {
        return wx.showToast({ title: '请选择商家', icon: 'none' });
      }
  
      // 组装请求参数
      const requestData = {
        companyLinkmanId: selectedContact?.id || item.enterpriseId || 0,
        email: email,
        mailSubject: mailSubject,
        quoteId: item.id || 0,
        quotePreviewUrl: `${getApp().globalData.serverUrl}/#/preview?i=${item.id}`
      };
  
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/sendQuoteMail`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'Content-Type': 'application/json'
        },
        data: requestData,
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            wx.showToast({ title: '邮件发送成功', icon: 'success', duration: 1500 });
          } else {
            wx.showToast({ title: '邮件发送失败', icon: 'none', duration: 1500 });
          }
          setTimeout(() => wx.navigateBack(), 1500);
        },
        fail: (err) => {
          console.error('发送邮件失败：', err);
          wx.showToast({ title: '请求出错', icon: 'none', duration: 1500 });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      });
    }
  });