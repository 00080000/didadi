Page({
  data: {
    requiredFields: [],    // 必选字段
    optionalFields: [],    // 可选字段
    originalFields: []     // 原始字段数据备份
  },

  onLoad() {
    // 初始化全局数据结构
    const app = getApp();
    if (!app.globalData.selectedFields) {
      app.globalData.selectedFields = {
        required: [],
        optional: []
      };
    }

    // 加载预设字段
    this.loadDefaultFields();
  },

  // 加载预设字段（使用指定的参数列表）
  loadDefaultFields() {
    // 指定的商品参数列表
    const allFields = [
      { name: '商品名称', code: 'productName', required: true, label: '商品名称' },
      { name: '商品编码', code: 'productCode', required: false, label: '商品编码' },
      { name: '标签', code: 'tag', required: false, label: '标签' },
      { name: '单位', code: 'unit', required: false, label: '单位' },
      { name: '单价', code: 'unitPrice', required: true, label: '单价' },
      { name: '品牌', code: 'brand', required: false, label: '品牌' },
      { name: '生产商', code: 'produceCompany', required: false, label: '生产商' }
    ];

    // 备份原始字段数据
    this.setData({ originalFields: [...allFields] }, () => {
      // 处理字段分类和选中状态
      this.processFields(allFields);
    });
  },

  // 处理字段分类（必选/可选）和选中状态
  processFields(allFields) {
    // 获取已保存的选中字段编码
    const app = getApp();
    const savedOptional = app.globalData.selectedFields.optional || [];

    // 分类必选和可选字段
    const requiredFields = [];
    const optionalFields = [];

    allFields.forEach(field => {
      if (field.required) {
        // 必选字段强制选中
        requiredFields.push({ ...field, isSelected: true });
      } else {
        // 可选字段根据已保存配置设置选中状态
        optionalFields.push({
          ...field,
          isSelected: savedOptional.includes(field.code)
        });
      }
    });

    this.setData({ requiredFields, optionalFields });
  },

  // 切换可选字段选中状态
  toggleField(e) {
    const index = e.currentTarget.dataset.index;
    const optionalFields = [...this.data.optionalFields];
    optionalFields[index].isSelected = !optionalFields[index].isSelected;
    this.setData({ optionalFields });
  },

  // 取消选择，返回上一页
  cancel() {
    wx.navigateBack();
  },

  // 确认选择，保存配置并返回上一页
  confirm() {
    const app = getApp();

    // 收集所有选中的字段编码（必选+可选）
    const requiredCodes = this.data.requiredFields.map(field => field.code);
    const optionalCodes = this.data.optionalFields
      .filter(field => field.isSelected)
      .map(field => field.code);

    // 保存到全局数据
    app.globalData.selectedFields = {
      required: requiredCodes,
      optional: optionalCodes,
      all: [...requiredCodes, ...optionalCodes]
    };

    // 通知上一页更新配置
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      // 调用上一页的方法更新商品显示字段
      if (typeof prevPage.updateProductFields === 'function') {
        prevPage.updateProductFields([...requiredCodes, ...optionalCodes]);
      }
    }

    wx.navigateBack();
  }
});
