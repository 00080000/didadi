// mainPackage/pages/message/message.js
Page({
  data: {
    name:"用户",
    phone:11111111111,
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
        //     this.setData({
        //         newMessage: data
        //   });
          console.log('Message:',res.data.data);
        } else {
          // 请求失败，使用本地默认数据
          this.setData({ 
            errorMsg: res.data.message || '获取数据失败，使用默认数据',
          });
          console.log('errorMsg');
        }
      },
      fail: (err) => {
        this.setData({ 
          errorMsg: '网络请求失败，使用默认数据',
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
  gotowatch(){
    wx.navigateTo({
        url: '/mainPackage/pages/watch/watch',
      })
  }
})