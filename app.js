App({
    onLaunch: function () {
      // 从本地存储加载 token
      wx.setStorageSync('enterpriseId',  11);
      wx.setStorageSync('token',  this.globalData.token);
      const token = wx.getStorageSync('token');
      console.log('从本地存储获取的token:', token);
      if (token) {
        // 有 token，验证有效性
        this.globalData.authenticated = true;
        this.globalData.token = token;
        this.checkTokenValidity(token);
      } else {
        // 无 token，跳转登录页
        wx.redirectTo({
            url: '/pages/login/login'
          });
      }
    },
  
    // 验证 token 有效性
    checkTokenValidity(token) {
      wx.request({
        url: `${this.globalData.serverUrl}/diServer/test/user/test`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          if (res.statusCode !== 200) {
            // token 无效，清除并跳转登录
            this.clearAuthInfo();
          }
          else
          console.log('Hello！');
        },
        fail: () => {
          // 请求失败，清除并跳转登录
          this.clearAuthInfo();
        }
      });
    },
  
    // 清除认证信息
    clearAuthInfo() {
      this.globalData.authenticated = false;
      this.globalData.token = '';
      wx.removeStorageSync('token');
      this.navigateToLogin();
    },
  
    // 跳转到登录
    navigateToLogin() {
      wx.redirectTo({
        url: '/pages/login/login'
      });
    },
  
    globalData: {
      userInfo: null,
      authenticated: false,
      serverUrl: 'http://121.199.52.199:8080',
      token: 'eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl91c2VyX2tleSI6IjY2YzhlMGE2LTAwNWYtNDBhYS04OTZlLWJkZjQwY2EyZGUwNyJ9.RvgB6-QaTFkb36kcj3HttIwf2-weJEKad87uvyDJWh-q1voa6nIjR4TueWeGBVNmE6n7shbP1LVEKTuEk95J9Q' // 存储认证 token


    }
  });