// mainPackage/pages/message/message.js
Page({
  data: {
    nickName:"用户",
    phonenumber:11111111111,
    newMessage:[
      {
        city:'广州',
        firm:'小喇叭信息科技有限公司',
        number:'202404170000612766',
        showDetail:true
      },
      {
        city:'长沙',
        firm:'小喇叭信息科技有限公司',
        number:'202404170000612767',
        showDetail:true
      },
      {
        city:'上海',
        firm:'小喇叭信息科技有限公司',
        number:'20202404170000612768',
        showDetail:false
      },    
      {
        city:'深圳',
        firm:'小喇叭信息科技有限公司',
        number:'20202404170000612768',
        showDetail:false
      }
    ]
  },
  onLoad() {
    console.log('message');
  this.fetchNewMsg();
  this.loadUserInfo();
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
            const originalData = res.data.data || [];
            const data = originalData.map(item => ({
              ...item,
              showDetail: false
            }));
            this.setData({
                newMessage: data
          });
          console.log('Message:',this.data.newMessage);
        } else {
          // 请求失败
          this.setData({ 
            errorMsg: res.data.message || '获取数据失败',
          });
          console.log('errorMsg');
        }
      },
      fail: (err) => {
        this.setData({ 
          errorMsg: '网络请求失败',
        });
        console.error(err);
      },
    });
  },
  changeShowDetail(e){
    const { index } = e.currentTarget.dataset;
    this.data.newMessage[index].showDetail=!this.data.newMessage[index].showDetail
    this.setData(this.data)
  },
  gotowatch(e){
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
        url: `/quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation?id=${id}`
      });
  },
  readed(e){
    const id = e.currentTarget.dataset.id;
    wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/system/notice/readedMsg/${id}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            this.fetchNewMsg();
          } else {
            // 请求失败
            this.setData({ 
              errorMsg: res.data.message || '获取数据失败',
            });
            console.log('errorMsg');
          }
        },
        fail: (err) => {
          this.setData({ 
            errorMsg: '网络请求失败',
          });
          console.error(err);
        },
      });

  }
})