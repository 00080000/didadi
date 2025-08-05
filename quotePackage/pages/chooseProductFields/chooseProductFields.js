// quotePackage/pages/chooseProductFields/chooseProductFields.js
Page({
    data: {
      requiredFields: [],    // 必选字段
      optionalFields: [],    // 可选字段
      originalFields: []     // 原始字段数据备份
    },
  
    onLoad() {
      // 先获取全局数据，确保数据结构完整
      const app = getApp();
      if (!app.globalData.submitData) {
        app.globalData.submitData = {};
      }
      // 确保quote对象存在
      if (!app.globalData.submitData.quote) {
        app.globalData.submitData.quote = {};
      }
      this.fetchProductTemplate();
    },
  
    // 获取商品模板字段
    fetchProductTemplate() {
      const app = getApp();
      wx.showLoading({ title: '加载中...' });
  
      wx.request({
        url: `${app.globalData.serverUrl}/diServer/product/getProductTemplate`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`,
          'accept': '*/*'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            // 先保存原始字段数据
            const allFields = res.data.data.itemList;
            this.setData({ originalFields: allFields.slice() }, () => {
              // 再处理字段，确保originalFields已存在
              this.processFields(allFields);
            });
          } else {
            wx.showToast({
              title: res.data.msg || '获取字段失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    },
  
    // 处理字段数据 - 使用正确的数据路径
    processFields(fields) {
      // 先获取已选中的字段编码（确保originalFields已加载）
      const selectedCodes = this.getAlreadySelectedCodes();
      
      // 过滤掉不需要的字段：状态、产品图片、有效时间
      const filteredFields = [];
      const excludeCodes = ['status', 'pics', 'validityTime'];
      
      for (let i = 0; i < fields.length; i++) {
        let shouldExclude = false;
        for (let j = 0; j < excludeCodes.length; j++) {
          if (fields[i].code === excludeCodes[j]) {
            shouldExclude = true;
            break;
          }
        }
        if (!shouldExclude) {
          filteredFields.push(fields[i]);
        }
      }
  
      // 区分必选和可选字段
      const requiredFields = [];
      const optionalFields = [];
  
      for (let i = 0; i < filteredFields.length; i++) {
        const field = filteredFields[i];
        if (field.required) {
          requiredFields.push(field);
        } else {
          // 检查是否在已选中列表中
          let isSelected = false;
          for (let j = 0; j < selectedCodes.length; j++) {
            if (field.code === selectedCodes[j]) {
              isSelected = true;
              break;
            }
          }
          
          optionalFields.push({
            ...field,
            isSelected: isSelected
          });
        }
      }
  
      this.setData({
        requiredFields,
        optionalFields
      });
    },
  
    // 从正确路径提取已选中的可选字段code（修复数据路径）
    getAlreadySelectedCodes() {
      const app = getApp();
      const selectedCodes = [];
      
      // 关键修复：从quote对象中获取dataJson
      if (!app.globalData.submitData || !app.globalData.submitData.quote || !app.globalData.submitData.quote.dataJson) {
        console.log('没有找到quote.dataJson，不默认选中任何可选字段');
        return selectedCodes; // 返回空数组，不默认选中任何可选字段
      }
      
      try {
        // 从quote对象解析dataJson
        const tableColumns = JSON.parse(app.globalData.submitData.quote.dataJson);
        console.log('从quote.dataJson解析到的表格列:', tableColumns);
        
        // 遍历表格列
        for (let i = 0; i < tableColumns.length; i++) {
          const column = tableColumns[i];
          // 只处理有code的列
          if (column.code && column.code !== '') {
            // 排除固定列
            let isFixedColumn = false;
            const fixedCodes = ['quantity', 'money', 'remark'];
            for (let f = 0; f < fixedCodes.length; f++) {
              if (column.code === fixedCodes[f]) {
                isFixedColumn = true;
                break;
              }
            }
            
            if (!isFixedColumn) {
              // 检查是否是必选字段
              let isRequired = false;
              for (let j = 0; j < this.data.originalFields.length; j++) {
                const field = this.data.originalFields[j];
                if (field.code === column.code && field.required) {
                  isRequired = true;
                  break;
                }
              }
              
              // 只添加可选字段
              if (!isRequired) {
                selectedCodes.push(column.code);
                console.log('添加已选中的可选字段:', column.code);
              }
            }
          }
        }
      } catch (e) {
        console.error('解析quote.dataJson失败:', e);
        return selectedCodes; // 解析失败也返回空数组，不默认选中
      }
      
      console.log('最终提取的已选中可选字段:', selectedCodes);
      return selectedCodes;
    },
  
    // 切换可选字段的选中状态
    toggleField(e) {
      const index = e.currentTarget.dataset.index;
      const optionalFields = this.data.optionalFields.slice();
      optionalFields[index].isSelected = !optionalFields[index].isSelected;
      this.setData({ optionalFields }, () => {
        console.log('切换后可选字段状态:', this.data.optionalFields);
      });
    },
  
    // 取消选择
    cancel() {
      wx.navigateBack();
    },
  
    // 确认选择 - 保存到正确的路径，优化用户体验
    confirm() {
      const app = getApp();
      if (!app.globalData.submitData) {
        app.globalData.submitData = {};
      }
      // 确保quote对象存在
      if (!app.globalData.submitData.quote) {
        app.globalData.submitData.quote = {};
      }
  
      // 收集所有选中的字段
      const allSelectedFields = [];
      
      // 添加必选字段
      for (let i = 0; i < this.data.requiredFields.length; i++) {
        allSelectedFields.push(this.data.requiredFields[i]);
      }
      
      // 添加选中的可选字段
      const selectedOptionalCodes = [];
      for (let i = 0; i < this.data.optionalFields.length; i++) {
        const field = this.data.optionalFields[i];
        if (field.isSelected) {
          allSelectedFields.push(field);
          selectedOptionalCodes.push(field.code);
        }
      }
      console.log('确认选中的可选字段:', selectedOptionalCodes);
  
      // 构建dataJson结构
      const tableColumns = [{
        "label": "序号",
        "width": "50px",
        "background": "#ececec",
        "align": "center"
      }];
  
      // 添加选择的字段列
      for (let i = 0; i < allSelectedFields.length; i++) {
        const field = allSelectedFields[i];
        tableColumns.push({
          "label": field.label,
          "width": "",
          "align": "center",
          "code": field.code
        });
      }
  
      // 添加固定列
      tableColumns.push(
        {
          "label": "数量",
          "background": "#ececec",
          "align": "left",
          "code": "quantity"
        },
        {
          "label": "金额",
          "background": "#ececec",
          "align": "left",
          "code": "money"
        },
        {
          "label": "备注",
          "background": "#ececec",
          "align": "left",
          "code": "remark",
          "width": "140px"
        }
      );
  
      // 保存到正确的路径：quote.dataJson
      app.globalData.submitData.quote.dataJson = JSON.stringify(tableColumns);
      console.log('更新后的quote.dataJson:', app.globalData.submitData.quote.dataJson);
  
      // 更新productFieldList
      const productFieldList = [];
      for (let i = 0; i < allSelectedFields.length; i++) {
        const field = allSelectedFields[i];
        productFieldList.push({
          productFieldCode: field.code,
          productFieldName: field.label
        });
      }
      productFieldList.push(
        { productFieldCode: "quantity", productFieldName: "数量" },
        { productFieldCode: "money", productFieldName: "金额" },
        { productFieldCode: "remark", productFieldName: "备注" }
      );
      app.globalData.submitData.productFieldList = productFieldList;
  
      // 直接返回上一页
      wx.navigateBack();
    }
  });
      