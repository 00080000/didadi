Page({
  data: {
    fileName: '询价单名称',
    project: '系采购项目名称',
    time: '',
    validityTime: '',
    merchant: {
      firm: '',
      firmId: '178',// 通过登录判断firmid
      name: '',
      phone: '',
      email: ''
    },
    product: [], // 商品列表（核心渲染数据）
    attachment: [],
    totalAmount: 0,
    totalPrice: '0.00',
    description: '',
    isSubmitting: false,
    id: '', // 询价单ID（编辑模式）
    isNew: true, // 是否为新建模式
    submitData: {}
  },

  onLoad(options) {
    const { id } = options;
    const app = getApp();
    this.setData({
      id: id || '',
      isNew: !id
    });

    // 初始化全局数据
    if (!app.globalData) app.globalData = {};
    if (!app.globalData.submitData) {
      app.globalData.submitData = {
        quote: {},
        productGroupList: [],
        quoteFileList: [],
        selectedProducts: [],
        productFieldList: [
          { productFieldCode: "productName", productFieldName: "商品名称" },
          { productFieldCode: "productCode", productFieldName: "商品编码" },
          { productFieldCode: "unitPrice", productFieldName: "单价" },
          { productFieldCode: "quantity", productFieldName: "数量" },
          { productFieldCode: "remark", productFieldName: "备注" }
        ]
      };
    }

    // 新建模式初始化
    if (this.data.isNew) {
      const today = this.formatDate(new Date());
      this.setData({
        time: today,
        submitData: app.globalData.submitData
      });
      this.calculateValidityTime();
      app.globalData.selectedProducts = [];
    } 
    // 编辑模式加载数据
    else {
      this.loadInquiryData(id);
    }
  },

  onShow() {
    const app = getApp();
    // 从全局同步商品数据
    if (app.globalData.selectedProducts) {
      this.setData({
        product: app.globalData.selectedProducts
      }, () => {
        this.calculateTotal();
      });
    }
    console.log('当前页面渲染的商品数据:', this.data.product);
  },

  // 核心修复：根据网页版数据结构解析商品
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
          const data = res.data.data || {};
          const quote = data.quote || {};
          
          console.log('接口返回完整数据:', data);
          
          // 1. 解析商品数据（适配网页版productGroupList结构）
          let productList = [];
          
          // 网页版商品数据在productGroupList中
          if (data.productGroupList && data.productGroupList.length) {
            data.productGroupList.forEach(group => {
              // 每个分组的商品在quoteProductList中
              if (group.quoteProductList && group.quoteProductList.length) {
                group.quoteProductList.forEach(product => {
                  // 解析productData中的详细信息（关键修复）
                  let productData = {};
                  try {
                    productData = product.productData ? JSON.parse(product.productData) : {};
                  } catch (e) {
                    console.error('解析productData失败:', e);
                  }
                  
                  // 格式化商品数据（确保与前端渲染字段匹配）
                  productList.push({
                    id: product.productId || product.id,
                    name: productData.productName || product.name || '未知商品', // 从productData取名称
                    productCode: productData.productCode || product.productCode || '',
                    price: Number(product.unitPrice || 0), // 前端显示用price
                    unitPrice: Number(product.unitPrice || 0), // 提交用unitPrice
                    number: Number(product.quantity || 1), // 前端显示用number
                    quantity: Number(product.quantity || 1), // 提交用quantity
                    type: product.type || 'singleProduct',
                    remark: product.remark || '',
                    // 保留原始数据用于调试
                    rawData: product
                  });
                });
              }
            });
          }
          
          console.log('解析后的商品数据:', productList);
          
          // 2. 同步商品数据到全局
          const app = getApp();
          app.globalData.selectedProducts = productList;
          app.globalData.submitData = {
            ...data,
            selectedProducts: productList,
            quote: quote
          };

          // 3. 更新页面数据
          this.setData({
            fileName: quote.name || '询价单名称',
            project: quote.projectName || '系采购项目名称',
            time: this.formatDate(new Date(quote.quoteDate)),
            validityTime: this.formatDate(new Date(quote.validityTime)),
            merchant: {
              firm: quote.companyName || '',
              firmId: quote.companyId || '178',
              name: quote.linkMan || '',
              phone: quote.linkTel || '',
              email: quote.linkEmail || ''
            },
            attachment: data.quoteFileList || [],
            description: quote.description || '',
            submitData: app.globalData.submitData,
            product: productList // 渲染商品列表
          }, () => {
            this.calculateTotal();
          });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
          wx.navigateBack();
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        wx.navigateBack();
      }
    });
  },

  // 计算总数量和总价格
  calculateTotal() {
    let totalAmount = 0;
    let totalPrice = 0;
    
    this.data.product.forEach(item => {
      const quantity = item.type === 'combinationProduct' ? 1 : (item.number || 1);
      const price = Number(item.price) || 0;
      totalAmount += quantity;
      totalPrice += quantity * price;
    });
    
    this.setData({
      totalAmount,
      totalPrice: totalPrice.toFixed(2)
    });
  },

  // 计算有效期
  calculateValidityTime() {
    if (!this.data.time) return;
    const date = new Date(this.data.time);
    date.setDate(date.getDate() + 7);
    this.setData({ validityTime: this.formatDate(date) });
  },

  // 格式化日期
  formatDate(date) {
    if (!(date instanceof Date)) date = new Date(date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 页面跳转方法
  goToEditFileInformation() {
    this.saveToGlobalData();
    wx.navigateTo({
      url: '/inquiryPackage/pages/editFileInformation/editFileInformation',
    });
  },

  goToChooseMerchant() {
    this.saveToGlobalData();
    wx.navigateTo({
      url: '/inquiryPackage/pages/chooseMerchant/chooseMerchant',
    });
  },

  goToChooseProduct() {
    this.saveToGlobalData();
    const currentProducts = encodeURIComponent(JSON.stringify(this.data.product));
    wx.navigateTo({
      url: `/inquiryPackage/pages/chooseProduct/chooseProduct?currentProducts=${currentProducts}`,
    });
  },

  goToAddAttachment() {
    this.saveToGlobalData();
    wx.navigateTo({
      url: '/inquiryPackage/pages/uploadAttachment/uploadAttachment',
    });
  },

  // 保存数据到全局
  saveToGlobalData() {
    const app = getApp();
    app.globalData.submitData = {
      ...app.globalData.submitData,
      quote: {
        ...this.data.merchant,
        name: this.data.fileName,
        projectName: this.data.project,
        quoteDate: this.data.time,
        validityTime: this.data.validityTime
      },
      selectedProducts: this.data.product,
      quoteFileList: this.data.attachment
    };
  },

  cancel() {
    wx.navigateBack();
  },

  // 确认保存
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
  
  // 格式化当前时间
  formatCurrentTime() {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },
  
  // 准备提交数据
  prepareSubmitData() {
    const app = getApp();
    const { product, merchant, fileName, project, time, validityTime, description, id } = this.data;

    // 商品字段配置（与网页版一致）
    const productFieldList = [
      { productFieldCode: "productName", productFieldName: "商品名称" },
      { productFieldCode: "productCode", productFieldName: "商品编码" },
      { productFieldCode: "unitPrice", productFieldName: "单价" },
      { productFieldCode: "quantity", productFieldName: "数量" },
      { productFieldCode: "remark", productFieldName: "备注" }
    ];

    // 商品列表（适配网页版productGroupList结构）
    const quoteProductGroupFormList = [{
      quoteProductFormList: product.map(item => ({
        productId: item.id || item.productId,
        quantity: item.quantity || item.number || 1,
        unitPrice: (item.unitPrice || item.price || 0).toFixed(2),
        productData: item.rawData?.productData || JSON.stringify({
          productName: item.name,
          productCode: item.productCode,
          unitPrice: item.price
        })
      }))
    }];
    
    // 附件信息
    const quoteFileList = this.data.attachment.map(file => ({
      fileName: file.name || '',
      filePath: file.path || '',
      fileType: file.type || ''
    }));
    
    // 询价单主信息
    const currentTime = time + ' ' + this.formatCurrentTime();
    const quote = {
      ...(id ? { id } : {}), // 编辑模式携带id
      templateId: 36,
      userId: app.globalData.userId || 18,
      enterpriseId: 11,
      type: 2,
      status: this.data.isNew ? 0 : 1,
      totalUnitType: 1,
      name: fileName.trim(),
      projectName: project,
      quoteDate: currentTime,
      validityTime: validityTime + ' 23:59:59',
      companyId: merchant.firmId || '',
      companyName: merchant.firm.trim(),
      linkMan: merchant.name || '',
      linkTel: merchant.phone || '',
      linkEmail: merchant.email || '',
      description: description || '',
      headText: this.getDefaultHeadText(),
      footText: this.getDefaultFootText(),
      dataJson: this.getTableStructureJson(),
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

  // 表格结构
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
          const isDuplicateError = res.data.msg?.includes('商家名称已存在') || res.data.msg?.includes('重复');
          if (isDuplicateError) {
            wx.showToast({ title: '保存成功（允许重复商家）', icon: 'none' });
            setTimeout(() => wx.navigateBack(), 1500);
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
    