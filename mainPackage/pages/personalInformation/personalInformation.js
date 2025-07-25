Page({
    data: {
      nickName: "用户",
      phonenumber: "11111111111",
      email: null,
      sex: 0, 
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
      this.setData({ sex: 0 });
    },
  
    setFemale() {
      this.setData({ sex: 1 });
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
        this.profile(updatedUser);
      },

      profile(updatedUser) {
        wx.request({
          url: `${getApp().globalData.serverUrl}/diServer/system/user/profile`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${getApp().globalData.token}`
          },
          success: (res) => {
            if (res.data.code === 200) {
              const data = res.data.data || {};
              data.nickName = updatedUser.nickName;
              data.phonenumber = updatedUser.phonenumber;
              data.email = updatedUser.email;
              data.sex = updatedUser.sex;
              console.log('profile:', data);
              this.profileP(data);
            } else {
              this.setData({ 
                errorMsg: res.data.message || '获取数据失败',
              });
              console.log('errorMsg');
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
      profileP(data){
        wx.request({
            url: `${getApp().globalData.serverUrl}/diServer/system/user/profile`,
            method: 'PUT',
            header: {
              'Authorization': `Bearer ${getApp().globalData.token}`,
              'Content-Type': 'application/json'
            },
            data: data,
            success: (res) => {
              if (res.data.code == 200) {
                wx.showToast({
                  title:  '保存成功',
                  icon: 'success',
                  duration: 1500
                });
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              } else {
                wx.showToast({
                  title: '保存失败',
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
  });