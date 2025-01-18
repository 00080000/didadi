// quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation.js
Page({
  data: {
    number:'2024040319008882'
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