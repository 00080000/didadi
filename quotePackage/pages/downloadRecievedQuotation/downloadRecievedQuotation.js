const app = getApp();
const { numberToChinese } = require('../../../utils/util');

// 工具函数：数组包含检查
function arrayIncludes(arr, item) {
  if (!arr || typeof arr !== 'object' || typeof arr.length !== 'number') {
    return false;
  }
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === item) {
      return true;
    }
  }
  return false;
}

// 工具函数：字符串包含检查
function stringIncludes(str, substr) {
  if (typeof str !== 'string' || typeof substr !== 'string') {
    return false;
  }
  return str.indexOf(substr) !== -1;
}

// 清理文本内容
function cleanText(text, forPdf = false) {
  if (!text) return '';
  let cleaned = text;
  
  // 处理PDF中的图片标签
  if (forPdf) {
    cleaned = cleaned.replace(/<img[^>]*>/gi, '[图片]').replace(/<br\s*\/?>/gi, '\n');
  }
  
  // 移除HTML标签和特殊字符
  cleaned = cleaned.replace(/<[^>]*>?/gm, '')
                   .replace(/[\x00-\x1F\x7F]/g, '')
                   .replace(/&nbsp;/g, ' ')
                   .replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&quot;/g, '"')
                   .replace(/&#39;/g, "'");
  
  // 保留基本字符
  cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9.,，。、；;：:()（）《》<>“”""'':-]/g, ' ');
  
  // 去除多余空格
  return cleaned.replace(/\s+/g, ' ').trim();
}

// 临时文件清理
function cleanTempFiles(keepPath = '') {
  const fs = wx.getFileSystemManager();
  try {
    const tempDir = wx.env.USER_DATA_PATH;
    
    if (typeof tempDir !== 'string' || tempDir.trim() === '') {
      console.error('临时目录路径无效:', tempDir);
      return;
    }
    
    const files = fs.readdirSync(tempDir, { recursive: false });
    
    files.forEach(file => {
      const filePath = `${tempDir}/${file}`;
      // 跳过系统日志目录和需要保留的文件
      if (file === 'miniprogramLog' || filePath === keepPath) return;
      
      try {
        // 检查是否为文件（避免删除目录）
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          console.log(`清理临时文件: ${file}`);
        }
      } catch (e) {
        console.log(`清理文件失败: ${file}`, e);
      }
    });
  } catch (e) {
    console.log('清理临时目录失败', e);
  }
}

// 检查存储空间
function checkStorageSpace(requiredSizeMB = 0.5) {
  return new Promise((resolve, reject) => {
    wx.getStorageInfo({
      success: (storageRes) => {
        // 转换为MB (1MB = 1024*1024字节)
        const remainingSpaceMB = storageRes.remainingSpace / (1024 * 1024);
        const requiredSpace = requiredSizeMB;
        
        if (remainingSpaceMB >= requiredSpace * 0.5 || remainingSpaceMB === 0) {
          resolve(true);
        } else {
          reject(new Error(`存储空间可能不足（剩余${remainingSpaceMB.toFixed(2)}MB）`));
        }
      },
      fail: (err) => {
        console.warn('获取存储信息失败，继续尝试', err);
        resolve(true);
      }
    });
  });
}

// 生成安全的文件名
function getSafeFileName(originalName, ext) {
  const safeName = (originalName || '未命名报价单')
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
    .slice(0, 30); // 限制长度
  return `${safeName}.${ext}`;
}

// 生成CSV内容（修复格式问题）
function generateCSVContent(tableColumns, tableData, quote, amountChinese) {
  let csv = '';
  
  // 添加BOM头解决中文乱码（关键修复）
  csv += '\ufeff';
  
  // 表头
  const header = tableColumns.map(col => {
    const label = String(col.label || '');
    // 处理包含逗号或引号的表头
    return label.includes(',') || label.includes('"')
      ? `"${label.replace(/"/g, '""')}"`
      : label;
  }).join(',') + '\r\n'; // 使用\r\n确保Windows和手机兼容性
  csv += header;
  
  // 表格内容
  tableData.forEach(row => {
    const rowData = [];
    tableColumns.forEach(col => {
      const value = row[col.code] !== undefined ? row[col.code] : (col.label === '序号' ? row.index : '');
      const safeValue = String(value || '');
      
      // 处理特殊字符
      if (safeValue.includes(',') || safeValue.includes('"') || 
          safeValue.includes('\n') || safeValue.includes('\r')) {
        rowData.push(`"${safeValue.replace(/"/g, '""')}"`);
      } else {
        rowData.push(safeValue);
      }
    });
    csv += rowData.join(',') + '\r\n';
  });
  
  // 金额信息（修复列对齐问题）
  csv += '\r\n'; // 空行分隔
  csv += `,,总金额,,,${quote.totalPrice ? quote.totalPrice.toFixed(2) : '0.00'},元\r\n`;
  csv += `,,币种,,,人民币\r\n`;
  csv += `,,总计（大写）,,,${amountChinese}\r\n`;
  
  return csv;
}

Page({
  data: {
    quoteData: null,
    tableColumns: [],
    tableData: [],
    amountChinese: '',
    downloadFormats: [
      { type: 'pdf', name: 'PDF文件', icon: '/static/icons/pdf.png', desc: '保留完整格式的文档' },
      { type: 'doc', name: 'Word文件', icon: '/static/icons/doc.png', desc: '可编辑的文档格式' },
      { type: 'csv', name: '表格文件', icon: '/static/icons/xls.png', desc: '表格格式，适合数据处理' }
    ],
    loading: false,
    errorMsg: '',
    // 新增：记录当前生成的文件路径，用于转发
    currentFilePath: ''
  },

  onLoad() {
    cleanTempFiles();
    const globalQuoteData = app.globalData.quoteData;
    
    if (!globalQuoteData || !globalQuoteData.quote) {
      this.setData({ errorMsg: '未找到报价单数据' });
      return;
    }
    
    this.setData({ quoteData: globalQuoteData });
    this.processTableData(globalQuoteData);
  },

  processTableData(fullData) {
    const { quote, productGroupList, quoteCostCategoryList } = fullData;
    let tableData = [];
    let index = 1;

    // 解析表格列配置
    if (quote.dataJson) {
      try {
        let columns = JSON.parse(quote.dataJson);
        columns = columns.map(col => ({
            ...col,
            width: col.width || '150rpx',
            label: cleanText(col.label || '')
          }));
        this.setData({ tableColumns: columns });
      } catch (e) {
        console.error('解析表格配置失败', e);
        this.setData({ errorMsg: '表格配置解析失败' });
        return;
      }
    }

    // 处理商品分组数据
    if (productGroupList && productGroupList.length) {
      productGroupList.forEach(group => {
        // 添加分组名称行
        tableData.push({
          index: index++,
          productName: cleanText(group.productGroupName || ''),
          productCode: '',
          unitPrice: '',
          quantity: '',
          money: '',
          remark: ''
        });

        // 添加分组下的商品行
        if (group.quoteProductList && group.quoteProductList.length) {
          group.quoteProductList.forEach(product => {
            const productData = product.productData ? JSON.parse(product.productData) : {};
            tableData.push({
              index: index++,
              productName: cleanText(productData.productName || ''),
              productCode: cleanText(productData.productCode || ''),
              unitPrice: product.unitPrice ? product.unitPrice.toFixed(2) : '',
              quantity: product.quantity || '',
              money: product.calcPrice ? product.calcPrice.toFixed(2) : '',
              remark: cleanText(product.remark || '')
            });
          });
        }

        // 添加分组小计行
        tableData.push({
          index: index++,
          productName: '小计',
          productCode: '',
          unitPrice: '',
          quantity: '',
          money: group.subtotal ? group.subtotal.toFixed(2) : '',
          remark: ''
        });
      });
    }

    // 添加合计行
    tableData.push({
      index: index++,
      productName: '合计',
      productCode: '',
      unitPrice: '',
      quantity: '',
      money: quote.amountPrice ? quote.amountPrice.toFixed(2) : '',
      remark: ''
    });

    // 添加费用和优惠行
    if (quoteCostCategoryList && quoteCostCategoryList.length) {
      quoteCostCategoryList.forEach(cost => {
        const costData = cost.costCategoryData ? JSON.parse(cost.costCategoryData) : {};
        tableData.push({
          index: index++,
          productName: cleanText(costData.costName || ''),
          productCode: '',
          unitPrice: '',
          quantity: '',
          money: cost.calcPrice ? cost.calcPrice.toFixed(2) : '',
          remark: cleanText(cost.remark || '')
        });
      });
    }

    // 添加总计行
    tableData.push({
      index: index++,
      productName: '总计',
      productCode: '',
      unitPrice: '',
      quantity: '',
      money: quote.totalPrice ? quote.totalPrice.toFixed(2) : '',
      remark: ''
    });

    this.setData({ tableData });

    // 转换金额为大写
    if (quote.totalPrice) {
      const chinese = numberToChinese(quote.totalPrice);
      this.setData({ amountChinese: cleanText(chinese || '') });
    }
  },

  // 提取富文本内容
  extractPlainText(nodes, forPdf = false) {
    if (!nodes) return '';
    
    let text = '';
    if (typeof nodes === 'string') return cleanText(nodes, forPdf);
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type === 'text') {
        text += node.text || '';
      } else if (node.children && node.children.length) {
        text += this.extractPlainText(node.children, forPdf);
      }
    }
    
    return cleanText(text, forPdf);
  },

  // 生成PDF内容（修复格式问题）
  generatePDFContent(filePath) {
    const { quoteData, tableColumns, tableData, amountChinese } = this.data;
    const { quote } = quoteData;
    
    const quoteName = cleanText(quote.name || '未命名报价单', true);
    const headText = this.extractPlainText(quote.headText || '', true);
    const footText = this.extractPlainText(quote.footText || '', true);
    
    // 优化PDF HTML结构，确保兼容性
    const pdfHtml = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${quoteName}</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: SimSun, "Microsoft YaHei", Arial Unicode MS, sans-serif; 
            font-size: 12pt;
            line-height: 1.5;
          }
          .title { 
            text-align: center; 
            font-size: 16pt; 
            margin: 15px 0 30px 0; 
            font-weight: bold;
          }
          .section { margin: 20px 0; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            page-break-inside: avoid; /* 避免表格跨页 */
          }
          th, td { 
            border: 1px solid #333; 
            padding: 8px 5px; 
            text-align: center; 
            font-size: 10pt;
          }
          th { 
            background-color: #f0f0f0; 
            font-weight: bold;
          }
          .summary { 
            margin: 20px 0; 
            padding: 10px; 
            border: 1px dashed #666;
          }
          p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1 class="title">${quoteName}</h1>
        
        ${headText ? `<div class="section">${headText.split('\n').map(p => `<p>${p}</p>`).join('')}</div>` : ''}
        
        <table>
          <thead>
            <tr>${tableColumns.map(col => `<th>${col.label}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableData.map(row => `
              <tr>
                ${tableColumns.map(col => `
                  <td>${row[col.code] !== undefined ? row[col.code] : (col.label === '序号' ? row.index : '')}</td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <p>总金额：${quote.totalPrice ? quote.totalPrice.toFixed(2) : '0.00'} 元</p>
          <p>总计（大写）：${amountChinese}</p>
        </div>
        
        ${footText ? `<div class="section">${footText.split('\n').map(p => `<p>${p}</p>`).join('')}</div>` : ''}
      </body>
      </html>
    `;
    
    const fs = wx.getFileSystemManager();
    fs.writeFileSync(filePath, pdfHtml, 'utf8');
    return true;
  },

  // 生成Word文件（保留原有正常逻辑）
  generateDocContent(filePath) {
    const { quoteData, tableColumns, tableData, amountChinese } = this.data;
    const { quote } = quoteData;
    
    const quoteName = cleanText(quote.name || '未命名报价单');
    const headText = this.extractPlainText(quote.headText || '');
    const footText = this.extractPlainText(quote.footText || '');
    
    const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${quoteName}</title>
  <style>
    body { font-family: SimSun, "Microsoft YaHei", sans-serif; line-height: 1.6; padding: 20px; }
    .title { text-align: center; font-size: 22px; font-weight: bold; margin: 15px 0; }
    .head-text { margin: 15px 0; padding: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #333; padding: 8px; text-align: center; }
    th { background-color: #f5f5f5; }
    .summary { margin: 15px 0; padding: 10px; }
    .foot-text { margin: 15px 0; padding: 10px; }
  </style>
</head>
<body>
  <h1 class="title">${quoteName}</h1>
  
  ${headText ? `<div class="head-text">${headText}</div>` : ''}
  
  <table>
    <thead>
      <tr>
        ${tableColumns.map(col => `<th>${col.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableData.map(row => `
        <tr>
          ${tableColumns.map(col => `
            <td>
              ${row[col.code] !== undefined ? row[col.code] : (col.label === '序号' ? row.index : '')}
            </td>
          `).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="summary">
    <p>总金额：${quote.totalPrice ? quote.totalPrice.toFixed(2) : '0.00'} 元</p>
    <p>币种：人民币</p>
    <p>总计（大写）：${amountChinese}</p>
  </div>
  
  ${footText ? `<div class="foot-text">${footText}</div>` : ''}
</body>
</html>
    `;
    
    const fs = wx.getFileSystemManager();
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  },

  // 生成CSV文件
  generateCSVContentFile(filePath) {
    const { quoteData, tableColumns, tableData, amountChinese } = this.data;
    const { quote } = quoteData;
    
    const csvContent = generateCSVContent(tableColumns, tableData, quote, amountChinese);
    const fs = wx.getFileSystemManager();
    fs.writeFileSync(filePath, csvContent, 'utf8');
    return true;
  },

  // 下载文件主函数
  downloadFile(e) {
    const { type } = e.currentTarget.dataset;
    if (!type || !arrayIncludes(['pdf', 'doc', 'csv'], type)) {
      wx.showToast({ title: '不支持的文件类型', icon: 'none' });
      return;
    }
    
    this.setData({ loading: true, errorMsg: '' });
    const { quote } = this.data.quoteData;
    const fileNameBase = quote.name || '未命名报价单';
    const that = this;
    
    cleanTempFiles();
    
    checkStorageSpace(0.5)
      .then(() => that.actualDownload(fileNameBase, type))
      .catch((err) => {
        console.warn('存储空间警告，继续下载', err);
        wx.showToast({ title: '继续下载...', icon: 'none', duration: 1000 });
        setTimeout(() => that.actualDownload(fileNameBase, type), 500);
      });
  },
  
  // 实际执行下载
  actualDownload(fileNameBase, type) {
    const that = this;
    const fs = wx.getFileSystemManager();
    const ext = type;
    const fileName = getSafeFileName(fileNameBase, ext);
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    
    try {
      // 根据文件类型生成内容
      let generateSuccess = false;
      switch(type) {
        case 'pdf':
          generateSuccess = this.generatePDFContent(filePath);
          break;
        case 'doc':
          generateSuccess = this.generateDocContent(filePath);
          break;
        case 'csv':
          generateSuccess = this.generateCSVContentFile(filePath);
          break;
      }
      
      if (!generateSuccess) {
        throw new Error('文件生成失败');
      }
      
      // 保存当前文件路径，用于转发
      this.setData({ currentFilePath: filePath });
      
      // 先尝试预览，如果失败则提示转发
      wx.openDocument({
        filePath: filePath,
        fileType: type,
        showMenu: true, // 显示右上角菜单，支持转发
        success: () => {
          console.log(`${type}文件打开成功`);
          wx.showToast({ 
            title: '预览成功，可转发分享', 
            icon: 'success',
            duration: 2000
          });
        },
        fail: (err) => {
          console.error('打开文件失败', err);
          // 预览失败直接提示转发
          wx.showModal({
            title: '提示',
            content: '文件无法预览，是否直接转发？',
            confirmText: '转发',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                that.shareFile();
              }
            }
          });
        },
        complete: () => {
          // 延迟清理临时文件，确保转发可用
          setTimeout(() => cleanTempFiles(filePath), 30000); // 延长到30秒
          that.setData({ loading: false });
        }
      });
    } catch (err) {
      console.error('下载失败', err);
      that.setData({
        loading: false,
        errorMsg: err.message || '下载文件失败'
      });
      wx.showToast({ title: err.message || '下载失败', icon: 'none' });
    }
  },

  // 新增：直接转发文件
  shareFile() {
    const { currentFilePath } = this.data;
    if (!currentFilePath) {
      wx.showToast({ title: '未找到文件', icon: 'none' });
      return;
    }
    
    wx.shareFileMessage({
      filePath: currentFilePath,
      success: () => {
        wx.showToast({ title: '转发成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('转发失败', err);
        wx.showToast({ title: '转发失败', icon: 'none' });
      }
    });
  },

  // 返回上一页
  goBack() {
    cleanTempFiles();
    wx.navigateBack();
  },
  
  // 关闭错误提示
  closeError() {
    this.setData({ errorMsg: '' });
  },
  
  // 页面卸载时清理
  onUnload() {
    cleanTempFiles();
  }
})
    