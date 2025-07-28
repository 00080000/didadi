Page({
  data: {
    inquiryId: null,
    quote: {},
    productFieldList: [], // 商品字段配置（从dataJson解析）
    productGroupList: [], // 商品分组列表
    quoteFileList: [], // 附件列表（新增：用于传递到下载页）
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
          // 保存附件列表（用于后续跳转下载页）
          const quoteFileList = res.data.data.quoteFileList || [];
          this.setData({ quoteFileList });
          
          // 调用核心解析函数处理数据
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
   * 核心解析函数：处理接口返回的完整数据
   * @param {Object} data - 接口返回的data对象
   */
  parseQuoteData(data) {
    try {
      // 1. 解析商品字段配置（优先使用quote.dataJson中的配置）
      const productFieldList = this.parseProductFields(data.quote.dataJson);
      
      // 2. 处理商品分组列表（补充空分组名称的默认显示）
      const productGroupList = this.processProductGroups(data.productGroupList);
      
      // 3. 整理最终数据
      this.setData({
        quote: data.quote || {},
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
   * 解析商品字段配置（从quote.dataJson提取）
   * @param {String} dataJson - quote中的dataJson字符串
   * @returns {Array} 格式化后的字段配置列表
   */
  parseProductFields(dataJson) {
    // 容错处理：如果dataJson为空，返回默认配置
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

    // 解析JSON字符串
    try {
      const fields = JSON.parse(dataJson);
      // 过滤掉序号列（在页面中手动添加）
      return fields.filter(field => field.label !== "序号");
    } catch (e) {
      console.error('解析dataJson失败', e);
      // 解析失败时返回默认配置
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

    // 为每个分组补充默认名称，处理商品数据
    return groups.map(group => ({
      ...group,
      // 为空分组设置默认名称
      productGroupName: group.productGroupName || "商品组",
      // 处理商品列表（确保productData解析正确）
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
      // 解析productData（可能是字符串或对象）
      const productData = typeof product.productData === 'string' 
        ? JSON.parse(product.productData) 
        : (product.productData || {});
      
      // 合并商品数据：优先使用product本身的字段，再补充productData中的字段
      return {
        ...product,
        productData, // 保存解析后的productData
        // 补充关键字段（避免页面中重复解析）
        productName: product.productName || productData.productName || "未命名商品",
        productCode: product.productCode || productData.productCode || "无编码",
        unitPrice: product.unitPrice || productData.unitPrice || 0,
        quantity: product.quantity || 1
      };
    } catch (e) {
      console.error('解析商品数据失败', e);
      // 解析失败时返回原始数据（避免整个商品不显示）
      return {
        ...product,
        productData: {},
        productName: product.productName || "未命名商品",
        productCode: product.productCode || "无编码"
      };
    }
  },

  /**
   * 在页面中获取商品字段值的辅助函数
   * @param {Object} product - 商品对象
   * @param {String} code - 字段编码（如productName）
   * @returns {any} 字段值
   */
  getProductValue(product, code) {
    // 优先从商品对象直接获取，再从productData中获取
    return product[code] || product.productData?.[code] || "-";
  },

  // 下载询价单文档（跳转到文档下载页或直接下载）
  goToDownloadQuotation() {
    const { quote } = this.data;
    if (!quote.id) {
      wx.showToast({ title: '询价单数据异常', icon: 'none' });
      return;
    }

    // 这里假设询价单文档下载需要单独接口，若直接下载可调用wx.downloadFile
    wx.showLoading({ title: '准备下载...', mask: true });
    
    // 模拟文档下载（实际项目替换为真实接口）
    setTimeout(() => {
      wx.hideLoading();
      // 若有文档下载接口，可参考附件下载逻辑实现
      wx.showToast({ title: '文档下载成功', icon: 'success' });
    }, 1000);
  },

  // 跳转到附件下载页
  goToDownloadAttachment() {
    const { quoteFileList, quote } = this.data;
    
    // 保存附件数据到全局，供下载页使用
    const app = getApp();
    app.globalData.quoteData = {
      quote: { name: quote.name || '询价单附件' }, // 传递询价单名称
      quoteFileList // 传递附件列表
    };

    // 跳转到附件下载页
    if (quoteFileList.length > 0) {
      wx.navigateTo({
        url: '/inquiryPackage/pages/downloadAttachment/downloadAttachment' // 附件下载页路径
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