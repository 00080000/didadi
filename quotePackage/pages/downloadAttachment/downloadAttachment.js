Page({
    data: {
      name: '报价单2024040319008882',
      file: [] 
    },
    onLoad() {
      const app = getApp();
      const storedQuoteData = app.globalData.quoteData;
      console.log('存储的报价单数据:', storedQuoteData);
      
      if (storedQuoteData) {
        // 更新报价单名称
        if (storedQuoteData.quote && storedQuoteData.quote.name) {
          this.setData({
            name: storedQuoteData.quote.name
          });
        }
        // 更新文件列表 - 从quoteFileList中获取
        if (storedQuoteData.quoteFileList && storedQuoteData.quoteFileList.length > 0) {
          const fileList = storedQuoteData.quoteFileList.map(file => {
            const fileType = file.fileType || file.fileName.split('.').pop() || '';
            return {
              name: file.fileName,       // 文件名
              type: fileType.toLowerCase(), // 文件类型（转为小写）
              filePath: file.filePath    // 文件路径
            };
          });
          
          this.setData({
            file: fileList
          });
        }
      }
    },
    
    downloadFile(e) {
        const { filepath, filename } = e.currentTarget.dataset;
        if (!filepath || !filename) {
          wx.showToast({
            title: '文件信息不完整',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        // 显示加载提示
        wx.showLoading({
          title: '正在下载...',
          mask: true
        });
      
        const downloadUrl = `${getApp().globalData.serverUrl}/diServer/common/download/resource?resource=${encodeURIComponent(filepath)}`;
      
        wx.downloadFile({
          url: downloadUrl, // 下载接口URL
          filePath: wx.env.USER_DATA_PATH + '/' + filename, // 本地临时文件路径
          header: {
            'Content-Type': 'application/octet-stream' // 适配文件流下载
          },
          success: (res) => {
            // 隐藏加载提示
            wx.hideLoading();
      
            // 判断下载是否成功（200为成功状态码）
            if (res.statusCode === 200) {
              // 下载成功后打开文件
              wx.openDocument({
                filePath: res.filePath,
                showMenu: true, // 允许用户转发/保存文件
                success: (openRes) => {
                  console.log('文件打开成功', openRes);
                },
                fail: (openErr) => {
                  wx.showToast({
                    title: '文件打开失败',
                    icon: 'none',
                    duration: 2000
                  });
                  console.error('打开文件错误：', openErr);
                }
              });
            } else {
              // 非200状态码视为下载失败（如系统内部异常）
              wx.showToast({
                title: '下载失败：系统内部异常',
                icon: 'none',
                duration: 2000
              });
              console.error('下载失败，状态码：', res.statusCode);
            }
          },
          fail: (err) => {
            // 隐藏加载提示
            wx.hideLoading();
            
            wx.showToast({
              title: '下载失败，请稍后重试',
              icon: 'none',
              duration: 2000
            });
            console.error('下载接口调用失败：', err);
          }
        });
      }
  })
  