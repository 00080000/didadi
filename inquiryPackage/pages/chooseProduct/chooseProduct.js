// quotePackage/pages/chooseProduct/chooseProduct.js
Page({
  data: {
    product:[
      {
        name:'商品名称111',
        number:1,
        price:234.51,
        type:'singleProduct'
      },
      {
        name:'组合商品名称111222',
        price:234.51,
        type:'combinationProduct'
      },
      {
        name:'商品名称11111111',
        number:1,
        price:234.51,
        type:'singleProduct'
      },
      {
        name:'商品名称11111',
        number:1,
        price:234.51,
        type:'singleProduct'
      },
      {
        name:'自定义商品名称112',
        number:1,
        price:234.51,
        type:'customProduct'
      },
      {
        name:'费用名称112111',
        total:0.15,
        price:1234.51,
        type:'feeName'
      },
    ],
    totalAmount:0.00,
    fileName:'小喇叭公司询价单',
    ifShow:false
  },
  onLoad(){
    let totalAmount=0;
    this.data.product.forEach(item=>{
      if(item.type=="singleProduct"||item.type=='customProduct'){
        totalAmount+=item.price*item.number
      } else {
        totalAmount+=item.price
      }
    })
    this.setData({
      totalAmount:totalAmount
    })
  },
  goToSetFormStyle(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/setFormStyle/setFormStyle',
    })
  },
  goToChooseProductFields(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseProductFields/chooseProductFields',
    })
  },
  goToAddProduct(){
    wx.navigateTo({
      url: '/inquiryPackage/pages/addNewProduct/addNewProduct',
    })
  },
  setIfShow(){
    this.setData({
      ifShow:!this.data.ifShow
    })
  },
  changeUp(e){
    const temp = this.data.product[e.currentTarget.dataset.index-1]
    this.data.product[e.currentTarget.dataset.index-1]=this.data.product[e.currentTarget.dataset.index]
    this.data.product[e.currentTarget.dataset.index]=temp
    this.setData({
      product:this.data.product
    })
  },
  changeDown(e){
    const temp = this.data.product[e.currentTarget.dataset.index+1]
    this.data.product[e.currentTarget.dataset.index+1]=this.data.product[e.currentTarget.dataset.index]
    this.data.product[e.currentTarget.dataset.index]=temp
    this.setData({
      product:this.data.product
    })
  },
  navigate(e){
    if(this.data.product[e.currentTarget.dataset.index].type=="singleProduct"){
      wx.navigateTo({
        url: '/inquiryPackage/pages/editChoosedSingleProduct/editChoosedSingleProduct',
      })
    } else if(this.data.product[e.currentTarget.dataset.index].type=="combinationProduct"){
      wx.navigateTo({
        url: '/inquiryPackage/pages/editChoosedCombinationProduct/editChoosedCombinationProduct',
      })
    } else if(this.data.product[e.currentTarget.dataset.index].type=="customProduct"){
      wx.navigateTo({
        url: '/inquiryPackage/pages/editChoosedCuntomProduct/editChoosedCuntomProduct',
      })
    } else if(this.data.product[e.currentTarget.dataset.index].type=="feeName"){
      wx.navigateTo({
        url: '/inquiryPackage/pages/editFee/editFee',
        })
    }
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  }
})