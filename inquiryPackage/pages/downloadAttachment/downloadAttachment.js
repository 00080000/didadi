Page({
  data: {
    name: '报价单附件', // 默认标题
    file: [] // 附件列表（初始为空）
  },

  /**
   * 页面加载时初始化数据（与WXML数据绑定对应）
   */
  onLoad() {
    // 从全局获取数据
    const app = getApp();
    const storedQuoteData = app.globalData.quoteData || {};
    console.log('获取到的报价单数据：', storedQuoteData);

    // 更新标题（对应WXML的{{name}}）
    if (storedQuoteData.quote?.name) {
      this.setData({ name: storedQuoteData.quote.name });
    }

    // 处理附件列表（核心：确保数据格式与WXML匹配）
    if (storedQuoteData.quoteFileList && Array.isArray(storedQuoteData.quoteFileList)) {
      // 过滤有效附件（必须有文件名和路径）
      const validFiles = storedQuoteData.quoteFileList.filter(file => {
        return file.fileName && file.filePath;
      });

      // 格式化附件数据（与WXML的item.type、item.name对应）
      const fileList = validFiles.map(file => {
        // 提取文件类型（从文件名后缀获取，用于WXML图标判断）
        const fileName = file.fileName || '';
        const ext = fileName.split('.').pop()?.toLowerCase() || 'other';
        
        return {
          name: fileName,         // 对应WXML的{{item.name}}
          type: ext,             // 对应WXML的{{item.type}}（用于图标判断）
          filePath: file.filePath // 对应WXML的data-filepath（用于下载）
        };
      });

      // 更新数据，WXML自动渲染
      this.setData({ file: fileList });
    }
  },

  /**
   * 下载文件（与WXML的bind:tap="downloadFile"对应）
   */
  downloadFile(e) {
    // 获取WXML传递的参数（与data-filepath、data-filename对应）
    const { filepath, filename } = e.currentTarget.dataset;

    // 1. 基础校验（避免无效操作）
    if (!filepath || !filename) {
      wx.showToast({ title: '文件信息不完整', icon: 'none', duration: 2000 });
      return;
    }

    // 2. 显示加载提示（告知用户正在下载）
    wx.showLoading({ title: '下载中...', mask: true });

    // 3. 构建下载链接
    const app = getApp();
    const serverUrl = app.globalData.serverUrl || '';
    // 检查服务器地址是否有效
    if (!serverUrl) {
      wx.hideLoading();
      wx.showToast({ title: '服务器配置错误', icon: 'none' });
      return;
    }

    // 编码文件路径（支持中文和特殊字符）
    const encodedFilePath = encodeURIComponent(filepath);
    const downloadUrl = `${serverUrl}/diServer/common/download/resource?resource=${encodedFilePath}`;
    console.log('下载链接：', downloadUrl); // 调试用：复制到浏览器测试

    // 4. 执行下载
    wx.downloadFile({
      url: downloadUrl,
      // 自定义保存路径（避免特殊字符导致失败）
      filePath: `${wx.env.USER_DATA_PATH}/${this.sanitizeFileName(filename)}`,
      header: {
        'Authorization': `Bearer ${app.globalData.token || ''}`, // 携带登录凭证
        'Content-Type': 'application/octet-stream' // 声明文件流类型
      },
      success: (res) => {
        wx.hideLoading();

        // 下载成功（状态码200）
        if (res.statusCode === 200 && res.filePath) {
          // 打开文件并允许保存
          wx.openDocument({
            filePath: res.filePath,
            showMenu: true, // 显示保存选项
            success: () => {
              wx.showToast({ title: '文件已打开，可保存', icon: 'none', duration: 3000 });
            },
            fail: (err) => {
              wx.showToast({ title: '无法打开此文件', icon: 'none' });
              console.error('打开文件失败：', err);
            }
          });
        } else {
          // 下载失败（非200状态码）
          wx.showToast({ 
            title: `下载失败（状态码：${res.statusCode}）`, 
            icon: 'none', 
            duration: 2000 
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '下载失败，请检查网络', icon: 'none' });
        console.error('下载接口调用失败：', err);
      }
    });
  },

  /**
   * 辅助函数：净化文件名（移除特殊字符，避免保存失败）
   */
  sanitizeFileName(name) {
    // 移除小程序不支持的特殊字符（如 / : * ? 等）
    return name.replace(/[\\/:*?"<>|]/g, '_');
  }
});