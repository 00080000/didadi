const app = getApp();
// 引入工具函数
const { numberToChinese } = require('../../../utils/util');

// 全局定义数组包含检查函数
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

// 全局定义字符串包含检查函数
function stringIncludes(str, substr) {
  if (typeof str !== 'string' || typeof substr !== 'string') {
    return false;
  }
  return str.indexOf(substr) !== -1;
}

// 清理文本内容，只保留基本字符，特别处理PDF中的图片
function cleanText(text, forPdf = false) {
  if (!text) return '';
  let cleaned = text;
  
  // 1. 对于PDF，移除所有图片标签
  if (forPdf) {
    cleaned = cleaned.replace(/<img[^>]*>/gi, '[图片]');
  }
  
  // 2. 移除所有HTML标签
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');
  
  // 3. 移除特殊符号和控制字符
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  
  // 4. 替换特殊符号实体
  cleaned = cleaned.replace(/&nbsp;/g, ' ')
                   .replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&quot;/g, '"')
                   .replace(/&#39;/g, "'");
  
  // 5. 只保留中文、英文、数字和常见标点
  cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9.,，。、；;：:()（）《》<>“”""'':-]/g, ' ');
  
  // 6. 去除多余空格
  return cleaned.replace(/\s+/g, ' ').trim();
}

// 清理临时文件的函数 - 修复参数格式问题
function cleanTempFiles(keepPath = '') {
  const fs = wx.getFileSystemManager();
  try {
    // 获取临时目录路径
    const tempDir = wx.env.USER_DATA_PATH;
    
    // 检查路径是否为字符串
    if (typeof tempDir !== 'string' || tempDir.trim() === '') {
      console.error('临时目录路径无效:', tempDir);
      return;
    }
    
    // 获取临时目录下的所有文件 - 修复参数格式
    const files = fs.readdirSync(tempDir, {
      recursive: false
    });
    
    // 遍历并删除非当前下载的文件
    files.forEach(file => {
      const filePath = `${tempDir}/${file}`;
      // 不删除当前正在处理的文件
      if (filePath !== keepPath) {
        try {
          // 尝试删除文件 - 修复参数格式
          fs.unlinkSync(filePath);
          console.log(`清理临时文件: ${file}`);
        } catch (e) {
          console.log(`清理临时文件失败: ${file}`, e);
        }
      }
    });
  } catch (e) {
    console.log('清理临时文件目录失败', e);
  }
}

// 检查存储空间 - 进一步降低所需空间阈值至0.5MB
function checkStorageSpace(requiredSizeMB = 0.5) { // 降至0.5MB
  return new Promise((resolve, reject) => {
    wx.getSystemInfo({
      success: (res) => {
        // 转换为MB (1MB = 1024KB)
        const remainingSpaceMB = res.storageRemaining / 1024;
        const requiredSpace = requiredSizeMB;
        
        // 大幅放宽检查条件，只在明显不足时才提示
        // 对于小文件(我们的文件通常小于0.5MB)，即使检测显示不足也尝试下载
        if (remainingSpaceMB >= requiredSpace * 0.5 || remainingSpaceMB === 0) {
          resolve(true);
        } else {
          // 仅作为警告，仍允许继续
          reject(new Error(`存储空间可能不足，建议清理空间`));
        }
      },
      fail: (err) => {
        // 系统信息获取失败时，仍然尝试下载
        console.warn('获取系统信息失败，继续尝试下载', err);
        resolve(true);
      }
    });
  });
}

Page({
  data: {
    // 原始报价单数据
    quoteData: null,
    // 处理后的表格数据
    tableColumns: [],
    tableData: [],
    // 金额大写
    amountChinese: '',
    // 可下载的格式列表
    downloadFormats: [
      { type: 'pdf', name: 'PDF文件', icon: '/static/icons/pdf.png', desc: '保留完整格式的文档' },
      { type: 'doc', name: 'Word文件', icon: '/static/icons/doc.png', desc: '可编辑的文档格式' },
      { type: 'xls', name: 'xls文件', icon: '/static/icons/xls.png', desc: '表格格式，适合数据处理' }
    ],
    // 加载状态
    loading: false,
    // 错误信息
    errorMsg: ''
  },

  onLoad() {
    // 页面加载时先清理临时文件
    cleanTempFiles();
    
    // 从全局获取预览页的原始数据
    const globalQuoteData = app.globalData.quoteData;
    
    // 检查数据是否存在
    if (!globalQuoteData || !globalQuoteData.quote) {
      this.setData({
        errorMsg: '未找到报价单数据'
      });
      return;
    }
    
    // 存储原始数据
    this.setData({
      quoteData: globalQuoteData
    });
    
    // 处理表格数据
    this.processTableData(globalQuoteData);
  },

  // 处理表格数据
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
            label: cleanText(col.label || '') // 清理列标题
          }));
        this.setData({
             tableColumns: columns
        });
      } catch (e) {
        console.error('解析表格配置失败', e);
        this.setData({
          errorMsg: '表格配置解析失败'
        });
        return;
      }
    }

    // 处理商品分组数据
    if (productGroupList && productGroupList.length) {
      productGroupList.forEach(group => {
        // 添加分组名称行（清理文本）
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

  // 提取富文本内容（只保留纯文本）
  extractPlainText(nodes, forPdf = false) {
    if (!nodes) return '';
    
    let text = '';
    // 如果是字符串直接返回
    if (typeof nodes === 'string') return cleanText(nodes, forPdf);
    
    // 处理nodes数组（使用for循环）
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

  // 生成文件内容
  generateFileContent(type) {
    const { quoteData, tableColumns, tableData, amountChinese } = this.data;
    if (!quoteData || !quoteData.quote) return '';
    
    const { quote } = quoteData;
    let content = '';
    const isPdf = type === 'pdf';
    
    // 清理标题和文本内容，PDF需要特殊处理
    const quoteName = cleanText(quote.name || '未命名报价单', isPdf);
    const headText = this.extractPlainText(quote.headText || '', isPdf);
    const footText = this.extractPlainText(quote.footText || '', isPdf);
    
    // 根据不同格式生成内容
    switch(type) {
      case 'doc':
        // HTML格式（Word可直接识别）
        content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${quoteName}</title>
  <style>
    body { font-family: SimSun, "Microsoft YaHei", sans-serif; line-height: 1.8; }
    .title { text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
    .head-text { margin: 20px 0; padding: 10px; border-bottom: 1px solid #eee; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: center; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .summary { margin: 20px 0; padding: 10px; border-top: 1px solid #eee; }
    .foot-text { margin: 20px 0; padding: 10px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <h1 class="title">${quoteName}</h1>
  
  ${headText ? `<div class="head-text">${headText}</div>` : ''}
  
  <table>
    <thead>
      <tr>
        ${tableColumns.map(col => `<th style="width: ${col.width}">${col.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableData.map(row => `
        <tr>
          ${tableColumns.map(col => `
            <td style="width: ${col.width}">
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
        break;
        
      case 'xls':
        // CSV格式（可被Excel识别）- 添加UTF-8 BOM头解决中文乱码
        content = '\ufeff'; // 添加BOM头
        
        // 标题行
        content += tableColumns.map(col => {
          const label = String(col.label || '');
          return stringIncludes(label, ',') || stringIncludes(label, '"')
            ? `"${label.replace(/"/g, '""')}"`
            : label;
        }).join(',') + '\n';
        
        // 内容行（使用for循环）
        for (let i = 0; i < tableData.length; i++) {
          const row = tableData[i];
          const rowData = [];
          for (let j = 0; j < tableColumns.length; j++) {
            const col = tableColumns[j];
            const value = row[col.code] !== undefined ? row[col.code] : (col.label === '序号' ? row.index : '');
            const safeValue = String(value || '');
            
            // 处理包含特殊字符的值
            if (stringIncludes(safeValue, ',') || stringIncludes(safeValue, '"') || 
                stringIncludes(safeValue, '\n') || stringIncludes(safeValue, '\r')) {
              rowData.push(`"${safeValue.replace(/"/g, '""')}"`);
            } else {
              rowData.push(safeValue);
            }
          }
          content += rowData.join(',') + '\n';
        }
        
        // 金额信息（补充空列对齐表格结构）
        const emptyColumns = ','.repeat(tableColumns.length - 4);
        content += `\n,,总金额${emptyColumns},${quote.totalPrice ? quote.totalPrice.toFixed(2) : '0.00'},元\n`;
        content += `,,币种${emptyColumns},人民币\n`;
        content += `,,总计（大写）${emptyColumns},${amountChinese}\n`;
        break;
        
      case 'pdf':
        // PDF专用HTML，移除所有图片和复杂样式
        content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${quoteName}</title>
  <style>
    body { font-family: SimSun, "Microsoft YaHei", Arial Unicode MS, sans-serif; line-height: 1.6; padding: 20px; }
    .title { text-align: center; font-size: 20px; font-weight: bold; margin: 15px 0; }
    .head-text { margin: 15px 0; white-space: pre-line; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: center; font-size: 12px; }
    .summary { margin: 15px 0; padding: 10px; }
    .foot-text { margin: 15px 0; white-space: pre-line; }
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
        break;
    }
    
    return content;
  },

  // 下载文件
  downloadFile(e) {
    const { type } = e.currentTarget.dataset;
    if (!type) return;
    
    // 检查支持的文件类型
    const supportedTypes = ['pdf', 'doc', 'xls'];
    if (!arrayIncludes(supportedTypes, type)) {
      wx.showToast({ title: '不支持的文件类型', icon: 'none' });
      return;
    }
    
    // 显示加载
    this.setData({ loading: true, errorMsg: '' });
    
    const { quote } = this.data.quoteData;
    const fileNameBase = cleanText(quote.name || '未命名报价单');
    const that = this;
    
    // 先清理临时文件
    cleanTempFiles();
    
    // 检查存储空间，但即使检查失败也尝试继续
    checkStorageSpace(0.5) // 使用0.5MB的阈值
      .then(() => {
        // 存储空间检查通过，正常下载
        that.actualDownload(fileNameBase, type);
      })
      .catch((err) => {
        console.warn('存储空间检查有警告，但仍尝试下载', err);
        // 即使空间检查有警告也尝试下载，缩短提示时间
        wx.showToast({ 
          title: '继续下载...', 
          icon: 'none',
          duration: 1000
        });
        // 延迟一下让用户看到提示
        setTimeout(() => {
          that.actualDownload(fileNameBase, type);
        }, 500);
      });
  },
  
  // 实际执行下载操作的函数
  actualDownload(fileNameBase, type) {
    const that = this;
    try {
      // 生成文件内容
      const fileContent = this.generateFileContent(type);
      if (!fileContent) {
        wx.showToast({ title: '生成文件内容失败', icon: 'none' });
        this.setData({ loading: false });
        return;
      }
      
      // 保存文件到本地
      const ext = type === 'doc' ? 'html' : type;
      const fileName = `${fileNameBase}.${ext}`;
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      
      wx.getFileSystemManager().writeFile({
        filePath,
        data: fileContent,
        encoding: 'utf8',
        success: () => {
          // 保存到系统
          wx.saveFileToDisk({
            filePath: filePath,
            showActionSheet: true,
            success: (res) => {
              console.log('文件保存成功', res);
              wx.showToast({ 
                title: `文件已保存至: ${res.savedFilePath}`, 
                icon: 'none',
                duration: 3000
              });
              // 保存成功后清理临时文件
              setTimeout(() => {
                cleanTempFiles();
              }, 1000);
            },
            fail: (err) => {
              console.error('保存文件到系统失败', err);
              // 尝试打开文件
              that.openFile(filePath, type);
            },
            complete: () => {
              that.setData({ loading: false });
            }
          });
        },
        fail: (err) => {
          console.error('写入文件失败', err);
          // 尝试清理空间后重试
          if (err.errMsg.includes('exceeded')) {
            cleanTempFiles();
            wx.showToast({ title: '已清理缓存，请重试', icon: 'none' });
          } else {
            wx.showToast({ title: '下载失败', icon: 'none' });
          }
          that.setData({ loading: false });
        }
      });
    } catch (err) {
      console.error('下载文件异常', err);
      this.setData({ 
        loading: false,
        errorMsg: '下载文件时发生错误: ' + (err.message || err)
      });
    }
  },

  // 打开文件
  openFile(filePath, fileType) {
    const that = this;
    wx.openDocument({
      filePath,
      fileType,
      showMenu: true,
      success: () => {
        console.log(`${fileType}文件打开成功`);
      },
      fail: (err) => {
        console.error('打开文件失败', err);
        that.setData({ 
          errorMsg: `文件已下载，但无法预览: ${err.errMsg || '未知错误'}`
        });
        // 提示用户文件已保存
        wx.showToast({
          title: '文件已保存，请在文件管理器中查看',
          icon: 'none',
          duration: 3000
        });
      },
      complete: () => {
        // 清理临时文件
        setTimeout(() => {
          cleanTempFiles();
        }, 2000);
        that.setData({ loading: false });
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
  
  // 页面卸载时清理临时文件
  onUnload() {
    cleanTempFiles();
  }
})