const app = getApp();
const { numberToChinese } = require('../../../utils/util');
// 引入 pdf-lib
const pdfLibTemp = require('./pdf-lib/pdf-lib.min.js'); 
// 引入 fontkit（确保路径和文件名正确）
const fontkit = require('./fontkit-miniprogram.js'); 
console.log('pdfLibTemp 加载成功，模块内容:', pdfLibTemp);
console.log('fontkit 加载成功:', fontkit); // 确认输出为 object

// 状态标记
let PDFLib = null, PDFDocument = null, StandardFonts = null, rgb = null;
let isPdfLibLoaded = false;

const loadPdfLib = () => {
    console.log('开始执行pdf-lib加载逻辑');
    try {
      const module = pdfLibTemp;
  
      // 验证核心功能
      if (!module) throw new Error('模块为空');
      if (typeof module.PDFDocument !== 'function') {
        throw new Error(`PDFDocument 类型异常：${typeof module.PDFDocument}`);
      }
      if (typeof module.rgb !== 'function') throw new Error('rgb方法不存在');
      if (!module.StandardFonts) throw new Error('StandardFonts不存在');
  
      // 关键修改：兼容没有直接注册方法的版本
      let fontkitRegistered = false;
      
      // 尝试通过PDFDocument原型注册（新的注册方式）
      if (module.PDFDocument && module.PDFDocument.prototype && typeof module.PDFDocument.prototype.registerFontkit === 'function') {
        module.PDFDocument.prototype.registerFontkit(fontkit);
        console.log(' fontkit 通过 PDFDocument原型注册成功');
        fontkitRegistered = true;
      } 
      // 尝试直接将fontkit挂载到模块上（某些特殊版本的处理方式）
      else if (typeof module.fontkit === 'undefined') {
        module.fontkit = fontkit;
        console.log(' fontkit 直接挂载到模块成功');
        fontkitRegistered = true;
      }
      // 检测到模块包含FontkitNotRegisteredError但无法注册时的兼容处理
      else if (module.FontkitNotRegisteredError) {
        console.warn(' 检测到FontkitNotRegisteredError，尝试使用内置字体规避');
        fontkitRegistered = true; // 即使注册失败也继续，使用标准字体
      }
  
      if (!fontkitRegistered) {
        throw new Error('模块不支持 fontkit 注册方法（无 setFontkit/registerFontkit）');
      }
  
      // 赋值核心对象
      PDFLib = module;
      PDFDocument = module.PDFDocument;
      StandardFonts = module.StandardFonts;
      rgb = module.rgb;
      isPdfLibLoaded = true;
  
      console.log(' pdf-lib 加载成功，fontkit 状态:', fontkitRegistered);
    } catch (err) {
      console.error(' pdf-lib加载失败:', err.message);
    }
  };

// 执行加载
loadPdfLib();

// 5秒后检查状态（验证加载结果）
setTimeout(() => {
  console.log('5秒后加载状态:', {
    isPdfLibLoaded,
    PDFLib: PDFLib ? '已定义（模块正常）' : '未定义',
    PDFDocument: typeof PDFDocument === 'function' ? '正常（function）' : '异常'
  });
}, 5000);

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

// 生成CSV内容
function generateCSVContent(tableColumns, tableData, quote, amountChinese) {
  let csv = '';
  
  // 添加BOM头解决中文乱码
  csv += '\ufeff';
  
  // 表头
  const header = tableColumns.map(col => {
    const label = String(col.label || '');
    // 处理包含逗号或引号的表头
    return label.includes(',') || label.includes('"')
      ? `"${label.replace(/"/g, '""')}"`
      : label;
  }).join(',') + '\r\n'; // 使用\r\n确保兼容性
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
  
  // 金额信息
  csv += '\r\n'; // 空行分隔
  csv += `,,总金额,,,${quote.totalPrice ? quote.totalPrice.toFixed(2) : '0.00'},元\r\n`;
  csv += `,,币种,,,人民币\r\n`;
  csv += `,,总计（大写）,,,${amountChinese}\r\n`;
  
  return csv;
}

// 从后端加载字体Base64数据
const loadChineseFontBase64 = () => {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '加载资源...' });
    // 从后端下载字体Base64文件
    const url = `${getApp().globalData.serverUrl}/diServer/common/download/resource?resource=/profile/upload/2025/08/26/ncwUJ7ZkUeLt613eb503c64219ae082197f91eed7923_20250826224252A054.txt`;
    
    wx.downloadFile({
      url: url,
      filePath: `${wx.env.USER_DATA_PATH}/simsun-base64.txt`,
      success: (res) => {
        if (res.statusCode === 200) {
          const fs = wx.getFileSystemManager();
          fs.readFile({
            filePath: res.filePath,
            encoding: 'utf8',
            success: (readRes) => {
              wx.hideLoading();
              // 返回纯Base64字符串
              resolve(readRes.data);
            },
            fail: (err) => {
              wx.hideLoading();
              reject(new Error(`读取字体文件失败: ${err.errMsg}`));
            }
          });
        } else {
          wx.hideLoading();
          reject(new Error(`字体下载失败，状态码: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        reject(new Error(`下载字体文件失败: ${err.errMsg}`));
      }
    });
  });
};

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
    currentFilePath: '',
    pdfLoading: false // PDF专用加载状态
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

  async generatePDFContent(filePath) {
    // 1. 等待PDF库加载完成（最多等待5秒，确保库就绪）
    const waitPdfLibLoad = () => {
        return new Promise((resolve, reject) => {
            let waitTime = 0;
            const checkInterval = setInterval(() => {
                if (isPdfLibLoaded) {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (waitTime >= 5000) {
                    clearInterval(checkInterval);
                    reject(new Error('PDF库加载超时，请稍后重试'));
                }
                waitTime += 100;
            }, 100);
        });
    };

    // 2. Base64转Uint8Array（加载中文字体专用，兼容废弃API）
    const base64ToUint8Array = (base64Str) => {
        try {
            const pureBase64 = base64Str.replace(/^data:.*;base64,/, '');
            let arrayBuffer;

            if (wx.base64ToArrayBuffer) {
                arrayBuffer = wx.base64ToArrayBuffer(pureBase64);
            } else {
                const binaryStr = atob(pureBase64);
                const len = binaryStr.length;
                const uint8Arr = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    uint8Arr[i] = binaryStr.charCodeAt(i);
                }
                arrayBuffer = uint8Arr.buffer;
            }

            return new Uint8Array(arrayBuffer);
        } catch (decodeErr) {
            console.error('Base64转Uint8Array失败:', decodeErr);
            throw new Error(`字体解码失败：${decodeErr.message}`);
        }
    };

    // 3. Uint8Array转二进制字符串
    const uint8ArrayToBinaryString = (uint8Array) => {
        let binaryStr = '';
        const len = uint8Array.length;
        for (let i = 0; i < len; i++) {
            binaryStr += String.fromCharCode(uint8Array[i]);
        }
        return binaryStr;
    };

    try {
        // 步骤1：等待PDF库加载
        await waitPdfLibLoad();
        console.log('PDF库加载完成');

        // 步骤2：加载中文字体
        const simsunBase64 = await loadChineseFontBase64();
        const fontBytes = base64ToUint8Array(simsunBase64);
        console.log('字体加载成功，大小：', fontBytes.length, '字节');

        // 步骤3：获取页面数据（报价单相关）
        const { quoteData, tableColumns, tableData, amountChinese } = this.data;
        const { quote } = quoteData;
        const quoteName = cleanText(quote.name || '未命名报价单', true);
        const headText = this.extractPlainText(quote.headText || '', true);
        const footText = this.extractPlainText(quote.footText || '', true);

        // 步骤4：创建PDF文档实例
        const pdfDoc = await PDFDocument.create();

        // 步骤5：嵌入中文字体
        const simsunFont = await pdfDoc.embedFont(fontBytes);
        console.log('中文字体嵌入成功');

        // 步骤6：添加A4页面（595.28x841.89pt = 210x297mm）
        let page = pdfDoc.addPage([595.28, 841.89]);
        let { width: pageWidth, height: pageHeight } = page.getSize();
        const pageMargin = 50;
        let currentY = pageHeight - pageMargin;

        // 步骤7：绘制报价单标题（居中）
        page.drawText(quoteName, {
            x: pageWidth / 2,
            y: currentY,
            font: simsunFont,
            size: 18,
            color: rgb(0, 0, 0),
            align: 'center'
        });
        currentY -= 40;

        // 步骤8：绘制头部文本（如客户信息、说明）
        if (headText) {
            const headLines = headText.split('\n');
            headLines.forEach(line => {
                page.drawText(line, {
                    x: pageMargin,
                    y: currentY,
                    font: simsunFont,
                    size: 12,
                    color: rgb(0, 0, 0),
                    maxWidth: pageWidth - pageMargin * 2
                });
                currentY -= 20;
            });
            currentY -= 10;
        }

        // 步骤9：绘制表格（表头+内容+边框）
        const tableTotalWidth = pageWidth - pageMargin * 2;
        const tableRowHeight = 25;
        const tableHeaderHeight = 30;
        const columnCount = tableColumns.length;
        const columnWidth = tableTotalWidth / columnCount;

        // 9.1 表头背景（浅灰色）
        page.drawRectangle({
            x: pageMargin,
            y: currentY - tableHeaderHeight,
            width: tableTotalWidth,
            height: tableHeaderHeight,
            color: rgb(0.9, 0.9, 0.9)
        });

        // 9.2 表头文字
        tableColumns.forEach((col, colIndex) => {
            const headerText = col.label || '';
            page.drawText(headerText, {
                x: pageMargin + columnWidth * colIndex + 5,
                y: currentY - tableHeaderHeight + 8,
                font: simsunFont,
                size: 10,
                color: rgb(0, 0, 0),
                maxWidth: columnWidth - 10
            });
        });
        currentY -= tableHeaderHeight;

        // 9.3 表格内容（逐行绘制，斑马纹）
        for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
            const currentRow = tableData[rowIndex];

            // 隔行添加背景（浅灰）
            if (rowIndex % 2 === 1) {
                page.drawRectangle({
                    x: pageMargin,
                    y: currentY - tableRowHeight,
                    width: tableTotalWidth,
                    height: tableRowHeight,
                    color: rgb(0.95, 0.95, 0.95)
                });
            }

            // 绘制单元格内容
            tableColumns.forEach((col, colIndex) => {
                const cellValue = currentRow[col.code] !== undefined 
                    ? String(currentRow[col.code]) 
                    : (col.label === '序号' ? String(currentRow.index) : '');
                
                page.drawText(cellValue, {
                    x: pageMargin + columnWidth * colIndex + 5,
                    y: currentY - tableRowHeight + 8,
                    font: simsunFont,
                    size: 10,
                    color: rgb(0, 0, 0),
                    maxWidth: columnWidth - 10
                });
            });

            currentY -= tableRowHeight;

            // 分页处理：剩余高度不足时新增页面
            if (currentY < pageMargin + 100) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                const newPageSize = page.getSize();
                pageWidth = newPageSize.width;
                pageHeight = newPageSize.height;
                currentY = pageHeight - pageMargin;
                console.log(`PDF分页，当前页数：${pdfDoc.getPageCount()}`);
            }
        }

        // 9.4 表格外边框
        page.drawRectangle({
            x: pageMargin,
            y: currentY,
            width: tableTotalWidth,
            height: (tableData.length * tableRowHeight + tableHeaderHeight),
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
            fillOpacity: 0
        });

        // 9.5 表格列分隔线（内边框）
        for (let colIndex = 1; colIndex < columnCount; colIndex++) {
            const lineX = pageMargin + columnWidth * colIndex;
            page.drawLine({
                start: { x: lineX, y: currentY },
                end: { x: lineX, y: currentY + (tableData.length * tableRowHeight + tableHeaderHeight) },
                thickness: 1,
                color: rgb(0, 0, 0)
            });
        }

        // 步骤10：绘制金额信息（总金额+大写金额）
        currentY -= 30;
        page.drawText(`总金额：${quote.totalPrice ? quote.totalPrice.toFixed(2) : '0.00'} 元`, {
            x: pageMargin,
            y: currentY,
            font: simsunFont,
            size: 12,
            color: rgb(0, 0, 0)
        });
        currentY -= 25;
        page.drawText(`总计（大写）：${amountChinese}`, {
            x: pageMargin,
            y: currentY,
            font: simsunFont,
            size: 12,
            color: rgb(0, 0, 0)
        });
        currentY -= 30;

        // 步骤11：绘制底部文本（备注、签字栏）
        if (footText) {
            const footLines = footText.split('\n');
            footLines.forEach(line => {
                page.drawText(line, {
                    x: pageMargin,
                    y: currentY,
                    font: simsunFont,
                    size: 10,
                    color: rgb(0, 0, 0),
                    maxWidth: pageWidth - pageMargin * 2
                });
                currentY -= 18;
            });
        }

        // 步骤12：生成PDF二进制数据并转二进制字符串
        const pdfUint8Array = await pdfDoc.save();
        const pdfBinaryStr = uint8ArrayToBinaryString(pdfUint8Array);
        console.log('PDF二进制字符串转换成功，长度：', pdfBinaryStr.length);

        // 步骤13：写入文件（指定binary编码，避免类型报错）
        const fs = wx.getFileSystemManager();
        fs.writeFileSync(filePath, pdfBinaryStr, 'binary');
        console.log(' PDF生成成功，保存路径：', filePath);

        return true;
    } catch (err) {
        console.error('PDF生成失败（完整错误）:', err);
        throw err;
    }
},

  // 生成Word文件
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
    
    // 对于PDF，先检查是否正在加载或未加载完成
    if (type === 'pdf') {
      if (this.data.pdfLoading) {
        wx.showToast({ title: '正在准备PDF，请稍等', icon: 'none' });
        return;
      }
      if (!isPdfLibLoaded) {
        wx.showToast({ title: 'PDF库正在加载，请稍后', icon: 'none' });
        return;
      }
      this.setData({ pdfLoading: true });
    }
    
    this.setData({ errorMsg: '' });
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
      })
      .finally(() => {
        // 无论成功失败，清除PDF加载状态
        if (type === 'pdf') {
          this.setData({ pdfLoading: false });
        }
      });
  },
  
// 实际执行下载
actualDownload(fileNameBase, type) {
    //添加async关键字，支持await
    return new Promise(async (resolve, reject) => {
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
            // 添加await，等待PDF生成完成
            generateSuccess = await this.generatePDFContent(filePath);
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
        wx.showModal({
          title: '提示',
          content: '文件下载成功，是否转发？',
          confirmText: '转发',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              that.shareFile();
            }
            resolve(true);
          }
        });
        setTimeout(() => cleanTempFiles(filePath), 30000); // 延长到30秒
      } catch (err) {
        console.error('下载失败', err);
        that.setData({
          loading: false,
          errorMsg: err.message || '下载文件失败'
        });
        wx.showToast({ title: err.message || '下载失败', icon: 'none' });
        reject(err);
      }
    });
  },

  // 直接转发文件
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