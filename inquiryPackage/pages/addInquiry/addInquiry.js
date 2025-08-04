Page({
  data: {
    product: [],
    totalAmount: 0.00,
    fileName: '小喇叭公司询价单',
    ifShow: false,
    project: '系采购项目名称',
    time: '',
    validityTime: '',
    merchant: {
      firm: '',
      firmId: '178',
      name: '',
      phone: '',
      email: ''
    },
    originalProductIds: [],
    attachment: [],
    totalPrice: '0.00',
    description: '',
    isSubmitting: false,
    id: '',
    isNew: true,
    tableColumns: [
      { label: "序号", width: "50px", background: "#ececec", "align": "center" },
      { label: "商品名称", "align": "center", code: "productName" },
      { label: "商品编码", "align": "center", code: "productCode" },
      { label: "单价", "align": "center", code: "unitPrice" },
      { label: "数量", background: "#ececec", "align": "left", code: "quantity" },
      { label: "备注", background: "#ececec", "align": "left", code: "remark", width: "140px" }
    ],
    copyMode: 0 // 0-正常模式，1-复制模式
  },

  onLoad(options) {
    const { id, copyMode } = options;
    this.setData({
      id: id || '',
      isNew: !id,
      copyMode: copyMode ? 1 : 0
    });

    // 加载历史商品（如果有）
    if (options?.currentProducts) {
      try {
        const historyProducts = JSON.parse(decodeURIComponent(options.currentProducts));
        this.setData({ product: historyProducts }, () => {
          this.calculateTotal();
        });
      } catch (err) {
        console.error('解析历史商品数据失败:', err);
      }
    }

    // 新建或复制模式：初始化日期
    if (this.data.isNew || this.data.copyMode === 1) {
      const today = this.formatDate(new Date());
      this.setData({ time: today });
      this.calculateValidityTime();
    } else {
      // 编辑模式：加载原数据
      this.loadInquiryData(id);
    }
  },

  loadInquiryData(id) {
    wx.showLoading({ title: '加载中...' });
    const app = getApp();

    wx.request({
      url: `${app.globalData.serverUrl}/diServer/inQuote/${id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token || ''}`
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200) {
          const data = res.data.data || res.data;
          const quote = data.quote || data;
          
          // 解析商品列表（与网页端保持一致）
          let productList = [];
          if (Array.isArray(data.productGroupList)) {
            data.productGroupList.forEach(group => {
              if (Array.isArray(group.quoteProductList)) {
                group.quoteProductList.forEach((item, index) => {
                  let productData = {};
                  if (item.productData) {
                    try {
                      productData = typeof item.productData === 'string' 
                        ? JSON.parse(item.productData) 
                        : item.productData;
                    } catch (e) {
                      console.error('解析productData失败:', e);
                    }
                  }

                  productList.push({
                    id: item.productId || item.id || `temp_${Date.now()}_${index}`,
                    name: productData.productName || item.productName || '未知商品',
                    productCode: productData.productCode || item.productCode || '',
                    price: Number(item.unitPrice || productData.unitPrice || 0),
                    number: Number(item.quantity || 1),
                    type: item.type || 'singleProduct',
                    remark: item.remark || '',
                    productName: productData.productName || item.productName || '未知商品',
                    unitPrice: Number(item.unitPrice || productData.unitPrice || 0).toFixed(2),
                    quantity: Number(item.quantity || 1)
                  });
                });
              }
            });
          }

          this.setData({
            fileName: quote.name || '小喇叭公司询价单',
            project: quote.projectName || '系采购项目名称',
            time: this.formatDate(new Date(quote.quoteDate || new Date())),
            validityTime: this.formatDate(new Date(quote.validityTime || new Date())),
            merchant: {
              firm: quote.companyName || '',
              firmId: quote.companyId || '178',
              name: quote.linkMan || '',
              phone: quote.linkTel || '',
              email: quote.linkEmail || ''
            },
            product: productList,
            originalProductIds: productList.map(item => item.id),
            attachment: data.quoteFileList || data.fileList || [],
            description: quote.description || ''
          }, () => {
            this.calculateTotal();
          });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
          wx.navigateBack();
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('接口请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  onShow() {
    console.log('当前页面的商品数据:', this.data.product);
    const pages = getCurrentPages();
    const addProductPage = pages.find(page => page.route === 'quotePackage/pages/addNewProduct/addNewProduct');
    
    if (addProductPage && addProductPage.data.selectedProducts) {
      const newProducts = addProductPage.data.selectedProducts.filter(newItem => {
        return !this.data.product.some(existItem => 
          existItem.id === newItem.id && existItem.type === newItem.type
        );
      });

      if (newProducts.length > 0) {
        this.setData({
          product: [...this.data.product, ...newProducts]
        }, () => {
          this.calculateTotal();
        });
      }

      addProductPage.setData({ selectedProducts: [] });
    }

    this.calculateTotal();
  },

  calculateTotal() {
    let totalAmount = 0;
    let totalPrice = 0;
    
    this.data.product.forEach(item => {
      const price = Number(item.price) || 0;
      let quantity = 1;

      if (item.type === "singleProduct" || item.type === 'customProduct') {
        quantity = Number(item.number) || 1;
      } else if (item.type === "combinationProduct") {
        quantity = 1;
      }

      totalAmount += quantity;
      totalPrice += Number((price * quantity).toFixed(4));
    });

    this.setData({
      totalAmount,
      totalPrice: totalPrice.toFixed(2)
    });
  },

  calculateValidityTime() {
    if (!this.data.time) return;
    const date = new Date(this.data.time);
    date.setDate(date.getDate() + 7);
    this.setData({ validityTime: this.formatDate(date) });
  },

  formatDate(date) {
    if (!(date instanceof Date)) date = new Date(date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  goToEditFileInformation() {
    wx.navigateTo({ url: '/inquiryPackage/pages/editFileInformation/editFileInformation' });
  },

  goToChooseMerchant() {
    wx.navigateTo({ url: '/inquiryPackage/pages/chooseMerchant/chooseMerchant' });
  },

  goToChooseProduct() {
    const currentProducts = encodeURIComponent(JSON.stringify(this.data.product));
    wx.navigateTo({
      url: `/inquiryPackage/pages/chooseProduct/chooseProduct?currentProducts=${currentProducts}`,
    });
  },

  goToAddAttachment() {
    wx.navigateTo({ url: '/inquiryPackage/pages/uploadAttachment/uploadAttachment' });
  },
  
  // 删除商品
  deleteProduct(e) {
    const index = e.currentTarget.dataset.index;
    const product = [...this.data.product];
    product.splice(index, 1);
    
    this.setData({ product }, () => {
      this.calculateTotal();
    });
  },
  
  cancel() {
    wx.navigateBack();
  },
  
  confirm() {
    if (this.data.isSubmitting) {
      return wx.showToast({ title: '正在提交中...', icon: 'none' });
    }
  
    // 基础验证
    if (!this.data.fileName.trim()) {
      return wx.showToast({ title: '请填写文档名称', icon: 'none' });
    }
    if (!this.data.merchant.firm.trim()) {
      return wx.showToast({ title: '请添加商家信息', icon: 'none' });
    }
    if (this.data.product.length === 0) {
      return wx.showToast({ title: '请添加至少一个商品', icon: 'none' });
    }
  
    const submitData = this.prepareSubmitData();
    this.saveQuoteDraft(submitData);
  },
  
  formatCurrentTime() {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },
  
  // 统一提交数据结构与网页端完全一致
  prepareSubmitData() {
    // 1. 商品字段配置（与网页端完全一致）
    const productFieldList = [
      { productFieldCode: "productName", productFieldName: "商品名称" },
      { productFieldCode: "productCode", productFieldName: "商品编码" },
      { productFieldCode: "unitPrice", productFieldName: "单价" },
      { productFieldCode: "quantity", productFieldName: "数量" },
      { productFieldCode: "remark", productFieldName: "备注" }
    ];
  
    // 2. 商品列表（仅保留后端需要的核心字段，与网页端对齐）
    const quoteProductGroupFormList = [{
      quoteProductFormList: this.data.product.map((item) => ({
        productId: item.id || item.productId, // 确保传递正确的商品ID
        quantity: item.type === 'combinationProduct' ? 1 : (item.number || item.quantity || 1),
        unitPrice: (Number(item.price) || Number(item.unitPrice) || 0).toFixed(2)
      }))
    }];
    
    // 3. 附件信息
    const quoteFileList = this.data.attachment.map(file => ({
      fileName: file.name || '',
      filePath: file.path || '',
      fileType: file.type || ''
    }));
    
    const app = getApp();
    const currentTime = this.data.time + ' ' + this.formatCurrentTime();
    const isNewOrCopy = this.data.copyMode === 1 || this.data.isNew;
    
    // 4. 询价单主信息（严格对齐网页端结构）
    const quote = {
      // 仅编辑模式携带id，新建/复制模式不携带
      ...(isNewOrCopy ? {} : { id: this.data.id }),
      templateId: 36,
      userId: app.globalData.userId || 18,
      status: 0, // 关键修复：统一状态为0（与网页端新建状态一致）
      totalUnitType: 1,
      name: this.data.fileName.trim(),
      projectName: this.data.project,
      quoteDate: currentTime,
      validityTime: this.data.validityTime + ' 23:59:59',
      companyId: this.data.merchant.firmId || '',
      companyName: this.data.merchant.firm.trim(),
      linkMan: this.data.merchant.name || '',
      linkTel: this.data.merchant.phone || '',
      linkEmail: this.data.merchant.email || '',
      description: this.data.description || '',
      headText: this.getDefaultHeadText(),
      footText: this.getDefaultFootText(),
      dataJson: JSON.stringify(this.data.tableColumns),
      totalPrice: this.data.totalPrice,
      fileList: quoteFileList
      // 移除多余字段，与网页端提交结构完全一致
    };
    
    return {
      costCategoryFormList: [],
      productFieldList,
      quote,
      quoteProductGroupFormList,
      quoteFileList
    };
  },
  
  getDefaultHeadText() {
    return `<p style="text-align: center;"><span style="color: rgb(53, 91, 183); font-size: 29px;"><strong>${this.data.fileName}</strong></span></p>
            <p style="text-align: center;"><strong>采购清单</strong></p>
            <p><span style="font-size: 14px;">采购商：${this.data.merchant.firm}</span></p>
            <p><span style="font-size: 14px;">商家您好！我是来自 ${this.data.merchant.firm}的${this.data.merchant.name}，我司预采购下列物品，请贵公司给予报价。任何疑问可随时与我联系，希望合作愉快！</span></p>
            <p><span style="font-size: 14px;">联系人：${this.data.merchant.name} &nbsp; &nbsp;手机：${this.data.merchant.phone}</span></p>`;
  },
  
  getDefaultFootText() {
    return `<p style="line-height: 1;"><span style="font-size: 14px;">询价日期：${this.data.time}</span></p>
            <p style="line-height: 1;"><span style="font-size: 14px;">本询价有效期至：${this.data.validityTime}</span></p>`;
  },
  
  saveQuoteDraft(data) {
    this.setData({ isSubmitting: true });
    const app = getApp();
    const operationText = this.data.copyMode === 1 || this.data.isNew ? '创建中...' : '保存中...';
    wx.showLoading({ title: operationText });
  
    wx.request({
      url: `${app.globalData.serverUrl}/diServer/inQuote/submit`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token || ''}`,
        'Content-Type': 'application/json;charset=UTF-8'
      },
      data: data,
      success: (res) => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });
        
        if (res.data.code === 200) {
          const successText = this.data.copyMode === 1 || this.data.isNew ? '创建成功' : '保存成功';
          wx.showToast({ title: successText });
          setTimeout(() => {
            // 返回列表页并刷新数据
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage && typeof prevPage.getInquiryList === 'function') {
              prevPage.getInquiryList();
            }
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: res.data.msg || '操作失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        console.error('提交失败:', err);
      }
    });
  }
});
    