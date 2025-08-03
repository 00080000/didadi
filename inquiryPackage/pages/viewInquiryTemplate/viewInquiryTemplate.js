Page({
  data: {
    inquiryId: null,
    quote: {}, // 询价单基础信息（包含名称、采购方等核心数据）
    productFieldList: [], // 商品字段配置（从dataJson解析）
    productGroupList: [], // 商品分组列表
    quoteFileList: [], // 附件列表
    isLoading: true,
    errorMsg: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ inquiryId: options.id }, () => {
        this.getInquiryDetail();
      });
    } else {
      this.setData({
        isLoading: false,
        errorMsg: '未找到询价单ID'
      });
    }
  },

  // 获取询价单详情
  getInquiryDetail() {
    const { inquiryId } = this.data;
    if (!inquiryId) return;

    this.setData({ isLoading: true });

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/inQuote/${inquiryId}`,
      method: "GET",
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`,
        "accept": "*/*"
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          // 保存附件列表
          const quoteFileList = res.data.data.quoteFileList || [];
          this.setData({ quoteFileList });
          
          // 解析并更新数据
          this.parseQuoteData(res.data.data);
        } else {
          this.setData({
            isLoading: false,
            errorMsg: res.data.msg || '获取询价单详情失败'
          });
          wx.showToast({ title: res.data.msg || '获取失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('请求失败', err);
        this.setData({
          isLoading: false,
          errorMsg: '网络错误，请重试'
        });
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  /**
   * 解析接口返回的完整数据
   * @param {Object} data - 接口返回的data对象
   */
  parseQuoteData(data) {
    try {
      // 解析商品字段配置
      const productFieldList = this.parseProductFields(data.quote.dataJson);
      
      // 处理商品分组列表
      const productGroupList = this.processProductGroups(data.productGroupList);
      
      // 计算有效期天数
      const validPeriod = this.calculateValidDays(data.quote.createTime, data.quote.validityTime);
      
      // 更新页面数据（补充计算后的有效期）
      this.setData({
        quote: {
          ...data.quote,
          validPeriod // 新增计算后的有效期字段
        },
        productFieldList,
        productGroupList,
        isLoading: false,
        errorMsg: ''
      });
    } catch (e) {
      console.error('解析询价单数据失败', e);
      this.setData({
        isLoading: false,
        errorMsg: '数据解析失败'
      });
    }
  },

  /**
   * 计算有效期天数（根据createTime和validityTime）
   * @param {String} createTime - 创建时间（格式：yyyy-MM-dd HH:mm:ss）
   * @param {String} validityTime - 失效时间（格式：yyyy-MM-dd HH:mm:ss）
   * @returns {String} 有效期描述（如"7天"）
   */
  calculateValidDays(createTime, validityTime) {
    // 缺省处理：如果缺少时间字段，返回默认30天
    if (!createTime || !validityTime) {
      return '30天';
    }

    try {
      // 转换为时间戳（毫秒）
      const createDate = new Date(createTime);
      const validityDate = new Date(validityTime);
      
      // 验证日期格式是否有效
      if (isNaN(createDate.getTime()) || isNaN(validityDate.getTime())) {
        throw new Error('日期格式无效');
      }
      
      // 计算毫秒差
      const timeDiff = validityDate.getTime() - createDate.getTime();
      
      // 转换为天数（向上取整）
      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // 确保至少1天
      return days > 0 ? `${days}天` : '1天';
    } catch (e) {
      console.error('计算有效期失败:', e);
      return '30天'; // 异常时返回默认值
    }
  },

  /**
   * 解析商品字段配置（从quote.dataJson提取）
   * @param {String} dataJson - quote中的dataJson字符串
   * @returns {Array} 格式化后的字段配置列表
   */
  parseProductFields(dataJson) {
    if (!dataJson) {
      return [
        { label: "序号", width: "50px", background: "#ececec", align: "center" },
        { label: "商品名称", align: "center", code: "productName" },
        { label: "商品编码", align: "center", code: "productCode" },
        { label: "单价", align: "center", code: "unitPrice" },
        { label: "数量", background: "#ececec", align: "left", code: "quantity" },
        { label: "备注", background: "#ececec", align: "left", code: "remark", width: "140px" }
      ];
    }

    try {
      const fields = JSON.parse(dataJson);
      return fields.filter(field => field.label !== "序号");
    } catch (e) {
      console.error('解析dataJson失败', e);
      return [
        { label: "商品名称", align: "center", code: "productName" },
        { label: "商品编码", align: "center", code: "productCode" },
        { label: "单价", align: "center", code: "unitPrice" },
        { label: "数量", background: "#ececec", align: "left", code: "quantity" },
        { label: "备注", background: "#ececec", align: "left", code: "remark", width: "140px" }
      ];
    }
  },

  /**
   * 处理商品分组列表
   * @param {Array} groups - 接口返回的productGroupList
   * @returns {Array} 处理后的分组列表
   */
  processProductGroups(groups) {
    if (!groups || !groups.length) {
      return [];
    }

    return groups.map(group => ({
      ...group,
      productGroupName: group.productGroupName || "商品组",
      quoteProductList: (group.quoteProductList || []).map(product => this.processProduct(product))
    }));
  },

  /**
   * 处理单个商品数据（解析productData）
   * @param {Object} product - 单个商品对象
   * @returns {Object} 处理后的商品对象
   */
  processProduct(product) {
    try {
      const productData = typeof product.productData === 'string' 
        ? JSON.parse(product.productData) 
        : (product.productData || {});
      
      return {
        ...product,
        productData,
        productName: product.productName || productData.productName || "未命名商品",
        productCode: product.productCode || productData.productCode || "无编码",
        unitPrice: product.unitPrice || productData.unitPrice || 0,
        quantity: product.quantity || 1
      };
    } catch (e) {
      console.error('解析商品数据失败', e);
      return {
        ...product,
        productData: {},
        productName: product.productName || "未命名商品",
        productCode: product.productCode || "无编码"
      };
    }
  },

  /**
   * 获取商品字段值的辅助函数
   * @param {Object} product - 商品对象
   * @param {String} code - 字段编码
   * @returns {any} 字段值
   */
  getProductValue(product, code) {
    return product[code] || product.productData?.[code] || "-";
  },

  // 下载询价单文档
  goToDownloadQuotation() {
    // 1. 从页面数据中获取所有所需数据
    const { quote, productFieldList, productGroupList } = this.data;
    
    // 2. 收集表格表头数据
    const header = ['序号', ...productFieldList.map(field => field.label || field.productFieldName)];
    
    // 3. 整理商品数据为二维数组（表格行）
    const rows = [];
    productGroupList.forEach(group => {
      group.quoteProductList.forEach((product, idx) => {
        const row = [
          idx + 1, // 序号
          product.productName,
          product.productCode,
          product.unitPrice,
          product.quantity,
          product.remark || '-'
        ];
        rows.push(row);
      });
    });
    
    // 4. 保存到全局变量，供下载页使用
    const app = getApp();
    app.globalData.tableExportData = {
      // 从quote中提取标题（名称）
      title: quote.name || `询价单${new Date().getTime()}`,
      // 表格数据
      header,
      rows,
      // 从quote中提取其他核心信息
      inquiryInfo: {
        purchaseCompany: quote.companyName || '未知采购方',
        supplierCompany: quote.supplierCompany || '贵公司',
        contactPerson: quote.linkMan || '未知联系人',
        quotePerson: quote.linkMan || '未知报价人',
        phone: quote.linkTel || '未知电话',
        inquiryDate: quote.createTime ? new Date(quote.createTime).toLocaleDateString() : new Date().toLocaleDateString(),
        validPeriod: quote.validPeriod || '30天' // 使用计算后的有效期
      }
    };
    
    // 5. 跳转到下载页
    wx.navigateTo({
      url: '/inquiryPackage/pages/downloadRecievedInquiry/downloadRecievedInquiry'
    });
  },

  // 跳转到附件下载页
  goToDownloadAttachment() {
    const { quoteFileList, quote } = this.data;
    
    const app = getApp();
    app.globalData.quoteData = {
      quote: { name: quote.name || '询价单附件' },
      quoteFileList
    };

    if (quoteFileList.length > 0) {
      wx.navigateTo({
        url: '/inquiryPackage/pages/downloadAttachment/downloadAttachment'
      });
    } else {
      wx.showToast({ title: '暂无附件可下载', icon: 'none' });
    }
  },

  // 打印功能
  printQuotation() {
    wx.showToast({ title: '打印功能开发中', icon: 'none' });
  }
});
