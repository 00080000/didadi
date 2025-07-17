const app = getApp();

// 封装带 token 的请求
function request(options) {
  // 合并默认配置
  const defaultOptions = {
    url: '',
    method: 'GET',
    data: {},
    header: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${app.globalData.token}`
    }
  };

  // 处理相对路径
  if (!options.url.startsWith('http')) {
    options.url = app.globalData.serverUrl + options.url;
  }

  const mergedOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    wx.request({
      ...mergedOptions,
      success: (res) => {
        if (res.statusCode === 401) {
          // token 失效，清除信息并跳转登录
          app.clearAuthInfo();
          reject(new Error('未授权，请重新登录'));
          return;
        }
        resolve(res.data);
      },
      fail: (err) => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

export default request;