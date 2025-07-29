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
  onLoad(){
    const app = getApp();
    const quoteFileList = app.globalData.submitData.quoteFileList;
    const fileList = quoteFileList.map(file => {
        const fileType = file.fileType || file.fileName.split('.').pop() || '';
        return {
            fileName: file.fileName,       // 文件名
          type: fileType.toLowerCase() // 文件类型（转为小写）
        };
      });
      this.setData({
        file : fileList
    });
    console.log(this.data.file);
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