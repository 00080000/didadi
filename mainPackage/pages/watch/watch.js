Page({
    data: {
      url: 'https://121.199.52.199/#/preview?'
    },
    onLoad(options) {
      // 接收传递过来的网页链接
      const fullUrl = this.data.baseUrl + (options.i || '');
      this.setData({
        url: fullUrl
      });
    }
  });