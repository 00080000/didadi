Page({
  data: {
    fileName: '询价单名称',
    project: '系采购项目名称',
    time: '',
    validityTime: '',
    merchant: {
      firm: '长沙6',
      firmId: '178',// 通过登录判断firmid
      name: '黄老板',
      phone: '13900009999',
      email: ''
    },
    product: [],
    attachment: [],
    totalAmount: 0,
    totalPrice: '0.00',
    description: '',
    isSubmitting: false // 防止重复提交
  },

  onLoad() {
    // 初始化当前日期
    const today = this.formatDate(new Date());
    this.setData({
      time: today
    });
    this.calculateValidityTime();
  },

  onShow() {
    console.log('当前页面的商品数据:', this.data.product);
    this.calculateTotal();
  },

  // 计算总数量和总价格
  calculateTotal() {
    let totalAmount = 0; // 总数量
    let totalPrice = 0; // 总金额
    
    this.data.product.forEach(item => {
      
      // 处理数量：单商品/临时商品有number字段，组合商品默认1
      const quantity = item.type === 'combinationProduct' 
        ? 1 
        : (item.number || 1); // 优先用number，兼容旧数据用amount
      
      // 处理单价：确保价格为数字类型
      const price = Number(item.price) || 0;
      
      // 累加总数量和总金额
      totalAmount += quantity;
      totalPrice += quantity * price;
    });
    
    this.setData({
      totalAmount,
      totalPrice: totalPrice.toFixed(2) // 保留两位小数
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

  // 页面跳转方法
  goToEditFileInformation() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/editFileInformation/editFileInformation',
    });
  },

  goToChooseMerchant() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseMerchant/chooseMerchant',
    });
  },

  goToChooseProduct() {
    // 关键修改：始终携带当前最新的商品列表到第二个页面
    const currentProducts = encodeURIComponent(JSON.stringify(this.data.product));
    wx.navigateTo({
      // 注意：这里路径需与第二个页面实际路径一致（根据你的项目调整）
      url: `/inquiryPackage/pages/chooseProduct/chooseProduct?currentProducts=${currentProducts}`,
    });
  },

  goToAddAttachment() {
    wx.navigateTo({
      url: '/inquiryPackage/pages/uploadAttachment/uploadAttachment',
    });
  },

  cancel() {
    wx.navigateBack();
  },

  // 确认保存
  confirm() {
    // 防止重复提交
    if (this.data.isSubmitting) {
      return wx.showToast({ title: '正在提交中...', icon: 'none' });
    }

    // 基础必填项验证
    if (!this.data.fileName.trim()) {
      return wx.showToast({ title: '请填写文档名称', icon: 'none' });
    }
    if (!this.data.merchant || !this.data.merchant.firm.trim()) {
      return wx.showToast({ title: '请添加商家信息', icon: 'none' });
    }
    if (this.data.product.length === 0) {
      return wx.showToast({ title: '请添加至少一个商品', icon: 'none' });
    }

    const submitData = this.prepareSubmitData();
    this.saveQuoteDraft(submitData);
  },
  
  // 格式化当前时间为 HH:MM:SS
  formatCurrentTime() {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },
  
  // 核心修复：对齐网页端提交数据结构
  prepareSubmitData() {
    // 1. 商品字段配置（与表格结构对应）
    const productFieldList = [
      { productFieldCode: "productName", productFieldName: "商品名称" },
      { productFieldCode: "productCode", productFieldName: "商品编码" },
      { productFieldCode: "unitPrice", productFieldName: "单价" },
      { productFieldCode: "quantity", productFieldName: "数量" },
      { productFieldCode: "remark", productFieldName: "备注" }
    ];

    // 2. 商品列表仅保留后端需要的核心字段（对齐网页端）
    const quoteProductGroupFormList = [{
      quoteProductFormList: this.data.product.map((item) => ({
        productId: item.id || item.productId, // 核心：传递正确的商品ID（后端通过此查询名称和编码）
        quantity: item.type === 'combinationProduct' ? 1 : (item.number || 1),
        unitPrice: (Number(item.price) || 0).toFixed(2)
      }))
    }];
    
    // 3. 附件信息
    const quoteFileList = this.data.attachment.map(file => ({
      fileName: file.name || '',
      filePath: file.path || '',
      fileType: file.type || ''
    }));
    
    // 4. 询价单主信息
    const app = getApp();
    const quote = {
      quoteDate: this.data.time + ' ' + this.formatCurrentTime(), 
      validityTime: this.data.validityTime + ' 23:59:59',
      status: 0,
      projectName: this.data.project,
      name: this.data.fileName.trim(),
      userId: app.globalData.userId || 18,
      fileList: quoteFileList,
      companyName: this.data.merchant.firm.trim(),
      companyId: this.data.merchant.firmId || '',
      linkEmail: this.data.merchant.email || '',
      linkTel: this.data.merchant.phone || '',
      linkMan: this.data.merchant.name || '',
      description: this.data.description || '',
      headText: this.data.headText || this.getDefaultHeadText(),
      footText: this.data.footText || this.getDefaultFootText(),
      dataJson: this.getTableStructureJson(),
      totalUnitType: 1,
      templateId: 36,
      totalPrice: this.data.totalPrice
    };
    
    // 移除版本字段，对齐网页端请求结构
    return {
      costCategoryFormList: [],
      productFieldList,
      quote,
      quoteProductGroupFormList,
      quoteFileList
    };
  },

  // 表格结构保持不变
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

  // 保存询价单
  saveQuoteDraft(data) {
    this.setData({ isSubmitting: true });
    const app = getApp();
    wx.showLoading({ title: '保存中...' });

    // 打印提交数据用于调试
    console.log('提交的商品数据:', data.quoteProductGroupFormList[0].quoteProductFormList);
    console.log('提交的表格结构:', data.quote.dataJson);

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
        
        console.log('接口返回:', res.data);
        
        if (res.data.code === 200) {
          wx.showToast({ title: '保存成功' });
          setTimeout(() => {
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage && typeof prevPage.getInquiryList === 'function') {
              prevPage.getInquiryList();
            }
            wx.navigateBack();
          }, 1500);
        } else {
          const isDuplicateError = res.data.msg?.includes('商家名称已存在') || 
                                 res.data.msg?.includes('重复');
          
          if (isDuplicateError) {
            wx.showToast({ title: '保存成功（允许重复商家）', icon: 'none' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showToast({ title: res.data.msg || '保存失败', icon: 'none' });
          }
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        console.error('保存失败:', err);
      }
    });
  }
})