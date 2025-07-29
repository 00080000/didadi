Page({
    data: {
      firm: '',
      contactPickerValue: [],
      contactIndex: null,
      id: '',
      quotation: [],
      item: {}, // 存储quote数据
      phoneNumber: '' // 存储联系人电话（双向绑定）
    },
    onLoad(options) {
      console.log(options.id);
      this.setData({
        id: options.id
      });
      this.loadQuotationData();
    },
    contactPickerChange(e) {
      this.setData({
        contactIndex: e.detail.value
      })
    },
    loadQuotationData() {
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/${this.data.id}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            const viewData = res.data.data || {};
            const quoteItem = viewData.quote || {};
            console.log('quote数据:', quoteItem);
  
            // 关键：默认填充商家名称、联系人、联系电话
            this.setData({
              item: quoteItem,
              // 商家名称默认值
              firm: quoteItem.companyName || '',
              // 联系人默认值（填充到选择器）
              contactPickerValue: [quoteItem.linkMan || ''], // 假设联系人列表默认只有一个
              contactIndex: quoteItem.linkMan ? 0 : null, // 有值则默认选中第0项
              // 联系电话默认值
              phoneNumber: quoteItem.linkTel || ''
            });
          } else {
            this.setData({
              errorMsg: res.data.message || '获取数据失败'
            });
          }
        },
        fail: (err) => {
          console.error(err);
        }
      });
    },
    chooseMerchant() {
      wx.navigateTo({
        url: '/quotePackage/pages/chooseMerchant/chooseMerchant',
      })
    },
    // 监听联系电话输入变化
    onPhoneInput(e) {
      this.setData({
        phoneNumber: e.detail.value
      });
    },
    cancel() {
      wx.navigateBack()
    },
    confirm() {
      const { item, phoneNumber, firm } = this.data;
      // 组装请求参数
      const requestData = {
        forwardUrl: "IIIIIII",
        phonenumber: phoneNumber,
        quoteId: item.id,
        quotePreviewUrl: `https://121.199.52.199/#/preview?i=IIIIIII`,
        smsFlag: 0
      };
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/sendQuoteMsg`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'Content-Type': 'application/json' 
        },
        data: requestData,
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            wx.showToast({ title: '发送成功', icon: 'success', duration: 1500 });
          } else {
            wx.showToast({ title: '发送失败', icon: 'none', duration: 1500 });
          }
          setTimeout(() => wx.navigateBack(), 1500);
        },
        fail: (err) => {
          console.error(err);
          wx.showToast({ title: '请求出错', icon: 'none', duration: 1500 });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      });
    }
  })