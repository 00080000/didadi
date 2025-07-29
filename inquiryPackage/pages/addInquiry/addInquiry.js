Page({
  data: {
    fileName: '小喇叭公司询价单',
    project: '系统集成扩容二期采购项目',
    time: '',
    validityTime: '',
    merchant: {
      firm: '长沙好好信息科技有限公司123333',
      firmId: '',  // 新增：公司ID
      name: '黄老板',
      phone: '13900009999',
      email: ''     // 新增：邮箱
    },
    product: [{
      name: '1',
      code: '',     // 新增：商品编码
      amount: 2,
      price: 234.51,
      productId: '', // 新增：商品ID
      remark: ''    // 新增：备注
    },
    {
      name: '2',
      code: '',
      amount: 2,
      price: 234.51,
      productId: '',
      remark: ''
    },
    {
      name: '3',
      code: '',
      amount: 2,
      price: 234.51,
      productId: '',
      remark: ''
    },
    {
      name: '4',
      code: '',
      amount: 2,
      price: 234.51,
      productId: '',
      remark: ''
    }],
    attachment: [],  // 修改：存储附件对象而非字符串
    totalAmount: 0,
    totalPrice: '0.00',  // 新增：总价格
    description: '',     // 新增：文档描述
    headText: '',        // 新增：头部文本
    footText: ''         // 新增：底部文本
  },

  onLoad() {
    // 初始化当前日期
    const today = this.formatDate(new Date());
    this.setData({
      time: today
    });
  },

  onShow() {
    this.calculateTotal();
    this.calculateValidityTime();
  },

  // 计算总数量和总价格
  calculateTotal() {
    let totalAmount = 0;
    let totalPrice = 0;
    
    this.data.product.forEach(item => {
      totalAmount += item.amount || 0;
      totalPrice += (item.amount || 0) * (item.price || 0);
    });
    
    this.setData({
      totalAmount,
      totalPrice: totalPrice.toFixed(2)
    });
  },

  // 计算有效期（默认7天）
  calculateValidityTime() {
    if (!this.data.time) return;
    
    const date = new Date(this.data.time);
    date.setDate(date.getDate() + 7);
    this.setData({
      validityTime: this.formatDate(date)
    });
  },

  // 格式化日期
  formatDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 获取总金额
  getTotalAmount() {
    let total = 0;
    for (let i = 0; i < this.data.product.length; i++) {
      total += this.data.product[i].amount;
    }
    return total;
  },

  // 页面跳转方法
  goToEditFileInformation() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/editFileInformation/editFileInformation',
    })
  },

  goToChooseMerchant() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseMerchant/chooseMerchant',
    })
  },

  goToChooseProduct() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseProduct/chooseProduct',
    })
  },

  goToAddAttachment() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/uploadAttachment/uploadAttachment',
    })
  },

  cancel() {
    wx.navigateBack()
  },

  // 确认保存
  confirm() {
    // 验证必填项
    if (!this.data.fileName) {
      return wx.showToast({ title: '请填写文档名称', icon: 'none' });
    }
    if (!this.data.merchant || !this.data.merchant.firm) {
      return wx.showToast({ title: '请添加商家信息', icon: 'none' });
    }
    if (this.data.product.length === 0) {
      return wx.showToast({ title: '请添加至少一个商品', icon: 'none' });
    }

    // 准备提交数据
    const submitData = this.prepareSubmitData();
    // 调用保存接口
    this.saveQuoteDraft(submitData);
  },

  // 准备提交的数据
  prepareSubmitData() {
    // 构建商品字段列表
    const productFieldList = [
      { productFieldCode: "productName", productFieldName: "商品名称" },
      { productFieldCode: "productCode", productFieldName: "商品编码" },
      { productFieldCode: "unitPrice", productFieldName: "单价" },
      { productFieldCode: "quantity", productFieldName: "数量" },
      { productFieldCode: "remark", productFieldName: "备注" }
    ];
    
    // 构建商品分组列表
    const quoteProductGroupFormList = [{
      quoteProductFormList: this.data.product.map(item => ({
        quantity: item.amount || 0,
        unitPrice: (item.price || 0).toFixed(2),
        productId: item.productId || '',
        remark: item.remark || ''
      }))
    }];
    
    // 构建附件列表
    const quoteFileList = this.data.attachment.map(file => ({
      fileName: file.name || '',
      filePath: file.path || ''
    }));
    
    // 构建询价单主信息
    const app = getApp();
    const quote = {
    
      quoteDate: this.data.time + ' 00:00:00',
      validityTime: this.data.validityTime + ' 23:59:59',
      status: 0,
      projectName: this.data.project,
      name: this.data.fileName,
      userId: app.globalData.userId || 18,
      fileList: quoteFileList,
      companyName: this.data.merchant.firm,
      companyId: this.data.merchant.firmId || '',
      linkEmail: this.data.merchant.email || '',
      linkTel: this.data.merchant.phone || '',
      linkMan: this.data.merchant.name || '',
      description: this.data.description || '',
      headText: this.data.headText || this.getDefaultHeadText(),
      footText: this.data.footText || this.getDefaultFootText(),
      dataJson: this.getTableStructureJson(),
      totalUnitType: 1,
      templateId: 36
    };
    
    return {
      costCategoryFormList: [],
      productFieldList,
      quote,
      quoteProductGroupFormList,
      quoteFileList
    };
  },

  // 获取表格结构JSON
  getTableStructureJson() {
    return JSON.stringify([
      { "label": "序号", "width": "50px", "background": "#ececec", "align": "center" },
      { "label": "商品名称", "align": "center", "code": "productName" },
      { "label": "商品编码", "align": "center", "code": "productCode" },
      { "label": "单价", "align": "center", "code": "unitPrice" },
      { "label": "数量", "background": "#ececec", "align": "left", "code": "quantity" },
      { "label": "备注", "background": "#ececec", "align": "left", "code": "remark", "width": "140px" }
    ]);
  },

  // 默认头部文本
  getDefaultHeadText() {
    return `<p style="text-align: center;"><span style="color: rgb(53, 91, 183); font-size: 29px;"><strong>${this.data.fileName}</strong></span></p>
            <p style="text-align: center;"><strong>采购方信息</strong></p>
            <p><span style="font-size: 14px;">供应商：${this.data.merchant.firm}</span></p>
            <p><span style="font-size: 14px;">客户您好！我是来自 ${this.data.merchant.firm}，任何疑问可随时与我联系，希望合作愉快！</span></p>
            <p><span style="font-size: 14px;">联系人：${this.data.merchant.name} &nbsp; &nbsp;手机：${this.data.merchant.phone}</span></p>`;
  },

  // 默认底部文本
  getDefaultFootText() {
    return `<p style="line-height: 1;"><span style="font-size: 14px;">询价日期：${this.data.time}</span></p>
            <p style="line-height: 1;"><span style="font-size: 14px;">本询价有效期至：${this.data.validityTime}</span></p>`;
  },

  // 保存询价单草稿
  saveQuoteDraft(data) {
    const app = getApp();
    wx.showLoading({ title: '保存中...' });

    wx.request({
      url: `${app.globalData.serverUrl}/diServer/inQuote/submit`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: data,
      success: (res) => {
        wx.hideLoading();
        
        if (res.data.code === 200) {
          wx.showToast({ title: '保存成功' });
          // 保存成功后返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: res.data.msg || '保存失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        console.error('保存询价单失败：', err);
      }
    });
  }
})
    