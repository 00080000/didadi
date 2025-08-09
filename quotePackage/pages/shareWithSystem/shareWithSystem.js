Page({
    data: {
      firm: '',
      contactPickerValue: [], // 联系人名称列表
      contactList: [], // 完整联系人数据
      contactIndex: null,
      id: '',
      item: {},
      phoneNumber: '',
      companyId: ''
    },
  
    onLoad(options) {
      this.setData({ id: options.id });
      this.loadQuotationData();
    },
  
    loadQuotationData() {
      wx.showLoading({ title: '加载中...' });
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/${this.data.id}`,
        method: 'GET',
        header: { 'Authorization': `Bearer ${getApp().globalData.token}` },
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 && res.data.code === 200) {
            const quoteItem = res.data.data?.quote || {};
            this.setData({
              item: quoteItem,
              firm: quoteItem.companyName || '',
              companyId: quoteItem.companyId || ''
            });
  
            if (quoteItem.companyId) {
              this.loadContactList(quoteItem.companyId, quoteItem);
            }
          } else {
            wx.showToast({ title: res.data.message || '获取数据失败', icon: 'none' });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('加载报价单失败：', err);
        }
      });
    },
  
    loadContactList(companyId, quoteItem) {
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/companyLinkman/list?companyId=${companyId}`,
        method: 'GET',
        header: { 'Authorization': `Bearer ${getApp().globalData.token}` },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            const contacts = res.data.rows || []; 
            console.log('联系人列表：', contacts);
  
            if (contacts.length === 0) {
              this.setData({
                contactPickerValue: [],
                contactList: [],
                contactIndex: null,
                phoneNumber: ''
              });
              return;
            }
            
            const contactNames = contacts.map(contact => contact.userName || '未知联系人');
  
            let defaultIndex = 0; // 默认选中第一个
            if (quoteItem.userName) { // 若报价单中联系人名称字段是userName
              contacts.forEach((contact, index) => {
                if (contact.userName === quoteItem.userName) {
                  defaultIndex = index; // 匹配选中
                }
              });
            }
  
            this.setData({
              contactList: contacts,
              contactPickerValue: contactNames, // 显示userName
              contactIndex: defaultIndex,
              phoneNumber: contacts[defaultIndex].tel || '' 
            });
          } else {
            wx.showToast({ title: '加载联系人失败', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('加载联系人失败：', err);
        }
      });
    },
  
    // 选择联系人时更新电话
    contactPickerChange(e) {
      const index = e.detail.value;
      const contact = this.data.contactList[index] || {};
      this.setData({
        contactIndex: index,
        phoneNumber: contact.tel || ''
      });
    },
  
    chooseMerchant() {
      wx.navigateTo({
        url: `/quotePackage/pages/chooseMerchant/chooseMerchant?quoteId=${this.data.id}`
      });
    },
  
    onPhoneInput(e) {
      this.setData({ phoneNumber: e.detail.value });
    },
  
    onShow() {
      const app = getApp();
      const selectedData = app.globalData.shareSystemSelectedData;
      if (selectedData) {
        this.setData({
          firm: selectedData.companyName || '',
          companyId: selectedData.companyId || ''
        });
        if (selectedData.companyId) {
          this.loadContactList(selectedData.companyId, {
            userName: selectedData.contactName // 传递userName用于匹配
          });
        }
        app.globalData.shareSystemSelectedData = null;
      }
    },
  
    cancel() {
      wx.navigateBack();
    },
  
    confirm() {
      const { item, phoneNumber } = this.data;
      if (!phoneNumber) return wx.showToast({ title: '请输入联系人电话', icon: 'none' });
      if (!item.id) return wx.showToast({ title: '报价单ID异常', icon: 'none' });
  
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/sendQuoteMsg`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          forwardUrl: "IIIIIII",
          phonenumber: phoneNumber,
          quoteId: item.id,
          quotePreviewUrl: `https://121.199.52.199/#/preview?i=IIIIIII`,
          smsFlag: 0
        },
        success: (res) => {
          const title = res.statusCode === 200 && res.data.code === 200 
            ? '发送成功' 
            : '发送失败';
          wx.showToast({ title, icon: title === '发送成功' ? 'success' : 'none', duration: 1500 });
          setTimeout(() => wx.navigateBack(), 1500);
        },
        fail: () => {
          wx.showToast({ title: '请求出错', icon: 'none', duration: 1500 });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      });
    }
  })