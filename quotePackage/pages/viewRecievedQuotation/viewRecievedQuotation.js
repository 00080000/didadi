// quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation.js
Page({
    data: {
        item: {
            name: '001'
        }
    },
    onLoad(options) {
        const name = options.name;
        if (name) {
            this.setData({
                'item.name': name
            });
        }
    },
  goToDownloadQuotation(){
    wx.navigateTo({
      url: '/quotePackage/pages/downloadRecievedQuotation/downloadRecievedQuotation',
    })
  },
  goToDownloadAttachment(){
    wx.navigateTo({
      url: '/quotePackage/pages/downloadAttachment/downloadAttachment',
    })
  }
})