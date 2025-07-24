// mainPackage/pages/editFirmInformation/editFirmInformation.js
Page({
  data: {
   pickerValue: ['小规模纳税人', '一般纳税人', '个体工商户', '不涉及'],
   index:0,
   enterpriseName: '', // 对应企业名称
    officialWebsite: '', // 对应官方网站
    creditCode: '', // 对应信用代码
    registeredPhone: '', // 对应注册电话
    bankOfDeposit: '', // 对应开户行
    bankAccountNumber: '', // 对应银行账号
    registeredAddress: '' // 对应注册地址
  },
  onLoad() {
    this.fetchEnterpriseInfo();
  },

  fetchEnterpriseInfo() {
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/system/enterprise/getMyInfo`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = res.data.data;
          console.log(data);
          const taxesTypeIndex = this.data.pickerValue.indexOf(data.taxesType);
          this.setData({
            enterpriseName: data.name || '',
            index: taxesTypeIndex!== -1? taxesTypeIndex : 0, 
            officialWebsite: data.webSite || '',
            creditCode: data.code || '',
            registeredPhone: data.tel || '',
            bankOfDeposit: data.bankName || '',
            bankAccountNumber: data.bankAccount || '',
            registeredAddress: data.address || ''
          });
          console.log('获取成功');
        } else {
          wx.showToast({ title: '获取企业信息失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
        console.error(err);
      }
    });
  },
  pickerChange(e){
    this.setData({
      index: e.detail.value
    })
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    const app = getApp();
    const token = app.globalData.token;
    const enterpriseInfo = {
      name: this.data.enterpriseName,
      taxesType: this.data.pickerValue[this.data.index],
      webSite: this.data.officialWebsite,
      code: this.data.creditCode,
      tel: this.data.registeredPhone,
      bankName: this.data.bankOfDeposit,
      bankAccount: this.data.bankAccountNumber,
      address: this.data.registeredAddress
    };
    console.log('enterpriseInfo:',enterpriseInfo);
    wx.request({
      url: `${app.globalData.serverUrl}/diServer/system/enterprise`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: enterpriseInfo,
      success: (res) => {
        if (res.statusCode === 200&& res.data.code === 200) {
          wx.showToast({ title: '信息保存成功', icon: 'success' });
          console.log('企业信息保存成功:',res);
          wx.navigateBack()
        } else {
          wx.showToast({ title: '信息保存失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
        console.error(err);
      }
    });
  },
  // 处理输入事件，更新页面状态
  onEnterpriseNameInput(e) {
    this.setData({ enterpriseName: e.detail.value });
  },
  
  onOfficialWebsiteInput(e) {
    this.setData({ officialWebsite: e.detail.value });
  },
  
  onCreditCodeInput(e) {
    this.setData({ creditCode: e.detail.value });
  },
  
  onRegisteredPhoneInput(e) {
    this.setData({ registeredPhone: e.detail.value });
  },
  
  onBankOfDepositInput(e) {
    this.setData({ bankOfDeposit: e.detail.value });
  },
  
  onBankAccountNumberInput(e) {
    this.setData({ bankAccountNumber: e.detail.value });
  },
  
  onRegisteredAddressInput(e) {
    this.setData({ registeredAddress: e.detail.value });
  },
})