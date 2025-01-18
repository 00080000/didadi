Page({
  data: {
    quotation:[
      {
        name:'报价单2024040319008882',
        date:'2024.04.13',
        time:'20:09:45',
        amount:'331.58',
        status:0
      },
      {
        name:'报价单2024040319008883',
        date:'2024.04.13',
        time:'20:09:45',
        amount:'331.58',
        status:1
      },
      {
        name:'报价单2024040319008884',
        date:'2024.04.13',
        time:'20:09:45',
        amount:'331.58',
        status:1
      },
      {
        name:'报价单2024040319008885',
        date:'2024.04.13',
        time:'20:09:45',
        amount:'331.58',
        status:0
      },  {
        name:'报价单2024040319008882',
        date:'2024.04.13',
        time:'20:09:45',
        amount:'331.58',
        status:1
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
  edit(){
    wx.navigateTo({
      url: '/quotePackage/pages/addQuotation/addQuotation',
    })
  },
  copy(){
    wx.showToast({
      title: '复制成功',
      icon:'none',
    })
  },
  share(){
    wx.showActionSheet({
      itemList: ['系统内发送','生成二维码','复制链接','发送邮件','分享至微信'],
      success:function(res){
        switch(res.tapIndex) {
          case 0 : {
            wx.navigateTo({
              url: '/quotePackage/pages/shareWithSystem/shareWithSystem',
            })
            break
          }
          case 1 : {
            wx.navigateTo({
              url: '/quotePackage/pages/shareWithCode/shareWithCode',
            })
            break
          }
          case 2 : {
            wx.showToast({
              title: '复制成功',
              icon:'none',
            })
            break
          };
          case 3 : {
            wx.navigateTo({
              url: '/quotePackage/pages/shareWithEmail/shareWithEmail',
            })
            break
          }
          case 4 : {
            break
          };
        }
      },
      fail:function(err){
        wx.showToast({
          title: err.errMsg+'，请稍后重试',
          icon:'none',
        })
      }
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
  goToViewRecievedQuotation(){
    wx.navigateTo({
      url: '/quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation',
    })
  },
  goToInquiry(){
    wx.redirectTo({
      url: '/inquiryPackage/pages/sendedInquiryForm/sendedInquiryForm',
    })
  },
  goToRecievedQuotation(){
    wx.redirectTo({
      url: '/quotePackage/pages/recievedQuotationForm/recievedQuotationForm',
    })
  },
  goToAddQuotation(){
    wx.navigateTo({
      url: '/quotePackage/pages/addQuotation/addQuotation',
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