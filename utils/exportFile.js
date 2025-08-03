/**
 * 表格数据导出工具类
 */
const exportFile = {
  /**
   * 转换表格数据为不同格式
   * @param {Object} data - 包含表头和数据的对象
   * @param {String} type - 导出类型：doc、pdf、xls
   * @returns {Object} 包含文件名和内容的对象
   */
  convertTableData(data, type) {
    const { header, rows, title } = data;
    const fileName = `${title || '询价单表格'}.${type}`;

    switch (type) {
      case 'doc':
        return { fileName, content: this.generateDocContent(header, rows, title) };
      case 'pdf':
        return { fileName, content: this.generatePdfContent(header, rows, title) };
      case 'xls':
        return { fileName, content: this.generateXlsContent(header, rows) };
      default:
        throw new Error('不支持的文件类型');
    }
  },

  /**
   * 生成DOC格式内容（HTML格式，可被Word识别）
   */
  generateDocContent(header, rows, title) {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background-color: #f0f0f0; }
            .title { text-align: center; font-size: 18px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="title">${title}</div>
          <table>
            <thead>
              <tr>${header.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  },

  /**
   * 生成PDF格式内容（简化的PDF标记语言）
   */
  generatePdfContent(header, rows, title) {
    // 实际项目中建议使用专业PDF库（如pdf-lib），此处为示例格式
    return `
      %PDF-1.1
      1 0 obj << /Type /Catalog /Outlines 2 0 R /Pages 3 0 R >> endobj
      2 0 obj << /Type /Outlines /Count 0 >> endobj
      3 0 obj << /Type /Pages /Kids [4 0 R] /Count 1 >> endobj
      4 0 obj << /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
      5 0 obj << /Length 1000 >> stream
        BT /F1 16 Tf 50 700 Td (${title}) Tj ET
        BT /F1 12 Tf 50 650 Td (${header.join(' | ')}) Tj ET
        ${rows.map((row, i) => `BT /F1 10 Tf 50 ${630 - i*20} Td (${row.join(' | ')}) Tj ET`).join('\n')}
      endstream endobj
      6 0 obj << /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >> endobj
      xref
      0 7
      0000000000 65535 f 
      0000000009 00000 n 
      0000000074 00000 n 
      0000000119 00000 n 
      0000000173 00000 n 
      0000000261 00000 n 
      0000000880 00000 n 
      trailer << /Size 7 /Root 1 0 R >>
      startxref
      960
      %%EOF
    `;
  },

  /**
   * 生成XLS格式内容（CSV格式，可被Excel识别）
   */
  generateXlsContent(header, rows) {
    return `${header.join(',')}\n${rows.map(row => row.join(',')).join('\n')}`;
  }
};

module.exports = exportFile;