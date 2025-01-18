Page({
  data: {
    name:'小喇叭公司报价单（初稿）',
    project:'系统集成扩容二期采购项目',
    file:[
      {
        name:'公司介绍2024年最新版.doc',
        type:'doc'
      },
      {
        name:'公司产品介绍2024年最新版.pdf',
        type:'pdf'
      },
      {
        name:'公司介绍2024年最新版.xls',
        type:'xls'
      }
    ]
  },
  confirmDelete(){
    wx.showModal({
      title: '确认',
      content: '确定要删除吗？',
      success (res) {
          if (res.confirm) {
              console.log('用户点击确定')
          } else if (res.cancel) {
              console.log('用户点击取消')
          }
      }
  });
  },
})