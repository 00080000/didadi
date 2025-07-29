Page({
    data: {
      fileName: '小喇叭公司报价单（初稿）',
      projectName: '系统集成扩容二期采购项目',
      date: '2023-12-23 00:00:00', // 报价日期改为带时间的格式
      validity: '2025-07-28 17:41:13',
      description: '',
      index: 0,
      
      // 文档有效期相关
      showValidityPicker: false,
      validityDate: "2025-07-28",
      validityTime: "17:41:13",
      validityHourIndex: 17,
      validityMinuteIndex: 41,
      validitySecondIndex: 13,
      
      // 报价日期相关
      showDatePicker: false,
      quoteDate: "2023-12-23",
      quoteTime: "00:00:00",
      quoteHourIndex: 0,
      quoteMinuteIndex: 0,
      quoteSecondIndex: 0,
      
      // 通用时间选项
      hours: [],
      minutes: [],
      seconds: []
    },
  
    onLoad() {
      const app = getApp();
      const submitData = app.globalData.submitData || {};
      
      // 初始化时间选择器的时、分、秒选项
      this.initTimeOptions();
      
      // 如果有提交数据，解析并设置
      if (submitData.quote) {
        this.setData({
          fileName: submitData.quote.name || '',
          projectName: submitData.quote.projectName || '',
          date: submitData.quote.quoteDate || '2023-12-23 00:00:00',
          validity: submitData.quote.validityTime || '2025-07-28 17:41:13',
          description: submitData.quote.description || '',
        });
        
        // 解析报价日期
        const [quoteDate, quoteTime] = this.data.date.split(' ') || ['2023-12-23', '00:00:00'];
        const [qHour, qMinute, qSecond] = quoteTime.split(':') || ['0', '0', '0'];
        
        // 解析有效期
        const [validityDate, validityTime] = this.data.validity.split(' ') || ['2025-07-28', '17:41:13'];
        const [vHour, vMinute, vSecond] = validityTime.split(':') || ['17', '41', '13'];
        
        this.setData({
          // 报价日期
          quoteDate,
          quoteTime,
          quoteHourIndex: parseInt(qHour) || 0,
          quoteMinuteIndex: parseInt(qMinute) || 0,
          quoteSecondIndex: parseInt(qSecond) || 0,
          
          // 有效期
          validityDate,
          validityTime,
          validityHourIndex: parseInt(vHour) || 0,
          validityMinuteIndex: parseInt(vMinute) || 0,
          validitySecondIndex: parseInt(vSecond) || 0
        });
      }
    },
    
    // 初始化时、分、秒选项（确保范围正确）
    initTimeOptions() {
      const hours = [];
      const minutes = [];
      const seconds = [];
      
      // 生成0-23小时（确保不超过23）
      for (let i = 0; i < 24; i++) {
        hours.push(i.toString().padStart(2, '0'));
      }
      
      // 生成0-59分钟（确保不超过59）
      for (let i = 0; i < 60; i++) {
        minutes.push(i.toString().padStart(2, '0'));
      }
      
      // 生成0-59秒（确保不超过59）
      for (let i = 0; i < 60; i++) {
        seconds.push(i.toString().padStart(2, '0'));
      }
      
      this.setData({
        hours,
        minutes,
        seconds
      });
    },
  
    selectorChange(e) {
      this.setData({
        index: e.detail.value
      })
    },
  
    // 打开有效期选择器
    openValidityPicker() {
      this.setData({
        showValidityPicker: true
      });
    },
  
    // 关闭有效期选择器
    closeValidityPicker() {
      this.setData({
        showValidityPicker: false
      });
    },
    
    // 打开报价日期选择器
    openDatePicker() {
      this.setData({
        showDatePicker: true
      });
    },
  
    // 关闭报价日期选择器
    closeDatePicker() {
      this.setData({
        showDatePicker: false
      });
    },
  
    // 有效期日期选择变化
    validityDateChange(e) {
      this.setData({
        validityDate: e.detail.value,
        validity: `${e.detail.value} ${this.data.validityTime}`
      });
    },
    
    // 报价日期选择变化
    quoteDateChange(e) {
      this.setData({
        quoteDate: e.detail.value,
        date: `${e.detail.value} ${this.data.quoteTime}`
      });
    },
  
    // 有效期时间选择变化（处理滑动事件）
    validityPickerChange(e) {
      const [hourIndex, minuteIndex, secondIndex] = e.detail.value;
      // 安全检查：确保索引在有效范围内
      if (hourIndex >= 0 && hourIndex < this.data.hours.length &&
          minuteIndex >= 0 && minuteIndex < this.data.minutes.length &&
          secondIndex >= 0 && secondIndex < this.data.seconds.length) {
        this.setData({
          validityHourIndex: hourIndex,
          validityMinuteIndex: minuteIndex,
          validitySecondIndex: secondIndex
        });
      }
    },
    
    // 报价日期时间选择变化（处理滑动事件）
    quotePickerChange(e) {
      const [hourIndex, minuteIndex, secondIndex] = e.detail.value;
      // 安全检查：确保索引在有效范围内
      if (hourIndex >= 0 && hourIndex < this.data.hours.length &&
          minuteIndex >= 0 && minuteIndex < this.data.minutes.length &&
          secondIndex >= 0 && secondIndex < this.data.seconds.length) {
        this.setData({
          quoteHourIndex: hourIndex,
          quoteMinuteIndex: minuteIndex,
          quoteSecondIndex: secondIndex
        });
      }
    },
    
    // 有效期确定按钮
    confirmValidity() {
      // 双重安全检查：确保值存在且有效
      const hour = this.data.hours[this.data.validityHourIndex] || '00';
      const minute = this.data.minutes[this.data.validityMinuteIndex] || '00';
      const second = this.data.seconds[this.data.validitySecondIndex] || '00';
      const time = `${hour}:${minute}:${second}`;
      
      this.setData({
        validityTime: time,
        validity: `${this.data.validityDate} ${time}`,
        showValidityPicker: false
      });
    },
    
    // 报价日期确定按钮
    confirmQuoteDate() {
      // 双重安全检查：确保值存在且有效
      const hour = this.data.hours[this.data.quoteHourIndex] || '00';
      const minute = this.data.minutes[this.data.quoteMinuteIndex] || '00';
      const second = this.data.seconds[this.data.quoteSecondIndex] || '00';
      const time = `${hour}:${minute}:${second}`;
      
      this.setData({
        quoteTime: time,
        date: `${this.data.quoteDate} ${time}`,
        showDatePicker: false
      });
    },
  
    cancel() {
      wx.navigateBack()
    },
  
    confirm() {
      const app = getApp();
      const quote = app.globalData.submitData.quote || {};
      
      quote.name = this.data.fileName;
      quote.projectName = this.data.projectName;
      quote.quoteDate = this.data.date; // 保存带秒的完整日期
      quote.validityTime = this.data.validity; // 保存带秒的完整有效期
      quote.description = this.data.description;
      
      if (!app.globalData.submitData) {
        app.globalData.submitData = {};
      }
      app.globalData.submitData.quote = quote;
      
      wx.navigateBack()
    }
  })