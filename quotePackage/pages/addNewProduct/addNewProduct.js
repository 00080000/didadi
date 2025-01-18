// quotePackage/pages/addNewProduct/addNewProduct.js
Page({
  data: {
    index:1,
    showSelectedSingleProduct:false,
    showSelectedCombinationProduct:false,
    showSelectedTemporaryProduct:false,
    singleProduct:[
      {
        name:'商品名称1',
        type:'型号AAAA',
        number:1,
        select:false,
        id:1
      },
      {
        name:'商品名称2',
        type:'型号AAAA',
        number:1,
        select:false,
        id:2
      },
      {
        name:'商品名称3',
        type:'型号AAAA',
        number:1,
        select:false,
        id:3
      },
      {
        name:'商品名称4',
        type:'型号AAAA',
        number:1,
        select:false,
        id:4
      },
      {
        name:'商品名称5',
        type:'型号AAAA',
        number:1,
        select:false,
        id:5
      },
      {
        name:'商品名称6',
        type:'型号AAAA',
        number:1,
        select:false,
        id:6
      },
      {
        name:'商品名称111',
        type:'型号AAAA',
        number:1,
        select:false,
        id:7
      }
    ],
    combinationProduct:[
      {
        name:'商品名称1',
        number:1,
        select:false,
        id:1
      },
      {
        name:'商品名称2',
        number:1,
        select:false,
        id:2
      },
      {
        name:'商品名称111',
        number:1,
        select:false,
        id:3
      }
    ],
    temporaryProduct:[
      {
        name:'商品名称1',
        number:1,
        select:false,
        id:1
      },
      {
        name:'商品名称2',
        number:1,
        select:false,
        id:2
      },
      {
        name:'商品名称3',
        number:1,
        select:false,
        id:3
      },
      {
        name:'商品名称4',
        number:1,
        select:false,
        id:4
      },
      {
        name:'商品名称5',
        number:1,
        select:false,
        id:5
      },
      {
        name:'商品名称6',
        number:1,
        select:false,
        id:6
      },
      {
        name:'商品名称7',
        number:1,
        select:false,
        id:7
      },
      {
        name:'商品名称111',
        number:1,
        select:false,
        id:8
      }
    ],
    filterSingleProduct:[],
    filterCombinationProduct:[],
    filterTemporaryProduct:[],
    keyword:'',
    combinationKeyword:'',
    temporaryKeyword:''
  },
  onLoad(){
    this.setData({
      filterSingleProduct:this.data.singleProduct,
      filterCombinationProduct:this.data.combinationProduct,
      filterTemporaryProduct:this.data.temporaryProduct
    })
  },
  chooseSingleProduct(){
    this.setData({
      index:1
    })
  },
  chooseCombinationProduct(){
    this.setData({
      index:2
    })
  },
  chooseTemporaryProduct(){
    this.setData({
      index:3
    })
  },
  inputProduct(){
    if(this.data.showSelectedSingleProduct){
      if(this.data.keyword!='') {
        this.setData({
          filterSingleProduct:this.data.singleProduct.filter(item => item.name.includes(this.data.keyword)&&item.select==true)
        })
      } else {
        this.setData({
          filterSingleProduct:this.data.singleProduct.filter(item => item.select==true)
        })
      }
    } else {
      if(this.data.keyword!='') {
        this.setData({
          filterSingleProduct:this.data.singleProduct.filter(item => item.name.includes(this.data.keyword))
        })
      } else if(this.data.keyword==''){
        this.setData({
          filterSingleProduct:this.data.singleProduct
        })
      }
    }
  },
  inputCombinationProduct(){
    if (this.data.showSelectedCombinationProduct) {
      if (this.data.combinationKeyword !== '') {
        this.setData({
          filterCombinationProduct: this.data.combinationProduct.filter(item => item.name.includes(this.data.combinationKeyword) && item.select === true)
        });
      } else {
        this.setData({
          filterCombinationProduct: this.data.combinationProduct.filter(item => item.select === true)
        });
      }
    } else {
      if (this.data.combinationKeyword !== '') {
        this.setData({
          filterCombinationProduct: this.data.combinationProduct.filter(item => item.name.includes(this.data.combinationKeyword))
        });
      } else if (this.data.combinationKeyword === '') {
        this.setData({
          filterCombinationProduct: this.data.combinationProduct
        });
      }
    }
  },
  inputTemporaryProduct(){
    if (this.data.showSelectedTemporaryProduct) {
      if (this.data.temporaryKeyword !== '') {
        this.setData({
          filterTemporaryProduct: this.data.temporaryProduct.filter(item => item.name.includes(this.data.temporaryKeyword) && item.select === true)
        });
      } else {
        this.setData({
          filterTemporaryProduct: this.data.temporaryProduct.filter(item => item.select === true)
        });
      }
    } else {
      if (this.data.temporaryKeyword !== '') {
        this.setData({
          filterTemporaryProduct: this.data.temporaryProduct.filter(item => item.name.includes(this.data.temporaryKeyword))
        });
      } else if (this.data.temporaryKeyword === '') {
        this.setData({
          filterTemporaryProduct: this.data.temporaryProduct
        });
      }
    }
  },
  singleProductSwitchChange: function(e) {
    if(!this.data.showSelectedSingleProduct){
      if(this.data.keyword!='') {
        this.setData({
          showSelectedSingleProduct:!this.data.showSelectedSingleProduct,
          filterSingleProduct:this.data.singleProduct.filter(item => item.name.includes(this.data.keyword)&&item.select==true)
        })
      } else {
        this.setData({
          showSelectedSingleProduct:!this.data.showSelectedSingleProduct,
          filterSingleProduct:this.data.singleProduct.filter(item => item.select==true)
        })
      }
    } else {
      if(this.data.keyword!='') {
        this.setData({
          showSelectedSingleProduct:!this.data.showSelectedSingleProduct,
          filterSingleProduct:this.data.singleProduct.filter(item => item.name.includes(this.data.keyword))
        })
      } else if(this.data.keyword==''){
        this.setData({
          showSelectedSingleProduct:!this.data.showSelectedSingleProduct,
          filterSingleProduct:this.data.singleProduct
        })
      }
    }
  },
  combinationProductSwitchChange: function(e) {
    if (!this.data.showSelectedCombinationProduct) {
      if (this.data.combinationKeyword !== '') {
        this.setData({
          showSelectedCombinationProduct:!this.data.showSelectedCombinationProduct,
          filterCombinationProduct: this.data.combinationProduct.filter(item => item.name.includes(this.data.combinationKeyword) && item.select === true)
        });
      } else {
        this.setData({
          showSelectedCombinationProduct:!this.data.showSelectedCombinationProduct,
          filterCombinationProduct: this.data.combinationProduct.filter(item => item.select === true)
        });
      }
    } else {
      if (this.data.combinationKeyword !== '') {
        this.setData({
          showSelectedCombinationProduct:!this.data.showSelectedCombinationProduct,
          filterCombinationProduct: this.data.combinationProduct.filter(item => item.name.includes(this.data.combinationKeyword))
        });
      } else if (this.data.combinationKeyword === '') {
        this.setData({
          showSelectedCombinationProduct:!this.data.showSelectedCombinationProduct,
          filterCombinationProduct: this.data.combinationProduct
        });
      }
    }
  },
  temporaryProductSwitchChange: function(e) {
    if (!this.data.showSelectedTemporaryProduct) {
      if (this.data.temporaryKeyword !== '') {
        this.setData({
          showSelectedTemporaryProduct:!this.data.showSelectedTemporaryProduct,
          filterTemporaryProduct: this.data.temporaryProduct.filter(item => item.name.includes(this.data.temporaryKeyword) && item.select === true)
        });
      } else {
        this.setData({
          showSelectedTemporaryProduct:!this.data.showSelectedTemporaryProduct,
          filterTemporaryProduct: this.data.temporaryProduct.filter(item => item.select === true)
        });
      }
    } else {
      if (this.data.temporaryKeyword !== '') {
        this.setData({
          showSelectedTemporaryProduct:!this.data.showSelectedTemporaryProduct,
          filterTemporaryProduct: this.data.temporaryProduct.filter(item => item.name.includes(this.data.temporaryKeyword))
        });
      } else if (this.data.temporaryKeyword === '') {
        this.setData({
          showSelectedTemporaryProduct:!this.data.showSelectedTemporaryProduct,
          filterTemporaryProduct: this.data.temporaryProduct
        });
      }
    }
  },
  selectSingleProduct(e){
    const singleProduct=this.data.singleProduct
    singleProduct.forEach(item => {
      if(e.currentTarget.dataset.index==item.id) {
        item.select=!item.select
      }
    })
    if(this.data.keyword!='') {
      this.setData({
        singleProduct:singleProduct,
        filterSingleProduct:this.data.singleProduct.filter(item => item.name.includes(this.data.keyword))
      })
    } else if(this.data.keyword==''){
      this.setData({
        singleProduct:singleProduct,
        filterSingleProduct:this.data.singleProduct
      })
    }
  },
  selectCombinationProduct(e){
    const combinationProduct=this.data.combinationProduct
    combinationProduct.forEach(item => {
      if(e.currentTarget.dataset.index==item.id) {
        item.select=!item.select
      }
    })
    if (this.data.combinationKeyword !== '') {
      this.setData({
        combinationProduct:combinationProduct,
        filterCombinationProduct: this.data.combinationProduct.filter(item => item.name.includes(this.data.combinationKeyword))
      });
    } else if (this.data.combinationKeyword === '') {
      this.setData({
        combinationProduct:combinationProduct,
        filterCombinationProduct: this.data.combinationProduct
      });
    }
  },
  selectTemporaryProduct(e){
    const temporaryProduct=this.data.temporaryProduct
    temporaryProduct.forEach(item => {
      if(e.currentTarget.dataset.index==item.id) {
        item.select=!item.select
      }
    })
    if (this.data.temporaryKeyword !== '') {
      this.setData({
        temporaryProduct:temporaryProduct,
        filterTemporaryProduct: this.data.temporaryProduct.filter(item => item.name.includes(this.data.temporaryKeyword))
      });
    } else if (this.data.temporaryKeyword === '') {
      this.setData({
        temporaryProduct:temporaryProduct,
        filterTemporaryProduct: this.data.temporaryProduct
      });
    }
  },
  addSingleProduct(e){
    const singleProduct=this.data.singleProduct
    singleProduct.forEach(item => {
      if(e.currentTarget.dataset.index==item.id) {
        item.number++
      }
    })
    if(this.data.keyword!='') {
      this.setData({
        singleProduct:singleProduct,
        filterSingleProduct:this.data.singleProduct.filter(item => item.name.includes(this.data.keyword))
      })
    } else if(this.data.keyword==''){
      this.setData({
        singleProduct:singleProduct,
        filterSingleProduct:this.data.singleProduct
      })
    }
  },
  subSingleProduct(e){
    const singleProduct=this.data.singleProduct
    singleProduct.forEach(item => {
      if(e.currentTarget.dataset.index==item.id&&item.number>1) {
        item.number--
      }
    })
    if(this.data.keyword!='') {
      this.setData({
        singleProduct:singleProduct,
        filterSingleProduct:this.data.singleProduct.filter(item => item.name.includes(this.data.keyword))
      })
    } else if(this.data.keyword==''){
      this.setData({
        singleProduct:singleProduct,
        filterSingleProduct:this.data.singleProduct
      })
    }
  },
  addCombinationProduct(e){
    const combinationProduct=this.data.combinationProduct
    combinationProduct.forEach(item => {
      if(e.currentTarget.dataset.index==item.id) {
        item.number++
      }
    })
    if (this.data.combinationKeyword !== '') {
      this.setData({
        combinationProduct:combinationProduct,
        filterCombinationProduct: this.data.combinationProduct.filter(item => item.name.includes(this.data.combinationKeyword))
      });
    } else if (this.data.combinationKeyword === '') {
      this.setData({
        combinationProduct:combinationProduct,
        filterCombinationProduct: this.data.combinationProduct
      });
    }
  },
  subCombinationProduct(e){
    const combinationProduct=this.data.combinationProduct
    combinationProduct.forEach(item => {
      if(e.currentTarget.dataset.index==item.id&&item.number>1) {
        item.number--
      }
    })
    if (this.data.combinationKeyword !== '') {
      this.setData({
        combinationProduct:combinationProduct,
        filterCombinationProduct: this.data.combinationProduct.filter(item => item.name.includes(this.data.combinationKeyword))
      });
    } else if (this.data.combinationKeyword === '') {
      this.setData({
        combinationProduct:combinationProduct,
        filterCombinationProduct: this.data.combinationProduct
      });
    }
  },
  addTemporaryProduct(e){
    const temporaryProduct=this.data.temporaryProduct
    temporaryProduct.forEach(item => {
      if(e.currentTarget.dataset.index==item.id) {
        item.number++
      }
    })
    if (this.data.temporaryKeyword !== '') {
      this.setData({
        temporaryProduct:temporaryProduct,
        filterTemporaryProduct: this.data.temporaryProduct.filter(item => item.name.includes(this.data.temporaryKeyword))
      });
    } else if (this.data.temporaryKeyword === '') {
      this.setData({
        temporaryProduct:temporaryProduct,
        filterTemporaryProduct: this.data.temporaryProduct
      });
    }
  },
  subTemporaryProduct(e){
    const temporaryProduct=this.data.temporaryProduct
    temporaryProduct.forEach(item => {
      if(e.currentTarget.dataset.index==item.id&&item.number>1) {
        item.number--
      }
    })
    if (this.data.temporaryKeyword !== '') {
      this.setData({
        temporaryProduct:temporaryProduct,
        filterTemporaryProduct: this.data.temporaryProduct.filter(item => item.name.includes(this.data.temporaryKeyword))
      });
    } else if (this.data.temporaryKeyword === '') {
      this.setData({
        temporaryProduct:temporaryProduct,
        filterTemporaryProduct: this.data.temporaryProduct
      });
    }
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  },
})