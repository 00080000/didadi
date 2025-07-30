App({
    onLaunch: function () {
      // 从本地存储加载 token
      wx.setStorageSync('enterpriseId',  11);
      wx.setStorageSync('token',  this.globalData.token);
      const token = wx.getStorageSync('token');
      if (token) {
        // 有 token，验证有效性
        this.globalData.authenticated = true;
        this.globalData.token = token;
        this.checkTokenValidity(token);
        this.fetchAndSaveUserInfo(() => {
            wx.redirectTo({
              url: '/mainPackage/pages/home/home'
            });
          });
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
          {
            console.log('Hello！');
            //this.fetchAndSaveUserInfo(); 
          }
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
    // 请求并保存用户信息
    fetchAndSaveUserInfo() {
        wx.request({
            url: `${this.globalData.serverUrl}/diServer/getInfo`,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${this.globalData.token}`
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const userInfo = res.data.user || {};
                    const filteredUser = {
                    createBy: userInfo.createBy || '',
                    createTime: userInfo.createTime || '',
                    updateBy: userInfo.updateBy || null,
                    updateTime: userInfo.updateTime || null,
                    remark: userInfo.remark || '',
                    params: userInfo.params || {},
                    userId: userInfo.userId || '',
                    deptId: userInfo.deptId || null,
                    enterpriseId: userInfo.enterpriseId || '',
                    userName: userInfo.userName || '',
                    nickName: userInfo.nickName || '',
                    userType: userInfo.userType || '',
                    email: userInfo.email || '',
                    phonenumber: userInfo.phonenumber || '',
                    sex: userInfo.sex || 0,
                    avatar: userInfo.avatar || '',
                    password: userInfo.password || null,
                    status: userInfo.status || '',
                    delFlag: userInfo.delFlag || '',
                    loginIp: userInfo.loginIp || '',
                    loginDate: userInfo.loginDate || '',
                    dept: userInfo.dept || null,
                    roles: userInfo.roles || [],
                    roleIds: userInfo.roleIds || null,
                    postIds: userInfo.postIds || null,
                    roleId: userInfo.roleId || null,
                    keyword: userInfo.keyword || '',
                    enterprise: userInfo.enterprise || {},
                    admin: userInfo.admin || false
                };
                // 保存到全局数据和本地存储
                this.globalData.userInfo = filteredUser;
                wx.setStorageSync('userInfo', filteredUser);
                console.log('用户信息已保存', filteredUser);
            } else {
                console.log('获取用户信息失败', res.data.message);
            }
        },
        fail: (err) => {
            console.error('获取用户信息请求失败', err);
        }
    });
  },
    globalData: {
      userInfo: null,
      authenticated: false,
      serverUrl: 'http://121.199.52.199:8080',
<<<<<<< HEAD
      token: 'eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl91c2VyX2tleSI6IjFkNWZjM2Y0LTg4NjEtNDNlZi05YTE0LTMwYjU1NDI0YjU4NCJ9.8eGkrC4CC7NHFh7P2bOF4-snaa3ErcZgMQZeVT4s6hwz2vouxsk5ns4rsnd1XBfbfIVgWywT70e7wRyQPd2LSQ' // 存储认证 token
=======
      token: 'eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl91c2VyX2tleSI6IjdjYTgwNTU5LWYyY2QtNGFhOS1iYWU2LWEyOTE0YjE2MDlhMyJ9.9xMgAVoBgF6-LSgGpgdPcNi-ZYyG3M8DhsBrnu-ff-ZxpgiWJLSUq7oJjxH0QjEpo5z52moH2tNDxMf3Z0jz3w' // 存储认证 token
>>>>>>> main

    }
  });