Page({
    data: {
      pickerValue: ['采购商', '供应商', '两者皆是'],
      index: 0,
      id: '',
      companyName: '',
      tag: '',
      creditCode: '',
      registerTel: '',
      bankName: '',
      bankAccount: '',
      address: '',
      isAdd: false
    },
    onLoad() {
      const eventChannel = this.getOpenerEventChannel();
      const that = this; 
      eventChannel.on('acceptDataFromOpenerPage', function(data) {
        const item = data.data || {};
        if (Object.keys(item).length === 0) {
            that.setData({
            isAdd: true
            }); 
    }
        let index = 0;
        if (item.type === '2') {
          index = 1;
        } else if (item.type === '3') {
          index = 2;
        }
        
        that.setData({
          index: index,
          companyName: item.companyName || '',
          tag: item.tag || '',
          creditCode: item.creditCode || '',
          registerTel: item.registerTel || '',
          bankName: item.bankName || '',
          bankAccount: item.bankAccount || '',
          address: item.address || '',
          id: item.id || ''
        });
      });
    },
    pickerChange(e) {
      this.setData({
        index: e.detail.value
      });
    },
    handleCompanyNameInput(e) {
      this.setData({
        companyName: e.detail.value
      });
    },
    handleTagInput(e) {
      this.setData({
        tag: e.detail.value
      });
    },
    handleCreditCodeInput(e) {
      this.setData({
        creditCode: e.detail.value
      });
    },
    handlePhoneInput(e) {
      this.setData({
        registerTel: e.detail.value
      });
    },
    handleBankNameInput(e) {
      this.setData({
        bankName: e.detail.value
      });
    },
    handleBankAccountInput(e) {
      this.setData({
        bankAccount: e.detail.value
      });
    },
    handleAddressInput(e) {
      this.setData({
        address: e.detail.value
      });
    },
    cancel() {
      wx.navigateBack();
    },
    confirm() {
        const {
          companyName,
          tag,
          index,
          creditCode,
          registerTel,
          bankName,
          bankAccount,
          address,
          id
        } = this.data;
        
        let type = '0';
        if (this.data.index == 0) {
            type = '1';
        } else if (this.data.index == 1) {
            type = '2';
        } else if (this.data.index == 2) {
            type = '3';
        }

        const submitData = {
          companyName: companyName || '',
          tag: tag || '',
          type: type,
          typeName: ['采购商', '供应商', '两者皆是'][index],
          id: id || '', 
          registerTel: registerTel || '',
          creditCode: creditCode || '',
          bankName: bankName || '',
          bankAccount: bankAccount || '',
          address: address || '',
          params: {}
        };
        console.log('addData:',submitData);
        if(this.data.isAdd)
        {
            wx.request({
                url: `${getApp().globalData.serverUrl}/diServer/company/add`,
                method: 'POST', 
                header: {
                  'Authorization': `Bearer ${getApp().globalData.token}`,
                  'Content-Type': 'application/json' 
                },
                data: submitData,
                success: (res) => {
                  if (res.data.code == 200) { 
                    wx.showToast({
                      title: '新增成功',
                      icon: 'success',
                      duration: 1500
                    });
                    
                    setTimeout(() => {
                      wx.navigateBack();
                    }, 1500);
                  } else {
                    wx.showToast({
                      title: res.data.msg || '新增失败',
                      icon: 'none',
                      duration: 2000
                    });
                  }
                },
                fail: (err) => {
                  console.error('修改请求失败', err);
                  wx.showToast({
                    title: '网络错误',
                    icon: 'none',
                    duration: 2000
                  });
                }
              });
        }
        else
        {
            wx.request({
                url: `${getApp().globalData.serverUrl}/diServer/company/edit`,
                method: 'POST', 
                header: {
                  'Authorization': `Bearer ${getApp().globalData.token}`,
                  'Content-Type': 'application/json' 
                },
                data: submitData,
                success: (res) => {
                  if (res.data.code == 200) { 
                    wx.showToast({
                      title: '修改成功',
                      icon: 'success',
                      duration: 1500
                    });
                    
                    setTimeout(() => {
                      wx.navigateBack();
                    }, 1500);
                  } else {
                    wx.showToast({
                      title: res.data.msg || '修改失败',
                      icon: 'none',
                      duration: 2000
                    });
                  }
                },
                fail: (err) => {
                  console.error('修改请求失败', err);
                  wx.showToast({
                    title: '网络错误',
                    icon: 'none',
                    duration: 2000
                  });
                }
              });
        }
      }
  });