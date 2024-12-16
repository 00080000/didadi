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
  changeShowDetail(e){
    const { index } = e.currentTarget.dataset;
    this.data.newMessage[index].showDetail=!this.data.newMessage[index].showDetail
    this.setData(this.data)
  }
})