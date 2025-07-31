Page({
  data: {
    file: {
      fileName: '',
      projectName: '',
      date: '',
      validity: '',
      description: ''
    },
    pickerValue: ['7天', '14天', '1个月', '3个月', '6个月', '1年'],
    index: 0
  },

  onLoad() {
    // 初始化当前日期
    const today = this.formatDate(new Date());
    this.setData({
      'file.date': today
    });
  },
// 添加两个方法
updateFileName(e) {
  this.setData({
    'file.fileName': e.detail.value
  });
},

updateProjectName(e) {
  this.setData({
    'file.projectName': e.detail.value
  });
},
  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  selectorChange(e) {
    const index = e.detail.value;
    this.setData({
      index,
      'file.validity': this.data.pickerValue[index]
    });
  },

  dateChange(e) {
    this.setData({
      'file.date': e.detail.value
    });
  },

  onDescriptionInput(e) {
    this.setData({
      'file.description': e.detail.value
    });
  },

  cancel() {
    wx.navigateBack();
  },

  confirm() {
    // 验证必填项
    if (!this.data.file.fileName.trim()) {
      return wx.showToast({ title: '请填写文档名称', icon: 'none' });
    }
    if (!this.data.file.projectName.trim()) {
      return wx.showToast({ title: '请填写项目名称', icon: 'none' });
    }
    if (!this.data.file.date) {
      return wx.showToast({ title: '请选择建档日期', icon: 'none' });
    }

    // 计算有效期截止日期
    const validityTime = this.calculateValidityTime(
      this.data.file.date,
      this.data.file.validity
    );

    // 获取主页面实例
    const pages = getCurrentPages();
    if (pages.length < 2) {
      return wx.showToast({ title: '数据传递失败', icon: 'none' });
    }
    const mainPage = pages[pages.length - 2];

    // 传递数据到主页面
    mainPage.setData({
      fileName: this.data.file.fileName,
      project: this.data.file.projectName,
      time: this.data.file.date,
      validityTime: validityTime,
      description: this.data.file.description
    }, () => {
      // 数据更新完成后返回
      wx.showToast({ title: '修改成功', icon: 'success', duration: 1000 });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    });
  },

  // 计算有效期截止日期
  calculateValidityTime(startDate, validity) {
    const date = new Date(startDate);
    const daysMap = {
      '7天': 7,
      '14天': 14,
      '1个月': 30,
      '3个月': 90,
      '6个月': 180,
      '1年': 365
    };
    const days = daysMap[validity] || 7;
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  }
})
    