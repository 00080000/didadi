// mainPackage/pages/editPassword/editPassword.js
Page({
    data: {
      nickName: "用户",
      phonenumber: "11111111111",
      oldPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
  
    onLoad: function() {
      this.loadUserInfo();
    },
  
    loadUserInfo: function() {
      var app = getApp();
      var userInfo = app.globalData.userInfo || {};
      this.setData({
        nickName: userInfo.nickName ? userInfo.nickName : "用户",
        phonenumber: userInfo.phonenumber ? userInfo.phonenumber : "未设置"
      });
    },
  
    // 输入框值变化处理
    handleInputChange: function(e) {
      var field = e.currentTarget.dataset.field;
      var newData = {};
      newData[field] = e.detail.value;
      this.setData(newData);
    },
  
    // 表单验证
    validateForm: function() {
      var oldPassword = this.data.oldPassword;
      var newPassword = this.data.newPassword;
      var confirmPassword = this.data.confirmPassword;
  
      if (!oldPassword) {
        wx.showToast({ title: "请输入旧密码", icon: "none" });
        return false;
      }
  
      if (!newPassword) {
        wx.showToast({ title: "请输入新密码", icon: "none" });
        return false;
      }
  
      if (newPassword.length < 6||newPassword.length > 20) {
        wx.showToast({ title: "新密码长度在 6 到 20 个字符", icon: "none" });
        return false;
      }
  
      if (newPassword !== confirmPassword) {
        wx.showToast({ title: "两次输入的新密码不一致", icon: "none" });
        return false;
      }
  
      return true;
    },
  
    // 确认修改密码
    confirm: function() {
      if (!this.validateForm()) {
        return;
      }
  
      var oldPassword = this.data.oldPassword;
      var newPassword = this.data.newPassword;
      console.log(oldPassword,':::',newPassword);
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/system/user/profile/updatePwd?oldPassword=${oldPassword}&newPassword=${newPassword}`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            console.log('res:',res);
            wx.showToast({
                title:  '修改成功',
                icon: 'success',
                duration: 1500
              });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
          } else {
            // 请求失败
            this.setData({ 
              errorMsg: res.data.message || '修改失败',
            });
            wx.showToast({
                title: this.data.errorMsg ,
                icon: 'none',
                duration: 2000
              });
          }
        },
        fail: (err) => {
          // 请求失败
          this.setData({ 
            errorMsg: '网络请求失败',
          });
          console.error(err);
        },
      });
    },
  
    // 取消修改
    cancel: function() {
      wx.navigateBack();
    }
  });