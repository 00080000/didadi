// quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation.js
Page({
  data: {
    number:'2024040319008882'
  },
  goToDownloadQuotation(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/downloadRecievedInquiry/downloadRecievedInquiry',
    })
  },
  goToDownloadAttachment(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/downloadAttachment/downloadAttachment',
    })
  }
})