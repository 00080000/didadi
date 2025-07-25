Page({
  data: {
    quotation:[
      {
        name:'询价单2024040319008882',
        date:'2024.04.13',
        time:'20:09:45',
      },
      {
        name:'询价单2024040319008881',
        date:'2024.04.13',
        time:'20:09:45',
      },
      {
        name:'询价单20240403190088811',
        date:'2024.04.13',
        time:'20:09:45',
      },
      {
        name:'询价单2024040319008883',
        date:'2024.04.13',
        time:'20:09:45',
      },       
      {
        name:'询价单2024040319008885',
        date:'2024.04.13',
        time:'20:09:45',
      }
    ],
    filterQuotation:[],
    ifShowSearch:false,
    keyword:''
  },
  onLoad(){
    this.setData({
      filterQuotation:this.data.quotation
    })
  },
  inputQuotation(){
    if(this.data.keyword==''){
      this.setData({
        filterQuotation:this.data.quotation
      })
    } else {
      this.setData({
        filterQuotation:this.data.quotation.filter(item => item.name.includes(this.data.keyword))
      })
    }
  },
  showSearch(){
    this.setData({
      ifShowSearch:!this.data.ifShowSearch,
      filterQuotation:this.data.quotation,
      keyword:''
    })
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
  goToQuote(){
    wx.redirectTo({
      url: '/quotePackage/pages/sendedQuotationForm/sendedQuotationForm',
    })
  },
  goToViewRecievedQuotation(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/viewRecievedInquiry/viewRecievedInquiry',
    })
  },
  goToSendedQuotation(){
    wx.redirectTo({
      url: '/inquiryPackage/pages/sendedInquiryForm/sendedInquiryForm',
    })
  },
  goToAddQuotation(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/addInquiry/addInquiry',
    })
  },
  navigateToMain(){
    wx.redirectTo({
      url: '/mainPackage/pages/home/home',
    })
  },
  navigateToMerchant(){
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    })
  },
  navigateToProduct(){
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    })
  },
})