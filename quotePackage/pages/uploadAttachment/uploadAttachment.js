Page({
    data: {
      name: '小喇叭公司报价单（初稿）',
      project: '系统集成扩容二期采购项目',
      item: {},
      file: [
        {
          name: '公司介绍2024年最新版.doc',
          type: 'doc',
          id: '', // 用于存储接口返回的文件ID
          filePath: '' // 用于存储接口返回的文件路径
        },
        {
          name: '公司产品介绍2024年最新版.pdf',
          type: 'pdf',
          id: '',
          filePath: ''
        },
        {
          name: '公司介绍2024年最新版.xls',
          type: 'xls',
          id: '',
          filePath: ''
        }
      ],
      isUploading: false,
      isDeleting: false,
      tempFileName: ''
    },
  
    onLoad() {
      const app = getApp();
      const globalQuote = app.globalData.submitData.quote || {};
      this.setData({
        name: globalQuote.name,
        project: globalQuote.projectName
      });
      const quoteFileList = app.globalData.submitData.quoteFileList;
      const fileList = quoteFileList.map(file => {
        const fileType = file.fileType || file.fileName.split('.').pop() || '';
        return {
          fileName: file.fileName,
          type: fileType.toLowerCase(),
          id: file.id || '', // 保留接口返回的ID
          filePath: file.filePath || '' // 保留接口返回的路径
        };
      });
      this.setData({
        file: fileList
      });
      console.log(this.data.file);
    },
  
    // 选择文件并上传
    goToEditFileInformation() {
      if (this.data.isUploading) return;
  
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        success: (res) => {
          const tempFile = res.tempFiles[0];
          this.setData({
            tempFileName: tempFile.name
          }, () => {
            this.uploadToServer(tempFile);
          });
        },
        fail: (err) => {
          console.error('选择文件失败:', err);
          wx.showToast({ title: '选择文件失败', icon: 'none' });
        }
      });
    },
  
    // 上传文件到服务器
    uploadToServer(tempFile) {
      this.setData({ isUploading: true });
      wx.showLoading({ title: '上传中...' });
  
      const app = getApp();
      const serverUrl = app.globalData.serverUrl;
      const originalFileName = this.data.tempFileName;
      const fileType = originalFileName.split('.').pop()?.toLowerCase() || '';
  
      wx.uploadFile({
        url: `${serverUrl}/diServer/common/upload`,
        filePath: tempFile.path,
        name: 'file',
        header: {
          'Authorization': `Bearer ${app.globalData.token || ''}`,
          'Content-Type': 'multipart/form-data'
        },
        formData: {
          fileName: originalFileName,
          fileType: fileType,
          uid: app.globalData.userInfo?.userId || '',
          enterpriseId: app.globalData.userInfo?.enterpriseId || ''
        },
        success: (res) => {
          this.setData({ isUploading: false });
          wx.hideLoading();
  
          try {
            const result = JSON.parse(res.data);
            if (result.code === 200) {
              // 更新本地文件列表
              const newFileItem = {
                id: result.id, // 保存接口返回的文件id
                fileName: originalFileName,
                type: fileType,
                size: result.fileSize,
                filePath: result.filePath
              };
              
              const updatedFileList = [...this.data.file, newFileItem];
              this.setData({
                file: updatedFileList
              });
  
              // 更新全局数据
              const app = getApp();
              app.globalData.submitData.quoteFileList = updatedFileList;
  
              wx.showToast({ title: '上传成功', icon: 'success' });
            } else {
              wx.showToast({ title: result.msg || '上传失败', icon: 'none' });
            }
          } catch (e) {
            console.error('解析结果失败:', e);
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        },
        fail: (err) => {
          this.setData({ isUploading: false });
          wx.hideLoading();
          console.error('上传失败:', err);
          wx.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
  
    // 确认删除附件
    confirmDelete(e) {
      const index = e.currentTarget.dataset.index;
      const fileItem = this.data.file[index];
      const fileId = fileItem.id;
  
      if (this.data.isDeleting) return;
  
      wx.showModal({
        title: '确认删除',
        content: `确定要删除"${fileItem.fileName}"吗？`,
        success: (res) => {
          if (res.confirm) {
            this.deleteFile(fileId, index);
          }
        }
      });
    },
  
    // 调用删除接口
    deleteFile(fileId, index) {
      this.setData({ isDeleting: true });
      wx.showLoading({ title: '删除中...' });
  
      const app = getApp();
      const serverUrl = app.globalData.serverUrl;
  
      wx.request({
        url: `${serverUrl}/diServer/system/userFile/${fileId}`,
        method: 'DELETE',
        header: {
          'Authorization': `Bearer ${app.globalData.token || ''}`,
          'accept': '*/*'
        },
        success: (res) => {
          this.setData({ isDeleting: false });
          wx.hideLoading();
  
          if (res.statusCode === 200 || res.statusCode === 204) {
            // 更新本地文件列表
            const newFileList = this.data.file.filter((_, i) => i !== index);
            this.setData({ file: newFileList });
  
            // 更新全局数据
            app.globalData.submitData.quoteFileList = newFileList;
  
            wx.showToast({ title: '删除成功', icon: 'none' });
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        },
        fail: (err) => {
          this.setData({ isDeleting: false });
          wx.hideLoading();
          console.error('删除接口调用失败:', err);
          wx.showToast({ title: '网络错误，删除失败', icon: 'none' });
        }
      });
    },
  
    // 返回上一页并更新数据
    navigateBack() {
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        // 通知上一页更新附件数据
        prevPage.onShow();
      }
      wx.navigateBack();
    }
  })