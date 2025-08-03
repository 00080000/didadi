Page({
  data: {
    fileName: '询价单询价单名称',
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
    product: [], // 核心商品列表（含原有+新增）
    originalProductIds: [], // 记录初始商品ID，用于去重
    attachment: [],
    totalAmount: 0,
    totalPrice: '0.00',
    description: '',
    isSubmitting: false, // 防止重复提交
    id: '', // 编辑模式的询价单ID
    isNew: true, // 是否为新建模式
    tableColumns: [] // 表格列配置
  },

  onLoad(options) {
    const { id } = options;
    this.setData({
      id: id || '',
      isNew: !id,
      tableColumns: [
        { label: "序号", width: "50px", background: "#ececec", align: "center" },
        { label: "商品名称", align: "center", code: "productName" },
        { label: "商品编码", align: "center", code: "productCode" },
        { label: "单价", align: "center", code: "unitPrice" },
        { label: "数量", background: "#ececec", align: "left", code: "quantity" },
        { label: "备注", background: "#ececec", align: "left", code: "remark", width: "140px" }
      ]
    });

    // 新建模式初始化日期
    if (this.data.isNew) {
      const today = this.formatDate(new Date());
      this.setData({ time: today });
      this.calculateValidityTime();
    } 
    // 编辑模式加载数据
    else {
      this.loadInquiryData(id);
    }
  },

  // 编辑模式加载已有询价单数据
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
          
          // 解析商品数据（适配chooseProduct格式）
          let productList = [];
          if (Array.isArray(data.productGroupList) && data.productGroupList.length > 0) {
            data.productGroupList.forEach(group => {
              if (Array.isArray(group.quoteProductList) && group.quoteProductList.length > 0) {
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

                  // 构建与chooseProduct兼容的商品格式
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

          // 记录初始商品ID（用于去重）
          const originalProductIds = productList.map(item => item.id);

          // 渲染页面数据
          this.setData({
            fileName: quote.name || '询价单名称',
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
            originalProductIds: originalProductIds,
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
    // 处理从chooseProduct返回的商品（仅添加新商品）
    const pages = getCurrentPages();
    const chooseProductPage = pages.find(page => page.route === 'inquiryPackage/pages/chooseProduct/chooseProduct');
    
    if (chooseProductPage && chooseProductPage.data.product && chooseProductPage.data.product.length > 0) {
      const currentProducts = [...this.data.product];
      const newProductsFromChoose = [...chooseProductPage.data.product];
      
      // 过滤：仅保留不在初始列表且不在当前列表的新商品
      const filteredNewProducts = newProductsFromChoose.filter(newItem => 
        !this.data.originalProductIds.includes(newItem.id) &&
        !currentProducts.some(item => item.id === newItem.id)
      );
      
      // 追加新商品
      if (filteredNewProducts.length > 0) {
        this.setData({
          product: [...currentProducts, ...filteredNewProducts]
        }, () => {
          this.calculateTotal();
        });
      }
      
      // 清空选择页数据，避免重复添加
      chooseProductPage.setData({ product: [] });
    }
    
    this.calculateTotal();
  },

  // 计算总数量和总价格
  calculateTotal() {
    let totalAmount = 0;
    let totalPrice = 0;
    
    this.data.product.forEach(item => {
      const quantity = item.number || item.quantity || 1;
      const price = Number(item.price) || Number(item.unitPrice) || 0;
      totalAmount += quantity;
      totalPrice += quantity * price;
    });
    
    this.setData({
      totalAmount,
      totalPrice: totalPrice.toFixed(2)
    });
  },

  // 计算有效期（当前日期+7天）
  calculateValidityTime() {
    if (!this.data.time) return;
    const date = new Date(this.data.time);
    date.setDate(date.getDate() + 7);
    this.setData({ validityTime: this.formatDate(date) });
  },

  // 格式化日期为yyyy-mm-dd
  formatDate(date) {
    if (!(date instanceof Date)) date = new Date(date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 页面跳转方法
  goToEditFileInformation() {
    wx.navigateTo({ url: '/inquiryPackage/pages/editFileInformation/editFileInformation' });
  },

  goToChooseMerchant() {
    wx.navigateTo({ url: '/inquiryPackage/pages/chooseMerchant/chooseMerchant' });
  },

  // 跳转至选择商品页面（保持原有参数传递）
  goToChooseProduct() {
    const currentProducts = encodeURIComponent(JSON.stringify(this.data.product));
    wx.navigateTo({
      url: `/inquiryPackage/pages/chooseProduct/chooseProduct?currentProducts=${currentProducts}`,
    });
  },

  goToAddAttachment() {
    wx.navigateTo({ url: '/inquiryPackage/pages/uploadAttachment/uploadAttachment' });
  },

  // 取消操作
  cancel() {
    wx.navigateBack();
  },

  // 确认保存/提交
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
  
  // 格式化当前时间为hh:mm:ss
  formatCurrentTime() {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },
  
  // 准备提交数据 - 核心修复productData格式
  prepareSubmitData() {
    const productFieldList = [
      { productFieldCode: "productName", productFieldName: "商品名称" },
      { productFieldCode: "productCode", productFieldName: "商品编码" },
      { productFieldCode: "unitPrice", productFieldName: "单价" },
      { productFieldCode: "quantity", productFieldName: "数量" },
      { productFieldCode: "remark", productFieldName: "备注" }
    ];

    // 组装商品数据（修复productData格式）
    const quoteProductGroupFormList = [{
      quoteProductFormList: this.data.product.map((item) => {
        // 构建符合后端LinkedHashMap预期的productData结构
        const productData = {
          productName: item.name || item.productName || '',
          productCode: item.productCode || '',
          unitPrice: Number(item.price) || Number(item.unitPrice) || 0,
          // 确保添加所有后端可能需要的字段，避免JSON解析错误
          quantity: Number(item.number) || Number(item.quantity) || 1,
          id: item.id || ''
        };
        
        return {
          productId: item.id,
          quantity: Number(item.number) || Number(item.quantity) || 1,
          unitPrice: (Number(item.price) || Number(item.unitPrice) || 0).toFixed(2),
          // 关键修复：确保productData是纯对象，不包含任何会导致解析失败的类型
          productData: productData
        };
      })
    }];
    
    // 组装附件数据
    const quoteFileList = this.data.attachment.map(file => ({
      fileName: file.name || '',
      filePath: file.path || '',
      fileType: file.type || ''
    }));
    
    const app = getApp();
    const currentTime = this.data.time + ' ' + this.formatCurrentTime();
    const quote = {
      ...(this.data.id ? { id: this.data.id } : {}),
      templateId: 36,
      userId: app.globalData.userId || 18,
      enterpriseId: 11,
      type: 2,
      status: this.data.isNew ? 0 : 1,
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
      headText: this.data.headText || this.getDefaultHeadText(),
      footText: this.data.footText || this.getDefaultFootText(),
      dataJson: JSON.stringify(this.data.tableColumns),
      totalPrice: this.data.totalPrice,
      amountPrice: this.data.totalPrice,
      fileList: quoteFileList,
      createBy: app.globalData.userId || 18,
      createTime: this.data.isNew ? currentTime : undefined,
      updateBy: app.globalData.userId || 18,
      updateTime: currentTime
    };
    
    return {
      costCategoryFormList: [],
      productFieldList,
      quote,
      quoteProductGroupFormList,
      quoteFileList
    };
  },

  // 默认头部文本
  getDefaultHeadText() {
    return `<p style="text-align: center;"><span style="color: rgb(53, 91, 183); font-size: 29px;"><strong>${this.data.fileName}</strong></span></p>
            <p style="text-align: center;"><strong>采购清单</strong></p>
            <p><span style="font-size: 14px;">采购商：${this.data.merchant.firm}</span></p>
            <p><span style="font-size: 14px;">商家您好！我是来自 ${this.data.merchant.firm}的${this.data.merchant.name}，我司预采购下列物品，请贵公司给予报价。任何疑问可随时与我联系，希望合作愉快！</span></p>
            <p><span style="font-size: 14px;">联系人：${this.data.merchant.name} &nbsp; &nbsp;手机：${this.data.merchant.phone}</span></p>`;
  },

  // 默认底部文本
  getDefaultFootText() {
    return `<p style="line-height: 1;"><span style="font-size: 14px;">询价日期：${this.data.time}</span></p>
            <p style="line-height: 1;"><span style="font-size: 14px;">本询价有效期至：${this.data.validityTime}</span></p>`;
  },

  // 保存询价单
  saveQuoteDraft(data) {
    this.setData({ isSubmitting: true });
    const app = getApp();
    wx.showLoading({ title: this.data.isNew ? '创建中...' : '保存中...' });

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
          wx.showToast({ title: this.data.isNew ? '创建成功' : '保存成功' });
          setTimeout(() => {
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage && typeof prevPage.getInquiryList === 'function') {
              prevPage.getInquiryList();
            }
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: res.data.msg || '保存失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  }
})
    