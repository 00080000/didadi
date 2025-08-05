Page({
  data: {
    name: '小喇叭公司询价单（初稿）',
    project: '系统集成扩容二期采购项目',
    file: [], // 存储上传的附件列表（包含接口返回的id）
    isUploading: false,
    isDeleting: false,
    serverUrl: 'http://121.199.52.199:8080'
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
    const originalFileName = this.data.tempFileName;
    const fileType = originalFileName.split('.').pop()?.toLowerCase() || '';

    wx.uploadFile({
      url: `${this.data.serverUrl}/diServer/common/upload`,
      filePath: tempFile.path,
      name: 'file',
      header: {
        'Authorization': `Bearer ${app.globalData.token || ''}`,
        'Content-Type': 'multipart/form-data'
      },
      formData: {
        fileName: originalFileName,
        fileType: fileType,
        uid: 18,
        enterpriseId: 11
      },
      success: (res) => {
        this.setData({ isUploading: false });
        wx.hideLoading();

        try {
          const result = JSON.parse(res.data);
          if (result.code === 200) {
            // 存储接口返回的id（用于删除）
            this.setData({
              file: [
                ...this.data.file,
                {
                  id: result.id, // 关键：保存接口返回的文件id
                  name: originalFileName,
                  type: fileType,
                  size: result.fileSize,
                  filePath: result.filePath
                }
              ]
            });
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

  // 确认删除附件（调用真实删除接口）
  confirmDelete(e) {
    const index = e.currentTarget.dataset.index;
    const fileItem = this.data.file[index];
    const fileId = fileItem.id; // 获取接口返回的id

    if (this.data.isDeleting) return;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${fileItem.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.deleteFile(fileId, index); // 调用删除接口
        }
      }
    });
  },

  // 调用删除接口
  deleteFile(fileId, index) {
    this.setData({ isDeleting: true });
    wx.showLoading({ title: '删除中...' });

    const app = getApp();
    wx.request({
      url: `${this.data.serverUrl}/diServer/system/userFile/${fileId}`, // 拼接id到URL
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${app.globalData.token || ''}`,
        'accept': '*/*'
      },
      success: (res) => {
        this.setData({ isDeleting: false });
        wx.hideLoading();

        // 处理删除结果
        if (res.statusCode === 200 || res.statusCode === 204) {
          // 从本地列表移除
          const newFileList = this.data.file.filter((_, i) => i !== index);
          this.setData({ file: newFileList });
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

  // 确定并返回上一页
  confirm() {
    if (this.data.file.length === 0) {
      wx.showToast({ title: '请至少上传一个附件', icon: 'none' });
      return;
    }

    // 传递附件数据给上一页
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      prevPage.setData({
        attachment: this.data.file.map(item => ({
          name: item.name,
          path: item.filePath,
          type: item.type,
          size: item.size,
          id: item.id // 传递文件id给上一页（如需）
        }))
      });
    }

    wx.navigateBack();
  },
  cancel() {
    wx.navigateBack();
  }
});