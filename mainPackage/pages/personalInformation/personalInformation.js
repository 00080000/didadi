Page({
    data: {
      nickName: "用户",
      phonenumber: "11111111111",
      email: null,
      sex: 0, // 0-女，1-男
      isLoaded: false 
    },
  
    onLoad() {
      this.loadUserInfo();
    },
  
    loadUserInfo() {
      const app = getApp();
      // 优先从全局数据获取
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
  
      if (userInfo) {
        this.setData({
          nickName: userInfo.nickName || "请输入姓名",
          phonenumber: userInfo.phonenumber || "请输入电话",
          email: userInfo.email || "请输入邮箱",
          sex: userInfo.sex !== undefined ? userInfo.sex : 0, 
          isLoaded: true
        });
      } else {
        this.setData({
          nickName: "请输入姓名",
          phonenumber: "请输入电话",
          email: "请输入邮箱",
          isLoaded: true
        });
        wx.showToast({
          title: '请完善个人信息',
          icon: 'none',
          duration: 2000
        });
      }
    },
  
    setMale() {
      this.setData({ sex: 1 });
    },
  
    setFemale() {
      this.setData({ sex: 0 });
    },
  
    cancel() {
      wx.navigateBack();
    },
  
    confirm() {
        const { nickName, phonenumber, email, sex } = this.data;
        // 简单校验必填项
        if (!nickName || nickName === "请输入姓名") {
          wx.showToast({ title: '请输入姓名', icon: 'none' });
          return;
        }
        if (!phonenumber || phonenumber === "请输入电话") {
          wx.showToast({ title: '请输入电话', icon: 'none' });
          return;
        }
      
        const originalUser = getApp().globalData.userInfo || {};
        const updatedUser = Object.assign({}, originalUser, {
          nickName,
          phonenumber,
          email,
          sex
        });
      
        // 保存到全局数据和本地存储
        getApp().globalData.userInfo = updatedUser;
        wx.setStorageSync('userInfo', updatedUser);
      
        wx.showToast({ title: '信息已保存', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      }
  });