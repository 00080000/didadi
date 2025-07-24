// mainPackage/pages/systemManage/systemManage.js
Page({
  data: {
    nickName:"用户",
    phonenumber:11111111111,
    newMessageAmount:3
  },
  onLoad() {
      console.log('systemManage');
      this.loadUserInfo();
    this.fetchNewMsg();
  },
  // 加载用户信息
  loadUserInfo() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    this.setData({
        nickName: userInfo.nickName || "用户",
        phonenumber: userInfo.phonenumber || "未设置"
    });
  },

  fetchNewMsg() {
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/system/notice/myMsgList`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
            const data = res.data.data || []; 
            this.setData({
                newMessageAmount: data.length
          });
          console.log('NewMessage:',res.data.data);
        } else {
          // 请求失败，使用本地默认数据
          this.setData({ 
            errorMsg: res.data.message || '获取数据失败',
          });
          console.log('errorMsg');
        }
      },
      fail: (err) => {
        // 请求失败，使用本地默认数据
        this.setData({ 
          errorMsg: '网络请求失败',
        });
        console.error(err);
      },
    });
  },

  goToPersonalInformation(){
    wx.navigateTo({
      url: '/mainPackage/pages/personalInformation/personalInformation',
    })
  },
  goToEdiFirmInformation(){
    wx.navigateTo({
      url: '/mainPackage/pages/editFirmInformation/editFirmInformation',
    })
  },
  goToEditPassword(){
    wx.navigateTo({
      url: '/mainPackage/pages/editPassword/editPassword',
    })
  },
  goToMessage(){
    wx.navigateTo({
      url: '/mainPackage/pages/message/message',
    })
  },
  exit(){
    const app = getApp();
    app.globalData.userInfo = null;
    app.globalData.authenticated = false;
    app.token = null;
    wx.redirectTo({
      url: '/pages/login/login',
    })
  }
})