Page({
  data: {
    name: '', // 询价单名称
    file: [
      { name: '询价单.doc', type: 'doc' },
      { name: '询价单.pdf', type: 'pdf' },
      { name: '询价单.xls', type: 'xls' }
    ],
    tableData: {},
    // 询价单基础信息
    inquiryInfo: {
      purchaseCompany: '', // 采购方
      supplierCompany: '', // 供应商
      contactPerson: '',   // 联系人
      quotePerson: '',     // 报价人
      phone: '',           // 联系电话
      inquiryDate: '',     // 询价日期
      validPeriod: ''      // 有效期
    },
    defaultTableData: {
      title: '询价单202507310000218533',
      header: ['序号', '商品名称', '商品编码', '单价', '数量', '备注'],
      rows: [
        ['1', '商品示例A', 'A001', '100.00', '2', ''],
        ['2', '商品示例B', 'B002', '200.00', '5', '加急'],
        ['3', '商品示例C', 'C003', '300.00', '1', '']
      ]
    }
  },

  onLoad() {
    // 获取全局局数据
    const app = getApp();
    const tableData = app.globalData.tableExportData || this.data.defaultTableData;
    const realInquiryName = tableData.title || '询价单' + new Date().getTime();
    
    // 模拟从全局数据获取询价单信息（实际项目中可从接口获取）
    const globalInquiryInfo =  tableData.inquiryInfo || {};
    
    // 更新数据
    this.setData({
      tableData,
      name: realInquiryName,
      inquiryInfo: { ...this.data.inquiryInfo, ...globalInquiryInfo },
      file: [
        { name: `${realInquiryName}.doc`, type: 'doc' },
        { name: `${realInquiryName}.pdf`, type: 'pdf' },
        { name: `${realInquiryName}.xls`, type: 'xls' }
      ]
    });
  },

  downloadFile(e) {
    const { type } = e.currentTarget.dataset;
    const { tableData, name: inquiryName, inquiryInfo } = this.data;
    const fs = wx.getFileSystemManager();

    // 数据验证
    if (!tableData.header || !tableData.rows.length) {
      wx.showToast({ title: '表格数据为空', icon: 'none' });
      return;
    }

    // 生成文件名和路径
    const timestamp = Date.now();
    const safeFileName = `${inquiryName}_${timestamp}.${type}`
      .replace(/[\/:*?"<>|]/g, '');
    const tempFilePath = `${wx.env.USER_DATA_PATH}/${safeFileName}`;
    console.log('生成文件路径:', tempFilePath);

    // 根据据不同格式式生成对应内容
    let fileContent = '';
    switch (type) {
      case 'doc':
        fileContent = this.generateDocContent(inquiryName, tableData, inquiryInfo);
        break;
      case 'xls':
        fileContent = this.generateXlsContent(inquiryName, tableData, inquiryInfo);
        break;
      case 'pdf':
        fileContent = this.generatePdfContent(inquiryName, tableData, inquiryInfo);
        break;
    }

    // 验证内容
    if (fileContent.length < 10) {
      wx.showToast({ title: '文件内容生成失败', icon: 'none' });
      return;
    }

    // 写入文件
    fs.writeFile({
      filePath: tempFilePath,
      data: fileContent,
      encoding: 'utf8',
      success: () => this.openFile(tempFilePath, type),
      fail: (err) => {
        console.error('写入文件失败:', err);
        wx.showToast({ title: '文件生成失败', icon: 'none' });
      }
    });
  },

  // 生成DOC格式内容（HTML）
  generateDocContent(inquiryName, tableData, info) {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>${inquiryName}</title>
  <style>
    body { font-family: SimSun, "宋体"; font-size: 16px; line-height: 2; }
    .title { font-size: 26px; font-weight: bold; text-align: center; margin: 40px 0; }
    .info-block { margin: 30px 0 0 20px; }
    .contact { margin: 40px 0 0 20px; }
    .table-wrap { margin: 50px 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #333; padding: 10px; text-align: center; }
    th { background-color: #f5f5f5; }
    .footer { margin: 60px 0 0 20px; }
    .empty-row { height: 30px; }
  </style>
</head>
<body>
  <!-- 标题 -->
  <div class="title">${inquiryName}</div>
  
  <!-- 基本信息 -->
  <div class="info-block">
    <p>采购方：${info.purchaseCompany || '请填写采购方名称'}</p>
    <p>供应商：${info.supplierCompany || '请填写供应商名称'}</p>
  </div>
  
  <!-- 联系信息 -->
  <div class="contact">
    <p>客户您好！我是来自${info.contactPerson || '采购方'}，任何疑问可随时与我联系，希望合作愉快！</p>
    <p>报价人：${info.quotePerson || '未指定'}&nbsp;&nbsp;&nbsp;手机：${info.phone || '未提供'}</p>
  </div>
  
  <!-- 空行分隔 -->
  <div class="empty-row"></div>
  
  <!-- 商品表格 -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>${tableData.header.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${tableData.rows.map((row, i) => `
          <tr ${i % 2 === 1 ? 'style="background-color:#f9f9f9"' : ''}>
            ${row.map(cell => `<td>${cell || ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <!-- 底部信息 -->
  <div class="footer">
    <p>询价日期：${info.inquiryDate || new Date().toLocaleDateString()}</p>
    <p>本询价有效期为：${info.validPeriod || '30天'}</p>
  </div>
</body>
</html>`;
  },

  // 生成XLS格式内容（TSV）
  generateXlsContent(inquiryName, tableData, info) {
    let content = `${inquiryName}\t\n`;
    content += `采购方：${info.purchaseCompany || '请填写采购方名称'}\t\n`;
    content += `供应商：${info.supplierCompany || '请填写供应商名称'}\t\n`;
    content += `\t\n`;
    content += `客户您好！我是来自${info.contactPerson || '采购方'}，任何疑问可随时与我联系，希望合作愉快！\t\n`;
    content += `报价人：${info.quotePerson || '未指定'}\t手机：${info.phone || '未提供'}\t\n`;
    content += `\t\n`;
    content += `${tableData.header.join('\t')}\t\n`;
    tableData.rows.forEach(row => {
      content += `${row.join('\t')}\t\n`;
    });
    content += `\t\n`;
    content += `询价日期：${info.inquiryDate || new Date().toLocaleDateString()}\t\n`;
    content += `本询价有效期为：${info.validPeriod || '30天'}\t\n`;
    return content;
  },

  // 生成PDF格式内容（文本）
  generatePdfContent(inquiryName, tableData, info) {
    let content = `=====${inquiryName}=====\n\n`;
    content += `采购方：${info.purchaseCompany || '请填写采购方名称'}\n`;
    content += `供应商：${info.supplierCompany || '请填写供应商名称'}\n\n`;
    content += `客户您好！我是来自${info.contactPerson || '采购方'}，任何疑问可随时与我联系，希望合作愉快！\n`;
    content += `报价人：${info.quotePerson || '未指定'}  |  手机：${info.phone || '未提供'}\n\n`;
    content += `------------------------------\n`;
    content += `${tableData.header.join('  |  ')}\n`;
    content += `------------------------------\n`;
    tableData.rows.forEach(row => {
      content += `${row.join('  |  ')}\n`;
    });
    content += `------------------------------\n\n`;
    content += `询价日期：${info.inquiryDate || new Date().toLocaleDateString()}\n`;
    content += `本询价有效期为：${info.validPeriod || '30天'}\n`;
    return content;
  },

  // 打开文件
  openFile(filePath, type) {
    wx.openDocument({
      filePath,
      fileType: type,
      showMenu: true,
      success: () => {
        wx.showToast({
          title: `文件已打开，可通过右上角保存`,
          icon: 'none',
          duration: 3000
        });
      },
      fail: (err) => {
        console.error('打开文件失败:', err);
        wx.showModal({
          title: '提示',
          content: `文件已生成，但可能不支持预览\n路径：${filePath}`,
          showCancel: false
        });
      }
    });
  }
});
    