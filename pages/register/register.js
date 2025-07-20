Page({
  data: {
    step: 1,
    phone: '',
    code: '',
    password: '',
    passwordAgain: '',
    countdown: 0,
    agreeProtocol: false
  },

  onLoad() {},

  // 输入处理
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  // 步骤1 -> 获取验证码
  goToStep2() {
    const phone = this.data.phone.trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/getSms/${phone}`,
      method: 'POST',
      success: (res) => {
        console.log('register:statusCode:',res.statusCode,' code:',res.data.code);
        if (res.statusCode === 200) {
          wx.showToast({ title: '验证码已发送', icon: 'success' });
          this.setData({ step: 2 });
          this.startCountdown();
        } else {
          wx.showToast({ title: res.data.message || '发送失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 步骤2 -> 验证码确认
  goToStep3() {
    if (!this.data.code.trim()) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }
    this.setData({ step: 3 });
  },

  // 注册
  registerUser() {
    const { phone, code, password, passwordAgain, agreeProtocol } = this.data;

    if (!agreeProtocol) {
      wx.showToast({ title: '请勾选协议', icon: 'none' });
      return;
    }

    if (!password || !passwordAgain || password !== passwordAgain) {
      wx.showToast({ title: '请确认两次密码一致', icon: 'none' });
      return;
    }

    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/register`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        username: phone,
        password: password,
        code: code
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          wx.showToast({ title: '注册成功', icon: 'success' });
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/login/login' });
          }, 1500);
        } else {
          wx.showToast({ title: res.data.message || '注册失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },

  // 协议勾选
  toggleAgree() {
    this.setData({ agreeProtocol: !this.data.agreeProtocol });
  },

  // 倒计时
  startCountdown() {
    let count = 60;
    this.setData({ countdown: count });
    const timer = setInterval(() => {
      count--;
      this.setData({ countdown: count });
      if (count <= 0) clearInterval(timer);
    }, 1000);
  }
});