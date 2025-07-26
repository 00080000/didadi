// quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation.js
const app = getApp();
// 引入工具函数
const { numberToChinese } = require('../../../utils/util');

Page({
  data: {
    item: null,
    tableColumns: [],
    tableData: [],
    amountChinese: '' // 用于存储金额大写
  },

  onLoad() {
    // 从appData获取数据
    this.setData({
      item: app.globalData.currentQuoteItem
    }, () => {
      console.log('收到的数据：', this.data.item);
      // 解析表格列配置
      if (this.data.item.dataJson) {
        try {
          const columns = JSON.parse(this.data.item.dataJson);
          this.setData({ tableColumns: columns });
        } catch (e) {
          console.error('解析表格配置失败', e);
        }
      }
      console.log('chinese');
      // 转换金额为大写并存储
      if (this.data.item.totalPrice) {
        const chinese = numberToChinese(this.data.item.totalPrice);
        console.log('chinese:',chinese);
        this.setData({
          amountChinese: chinese
        });
      }
      else{
        console.log('chinese');
      }
    });
  },

  goToDownloadQuotation() {
    wx.navigateTo({
      url: '/quotePackage/pages/downloadRecievedQuotation/downloadRecievedQuotation',
    })
  },

  goToDownloadAttachment() {
    wx.navigateTo({
      url: '/quotePackage/pages/downloadAttachment/downloadAttachment',
    })
  },

  // 打印功能
  printQuotation() {
    wx.showToast({
      title: '准备打印...',
      icon: 'loading',
      duration: 1000
    })
    // 实际项目中可调用打印API
  }
})