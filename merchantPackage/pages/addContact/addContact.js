Page({
    data: {
      pickerValue: [],
      pickerCompanyIds: [],
      index: null,
      companyId: '',
      companyName: '',
      defaultFlag: 0,
      id: '',
      email: "2322353434@qq.com",
      tel: "13432435459",
      userName: "马卡龙",
      templateId: '',
      isAdd: false,
      // 新增错误提示信息
      telError: '',
      emailError: ''
    },
    onLoad() {
      // 从本地缓存获取companyData
      const companyData = wx.getStorageSync('companyData') || [];
      const pickerValue = companyData.map(item => item.companyName);
      const pickerCompanyIds = companyData.map(item => item.companyId);
      
      this.setData({
        pickerValue,
        pickerCompanyIds
      });
      
      const eventChannel = this.getOpenerEventChannel();
      const that = this;
      eventChannel.on('acceptDataFromOpenerPage', function(data) {
        const item = data.data || {};
        if (Object.keys(item).length === 0) {
          that.setData({
            isAdd: true
          });
        }
        
        let index = that.data.pickerValue.findIndex(name => name === item.companyName);
        if (index === -1) {
          index = null; 
        }
  
        that.setData({
          index: index,
          companyName: item.companyName || '',
          defaultFlag: item.defaultFlag || 0,
          companyId: item.companyId || '',
          email: item.email || '',
          tel: item.tel || '',
          userName: item.userName || '',
          id: item.id || '',
          templateId: item.templateId || ''
        });
      });
    },
    pickerChange(e) {
      const index = e.detail.value;
      this.setData({
        index: index,
        companyName: this.data.pickerValue[index],
        companyId: this.data.pickerCompanyIds[index]
      });
    },
    // 姓名输入处理
    handleUserNameInput(e) {
      this.setData({
        userName: e.detail.value
      });
    },
    // 电话输入处理 - 新增实时验证
    handleTelInput(e) {
      const tel = e.detail.value;
      let telError = '';
      
      // 简单手机号验证：11位数字，以1开头
      if (tel && (!/^1\d{10}$/.test(tel))) {
        telError = '请输入有效的11位手机号';
      }
      
      this.setData({
        tel: tel,
        telError: telError
      });
    },
    // 邮箱输入处理 - 新增实时验证
    handleEmailInput(e) {
      const email = e.detail.value;
      let emailError = '';
      
      // 简单邮箱验证：包含@和.
      if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        emailError = '请输入有效的邮箱地址';
      }
      
      this.setData({
        email: email,
        emailError: emailError
      });
    },
    // 是否默认复选框处理
    handleDefaultChange(e) {  
        this.setData({
            defaultFlag: this.data.defaultFlag === 1 ? 0 : 1  
          });
    },
    cancel() {
      wx.navigateBack();
    },
    confirm() {
      // 收集表单数据
      const {
        companyName,
        userName,
        tel,
        email,
        defaultFlag,
        companyId,
        templateId,
        id
      } = this.data;
  
      // 重置错误提示
      this.setData({
        telError: '',
        emailError: ''
      });
      
      // 表单验证
      let isValid = true;
      
      if (!companyName) {
        wx.showToast({ title: '请选择商家', icon: 'none', duration: 1500 });
        isValid = false;
      } else if (!userName) {
        wx.showToast({ title: '请填写姓名', icon: 'none', duration: 1500 });
        isValid = false;
      } else if (!tel) {
        this.setData({ telError: '请输入手机号' });
        isValid = false;
      } else if (!/^1\d{10}$/.test(tel)) {
        this.setData({ telError: '请输入有效的11位手机号' });
        isValid = false;
      } else if (!email) {
        this.setData({ emailError: '请输入邮箱' });
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.setData({ emailError: '请输入有效的邮箱地址' });
        isValid = false;
      }
      
      if (!isValid) return;
  
      // 构造提交数据
      const addData = {
        userName,
        tel,
        email: email || '',
        defaultFlag,
        companyId: companyId || ''
      };
      const editData = {
        companyName,
        userName,
        tel,
        email: email || '',
        defaultFlag,
        companyId: companyId || '',
        templateId,
        id
      };
      const submitData = this.data.isAdd ? addData : editData;
      console.log('提交数据:', submitData);

      // 发送请求
      const url = this.data.isAdd 
        ? `${getApp().globalData.serverUrl}/diServer/companyLinkman/addLinkman` 
        : `${getApp().globalData.serverUrl}/diServer/companyLinkman/editLinkman`;
  
      wx.request({
        url: url,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`,
          'Content-Type': 'application/json'
        },
        data: submitData,
        success: (res) => {
          if (res.data.code == 200) {
            wx.showToast({
              title: this.data.isAdd ? '新增成功' : '修改成功',
              icon: 'success',
              duration: 1500
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showToast({
              title: res.data.msg || (this.data.isAdd ? '新增失败' : '修改失败'),
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: (err) => {
          console.error('请求失败', err);
          wx.showToast({
            title: '网络错误',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }
  })
