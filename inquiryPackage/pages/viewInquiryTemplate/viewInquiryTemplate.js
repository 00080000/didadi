const app = getApp();
// 引入工具函数
const { numberToChinese } = require('../../../utils/util');

Page({
  data: {
    inquiryId: null,
    quote: {}, // 询价单基础信息
    tableColumns: [], // 表格列配置
    tableData: [], // 表格数据
    quoteFileList: [], // 附件列表
    isLoading: true,
    errorMsg: '',
    totalAmount: 0 // 存储计算后的总金额
  },

  onLoad(options) {
    console.log('传入的参数:', options.id);
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
    wx.showLoading({ title: '加载中...', mask: true });

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/inQuote/${inquiryId}`,
      method: "GET",
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`,
        "accept": "*/*"
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const viewData = res.data.data || {};
          this.setData({ 
            quoteFileList: viewData.quoteFileList || [],
            totalAmount: 0 // 重置总金额
          });
          this.renderInquiryData(viewData);
        } else {
          this.setData({
            errorMsg: res.data.msg || '获取询价单详情失败',
            isLoading: false
          });
          wx.showToast({ title: res.data.msg || '获取失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('请求失败', err);
        this.setData({
          errorMsg: '网络错误，请重试',
          isLoading: false
        });
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 渲染询价单数据（核心：补充每行金额计算）
   */
  renderInquiryData(fullData) {
    app.globalData.inquiryData = fullData;
    const { quote, productGroupList } = fullData;
    let tableData = [];
    let index = 1;
    let totalAmount = 0; // 累计总金额

    // 解析表格列配置（确保包含金额列）
    const tableColumns = this.parseTableColumns(quote.dataJson);
    this.setData({ tableColumns });
    console.log('表格列配置:', tableColumns);

    // 处理商品分组数据
    if (productGroupList && productGroupList.length) {
      productGroupList.forEach(group => {
        // 添加分组名称行（无金额）
        if (group.productGroupName) {
          const groupRow = this.createTableRow(index++, {
            productName: group.productGroupName
          });
          tableData.push(groupRow);
        }

        // 处理分组下的商品，计算每行金额
        if (group.quoteProductList && group.quoteProductList.length) {
          group.quoteProductList.forEach(product => {
            // 解析商品详细数据
            let productData = {};
            try {
              productData = product.productData ? JSON.parse(product.productData) : {};
            } catch (e) {
              console.error('解析商品数据失败:', e);
              productData = {};
            }

            // 提取单价和数量（转为数字类型）
            const unitPrice = Number(product.unitPrice || productData.unitPrice || 0);
            const quantity = Number(product.quantity || productData.quantity || 1);
            // 计算当前行商品金额（单价 × 数量）
            const rowMoney = Number((unitPrice * quantity).toFixed(2)); // 保留两位小数
            // 累计总金额
            totalAmount = Number((totalAmount + rowMoney).toFixed(2));

            // 构建商品行数据（包含金额字段）
            const productRow = this.createTableRow(index++, {
              productName: product.productName || productData.productName || "未命名商品",
              productCode: product.productCode || productData.productCode || "无编码",
              brand: productData.brand || '未知品牌',
              tag: productData.tag || '无标签',
              produceCompany: productData.produceCompany || '未知厂家',
              unit: productData.unit || '个',
              unitPrice: unitPrice.toFixed(2), // 格式化单价
              quantity: quantity,
              money: rowMoney, // 本行金额（核心补充）
              remark: product.remark || productData.remark || "-"
            });
            tableData.push(productRow);
          });
        }
      });
    }

    // 添加总计行（总金额 = 所有行金额之和）
    const totalRow = this.createTableRow(index++, {
      productName: '总计',
      unitPrice: '',
      productCode: '',
      quantity: '',
      brand: '',
      tag: '',
      produceCompany: '',
      unit: '',
      remark: '',
      money: totalAmount, // 总金额
      // 突出显示总计行
      background: '#f5f5f5',
      fontWeight: 'bold'
    });
    tableData.push(totalRow);

    console.log('最终表格数据（含每行金额）:', tableData);
    console.log('计算的总金额:', totalAmount);

    // 计算有效期
    const validPeriod = this.calculateValidDays(quote.createTime, quote.validityTime);

    // 更新页面数据
    this.setData({
      quote: { ...quote, validPeriod, calculatedTotal: totalAmount },
      tableData,
      totalAmount,
      isLoading: false
    }, () => {
      console.log('页面数据已更新，表格行数:', this.data.tableData.length);
    });
  },

  /**
   * 解析表格列配置（确保金额列存在）
   */
  parseTableColumns(dataJson) {
    if (dataJson) {
      try {
        const columns = JSON.parse(dataJson);
        // 强制添加金额列（code: "money"），确保与行数据匹配
        const hasMoneyColumn = columns.some(col => col.code === 'money' || col.label === '金额');
        if (!hasMoneyColumn) {
          columns.push({ 
            label: "金额", 
            align: "center", 
            code: "money",
            width: "150rpx",
            background: "#f9f9f9" // 金额列背景色区分
          });
        }
        return columns.map(col => ({
          ...col,
          width: col.width || '150rpx',
          align: col.align || 'center',
          code: col.code || col.label.toLowerCase().replace(/\s+/g, '')
        }));
      } catch (e) {
        console.error('解析表格配置失败', e);
      }
    }

    // 默认列配置（包含金额列）
    return [
      { label: "序号", width: "60rpx", background: "#ececec", align: "center", code: "index" },
      { label: "商品名称", align: "center", code: "productName" },
      { label: "商品编码", align: "center", code: "productCode" },
      { label: "品牌", align: "center", code: "brand" },
      { label: "生产厂家", align: "center", code: "produceCompany" },
      { label: "标签", align: "center", code: "tag" },
      { label: "单位", align: "center", code: "unit" },
      { label: "单价", align: "center", code: "unitPrice" },
      { label: "数量", background: "#ececec", align: "left", code: "quantity" },
      { label: "金额", align: "center", code: "money", background: "#f9f9f9" }, // 金额列
      { label: "备注", background: "#ececec", align: "left", code: "remark", width: "140rpx" }
    ];
  },

  /**
   * 创建表格行数据（确保金额字段正确映射）
   */
  createTableRow(index, data) {
    const row = { index };
    this.data.tableColumns.forEach(col => {
      // 应用行样式（如总计行背景色）
      if (data.background) row.background = data.background;
      if (data.fontWeight) row.fontWeight = data.fontWeight;
      // 填充数据，金额字段特殊处理（确保数字类型）
      if (col.code === 'money') {
        row[col.code] = data[col.code] !== undefined ? 
          (typeof data[col.code] === 'number' ? data[col.code].toFixed(2) : data[col.code]) : 
          "0.00";
      } else {
        row[col.code] = data[col.code] !== undefined ? data[col.code] : "-";
      }
    });
    return row;
  },

  /**
   * 计算有效期天数
   */
  calculateValidDays(createTime, validityTime) {
    if (!createTime || !validityTime) return '30天';
    try {
      // 修复iOS日期格式问题
      const formatDate = (dateStr) => dateStr.replace(/-/g, '/');
      const createDate = new Date(formatDate(createTime));
      const validityDate = new Date(formatDate(validityTime));
      if (isNaN(createDate.getTime()) || isNaN(validityDate.getTime())) {
        throw new Error('日期格式无效');
      }
      const timeDiff = validityDate.getTime() - createDate.getTime();
      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      return days > 0 ? `${days}天` : '1天';
    } catch (e) {
      console.error('计算有效期失败:', e);
      return '30天';
    }
  },

  /**
   * 获取列值（格式化金额显示）
   */
  getColumnValue(row, column) {
    if (row && column && column.code) {
      // 金额列显示两位小数
      if (column.code === 'money') {
        return row[column.code] !== undefined ? 
          (typeof row[column.code] === 'number' ? row[column.code].toFixed(2) : row[column.code]) : 
          "0.00";
      }
      return row[column.code] !== undefined ? row[column.code] : "-";
    }
    return "-";
  },

  // 下载询价单文档
  goToDownloadQuotation() {
    const { quote, tableColumns, tableData, totalAmount } = this.data;
    const header = tableColumns.map(col => col.label);
    const rows = tableData.map(row => 
      tableColumns.map(col => this.getColumnValue(row, col))
    );

    const app = getApp();
    app.globalData.tableExportData = {
      title: quote.name || `询价单${new Date().getTime()}`,
      header,
      rows,
      inquiryInfo: {
        purchaseCompany: quote.companyName || '未知采购方',
        supplierCompany: quote.supplierCompany || '贵公司',
        contactPerson: quote.linkMan || '未知联系人',
        phone: quote.linkTel || '未知电话',
        inquiryDate: quote.createTime ? new Date(quote.createTime).toLocaleDateString() : new Date().toLocaleDateString(),
        validPeriod: quote.validPeriod || '30天',
        totalAmount: totalAmount.toFixed(2)
      }
    };

    wx.navigateTo({
      url: '/inquiryPackage/pages/downloadRecievedInquiry/downloadRecievedInquiry'
    });
  },

  // 跳转到附件下载页
  goToDownloadAttachment() {
    const { quoteFileList, quote } = this.data;
    const app = getApp();
    app.globalData.inquiryData = {
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
    wx.showToast({ title: '请前往电脑端打印...', icon: 'loading', duration: 1000 });
  },

  closeError() {
    this.setData({ errorMsg: '' });
  }
});