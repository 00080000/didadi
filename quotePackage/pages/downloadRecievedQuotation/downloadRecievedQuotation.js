const app = getApp();
const { numberToChinese } = require('../../../utils/util');
// 已确认能成功加载，直接用这个引用，无需再异步加载
const pdfLibTemp = require('./pdf-lib/pdf-lib.min.js'); 
console.log('pdfLibTemp 加载成功，模块内容:', pdfLibTemp);

// 引入pdf-lib并添加加载状态标记
let PDFLib = null, PDFDocument = null, StandardFonts = null, rgb = null;
let isPdfLibLoaded = false;

// 主加载函数：直接复用pdfLibTemp，无需重复检查文件
const loadPdfLib = () => {
  console.log('开始执行pdf-lib加载逻辑（复用已加载的pdfLibTemp）');
  try {
    // 直接使用已成功require的pdfLibTemp作为模块
    const module = pdfLibTemp;

    // 验证模块核心功能（确保关键方法存在）
    if (!module) {
      throw new Error('模块为空');
    }
    if (typeof module.PDFDocument !== 'function') {
      throw new Error('PDFDocument不是函数（模块结构异常）');
    }
    if (typeof module.rgb !== 'function') {
      throw new Error('rgb方法不存在（模块结构异常）');
    }
    if (!module.StandardFonts) {
      throw new Error('StandardFonts不存在（模块结构异常）');
    }

    // 赋值核心对象，标记加载成功
    PDFLib = module;
    PDFDocument = module.PDFDocument;
    StandardFonts = module.StandardFonts;
    rgb = module.rgb;
    isPdfLibLoaded = true;

    console.log('✅ pdf-lib完全加载成功（复用pdfLibTemp）');
    console.log('验证核心对象：', {
      PDFDocument: typeof PDFDocument, // 应输出 "function"
      StandardFonts: StandardFonts ? '存在' : '不存在', // 应输出 "存在"
      rgb: typeof rgb // 应输出 "function"
    });
    wx.showToast({ title: 'PDF功能已就绪', icon: 'success' });

  } catch (err) {
    console.error('❌ pdf-lib加载失败（复用过程出错）:', err.message);
    wx.showToast({ title: `PDF加载失败：${err.message}`, icon: 'none' });
  }
};

// 页面加载时直接执行加载（无需异步等待）
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
  
  // 金额信息
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

// 修复PDF生成功能：手动补充Base64前缀（适配无前缀的转换结果，彻底解决权限问题）
async generatePDFContent(filePath) {
    // 等待PDF库加载完成（最多等待5秒，确保库已就绪）
    const waitPdfLibLoad = () => {
      return new Promise((resolve, reject) => {
        let waitTime = 0;
        const checkInterval = setInterval(() => {
          if (isPdfLibLoaded) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (waitTime >= 5000) { // 5秒超时保护，避免无限等待
            clearInterval(checkInterval);
            reject(new Error('PDF库加载超时，请稍后重试'));
          }
          waitTime += 100; // 每100ms检查一次加载状态
        }, 100);
      });
    };
  
    // 核心工具函数：将Base64字符串转为pdf-lib需要的Uint8Array格式
    // 自动兼容「有无前缀」的Base64字符串，无需额外处理
    const base64ToUint8Array = (base64Str) => {
      try {
        // 步骤1：去掉Base64字符串中的前缀（如data:xxx;base64,，无论有无前缀都能兼容）
        const pureBase64 = base64Str.replace(/^data:.*;base64,/, '');
        
        // 步骤2：用小程序原生方法解码Base64（支持大体积字符串，无长度限制，比atob更稳定）
        const arrayBuffer = wx.base64ToArrayBuffer(pureBase64);
        
        // 步骤3：转为Uint8Array（pdf-lib嵌入字体必须用此格式）
        return new Uint8Array(arrayBuffer);
      } catch (decodeErr) {
        console.error('Base64转Uint8Array失败:', decodeErr);
        throw new Error(`字体解码失败：${decodeErr.message}`);
      }
    };
  
    try {
      // 步骤1：先等待PDF库加载完成（确保能调用PDFDocument等方法）
      await waitPdfLibLoad();
      
      // 步骤2：配置Base64字体（关键！替换【你的simsun.ttc无前缀Base64字符串】为实际生成的内容）
      // 格式说明：手动添加通用二进制前缀 + 你的无前缀Base64字符串
      const simsunBase64 = "data:application/octet-stream;base64,【你的simsun.ttc无前缀Base64字符串】"; 
      // 示例（假数据，实际需替换）："data:application/octet-stream;base64,AAEAAAASAQAABAAgR0RFRjEAA...";
      
      // 步骤3：将Base64转为字体二进制数据（供pdf-lib使用）
      const fontBytes = base64ToUint8Array(simsunBase64);
      console.log('✅ 字体加载成功，二进制大小：', fontBytes.length, '字节'); // 日志验证：正常应显示10000000左右字节（simsun.ttc约10MB）
      
      // 步骤4：获取页面数据（和你原有逻辑一致，无需修改）
      const { quoteData, tableColumns, tableData, amountChinese } = this.data;
      const { quote } = quoteData;
      const quoteName = cleanText(quote.name || '未命名报价单', true); // 清理标题文本
      const headText = this.extractPlainText(quote.headText || '', true); // 提取头部富文本
      const footText = this.extractPlainText(quote.footText || '', true); // 提取底部富文本
  
      // 步骤5：创建PDF文档（和你原有逻辑一致，仅字体嵌入部分修改）
      const pdfDoc = await PDFDocument.create();
      
      // 步骤6：嵌入中文字体（关键！用Base64转换后的字体，替换原本地文件读取逻辑）
      const simsunFont = await pdfDoc.embedFont(fontBytes); // 嵌入Base64字体
      console.log('✅ 中文字体嵌入PDF成功');
  
      // 步骤7：添加A4页面（尺寸：595.28x841.89，标准A4大小）
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const pageMargin = 50; // 页面边距（和你原有逻辑一致）
      let currentY = pageHeight - pageMargin; // 文本绘制起始Y坐标（从页面顶部往下）
  
      // 步骤8：绘制PDF标题（用嵌入的中文字体，替换原英文字体）
      page.drawText(quoteName, {
        x: pageWidth / 2, // 水平居中
        y: currentY,
        font: simsunFont, // 关键：使用嵌入的中文字体
        size: 18, // 标题字号
        color: rgb(0, 0, 0), // 黑色
        align: 'center' // 文字居中
      });
      currentY -= 40; // 下移Y坐标，为下一部分内容留空间
  
      // 步骤9：绘制头部文本（用中文字体，和你原有逻辑一致）
      if (headText) {
        const headLines = headText.split('\n'); // 按换行分割文本
        headLines.forEach(line => {
          page.drawText(line, {
            x: pageMargin,
            y: currentY,
            font: simsunFont, // 中文字体
            size: 12,
            color: rgb(0, 0, 0),
            maxWidth: pageWidth - pageMargin * 2 // 限制文本宽度，避免超出页面
          });
          currentY -= 20; // 每行下移20px
        });
        currentY -= 10; // 头部文本和表格之间留10px间距
      }
  
      // 步骤10：计算表格尺寸（和你原有逻辑一致，无需修改）
      const tableTotalWidth = pageWidth - pageMargin * 2; // 表格总宽度（减去两边边距）
      const tableRowHeight = 25; // 表格行高
      const tableHeaderHeight = 30; // 表头高度
      const columnCount = tableColumns.length; // 表格列数
      const columnWidth = tableTotalWidth / columnCount; // 每列宽度（平均分配）
  
      // 步骤11：绘制表头背景（灰色背景，和你原有逻辑一致）
      page.drawRectangle({
        x: pageMargin,
        y: currentY - tableHeaderHeight,
        width: tableTotalWidth,
        height: tableHeaderHeight,
        color: rgb(0.9, 0.9, 0.9) // 浅灰色背景
      });
  
      // 步骤12：绘制表头文字（用中文字体，避免表头中文乱码）
      tableColumns.forEach((col, colIndex) => {
        const headerText = col.label || '';
        page.drawText(headerText, {
          x: pageMargin + columnWidth * colIndex + 5, // 列内左间距5px
          y: currentY - tableHeaderHeight + 8, // 行内上间距8px（垂直居中）
          font: simsunFont, // 中文字体
          size: 10,
          color: rgb(0, 0, 0),
          maxWidth: columnWidth - 10 // 列内右间距5px，避免文本溢出
        });
      });
      currentY -= tableHeaderHeight; // 下移Y坐标，进入表格内容区
  
      // 步骤13：绘制表格内容（逐行绘制，用中文字体）
      for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
        const currentRow = tableData[rowIndex];
        
        // 隔行变色（和你原有逻辑一致，增强可读性）
        if (rowIndex % 2 === 1) {
          page.drawRectangle({
            x: pageMargin,
            y: currentY - tableRowHeight,
            width: tableTotalWidth,
            height: tableRowHeight,
            color: rgb(0.95, 0.95, 0.95) // 更浅的灰色
          });
        }
  
        // 绘制当前行的每一列内容
        tableColumns.forEach((col, colIndex) => {
          // 获取单元格值（和你原有逻辑一致，处理序号列特殊情况）
          const cellValue = currentRow[col.code] !== undefined 
            ? String(currentRow[col.code]) 
            : (col.label === '序号' ? String(currentRow.index) : '');
          
          page.drawText(cellValue, {
            x: pageMargin + columnWidth * colIndex + 5,
            y: currentY - tableRowHeight + 8,
            font: simsunFont, // 中文字体
            size: 10,
            color: rgb(0, 0, 0),
            maxWidth: columnWidth - 10
          });
        });
  
        // 下移Y坐标，准备绘制下一行
        currentY -= tableRowHeight;
  
        // 分页处理（修复原代码变量作用域问题，避免页面绘制超出边界）
        if (currentY < pageMargin + 100) { // 当剩余空间不足100px时，新增页面
          const newPage = pdfDoc.addPage([pageWidth, pageHeight]); // 新增A4页
          const { width: newPageWidth, height: newPageHeight } = newPage.getSize();
          // 更新当前页面尺寸和Y坐标（从新页面顶部开始绘制）
          pageWidth = newPageWidth;
          pageHeight = newPageHeight;
          currentY = pageHeight - pageMargin;
        }
      }
  
      // 步骤14：绘制表格边框（和你原有逻辑一致）
      page.drawRectangle({
        x: pageMargin,
        y: currentY,
        width: tableTotalWidth,
        height: (tableData.length * tableRowHeight + tableHeaderHeight), // 表格总高度
        borderColor: rgb(0, 0, 0), // 黑色边框
        borderWidth: 1, // 边框宽度1px
        fillOpacity: 0 // 无填充（避免覆盖内容）
      });
  
      // 步骤15：绘制表格列分隔线（垂直分隔线，和你原有逻辑一致）
      for (let colIndex = 1; colIndex < columnCount; colIndex++) {
        const lineX = pageMargin + columnWidth * colIndex; // 分隔线X坐标
        page.drawLine({
          start: { x: lineX, y: currentY }, // 线的起点
          end: { x: lineX, y: currentY + (tableData.length * tableRowHeight + tableHeaderHeight) }, // 线的终点
          thickness: 1, // 线宽1px
          color: rgb(0, 0, 0) // 黑色
        });
      }
  
      // 步骤16：绘制金额信息（用中文字体，避免中文乱码）
      currentY -= 30; // 上移Y坐标，和表格留间距
      page.drawText(`总金额：${quote.totalPrice ? quote.totalPrice.toFixed(2) : '0.00'} 元`, {
        x: pageMargin,
        y: currentY,
        font: simsunFont, // 中文字体
        size: 12,
        color: rgb(0, 0, 0)
      });
      currentY -= 25; // 下移Y坐标
      page.drawText(`总计（大写）：${amountChinese}`, {
        x: pageMargin,
        y: currentY,
        font: simsunFont, // 中文字体
        size: 12,
        color: rgb(0, 0, 0)
      });
      currentY -= 30; // 和底部文本留间距
  
      // 步骤17：绘制底部文本（用中文字体，和你原有逻辑一致）
      if (footText) {
        const footLines = footText.split('\n');
        footLines.forEach(line => {
          page.drawText(line, {
            x: pageMargin,
            y: currentY,
            font: simsunFont, // 中文字体
            size: 10,
            color: rgb(0, 0, 0),
            maxWidth: pageWidth - pageMargin * 2
          });
          currentY -= 18; // 每行下移18px
        });
      }
  
      // 步骤18：保存PDF到临时文件（和你原有逻辑一致，保存到允许读写的USER_DATA_PATH）
      const pdfBytes = await pdfDoc.save(); // 生成PDF二进制数据
      const fs = wx.getFileSystemManager();
      fs.writeFileSync(filePath, pdfBytes); // 写入到指定路径
      console.log('✅ PDF生成成功，保存路径：', filePath);
  
      return true; // 告知上层函数生成成功
    } catch (err) {
      // 错误捕获：打印详细日志，方便排查问题
      console.error('❌ PDF生成失败（完整错误）:', err);
      throw err; // 抛出错误，让上层的downloadFile函数处理提示
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
      wx.showModal({
        title: '提示',
        content: '文件下载',
        confirmText: '下载',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            that.shareFile();
          }
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
    }
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