// quotePackage/pages/shareWithCode/shareWithCode.js
import drawQrcode from 'weapp-qrcode'

Page({
  data: {
    id:'',
    quotation:[],
    forwardUrl:'https://dwedwdwrfewfewf233e',
    qrCodePath: '' // 用于保存二维码图片路径
  },
  onLoad(options){
    console.log(options.id);
    this.setData({
      id: options.id
    });
    this.loadQuotationData();
  },
  onReady() {
    // 页面渲染完成后生成二维码
    this.createQrCode();
  },
  loadQuotationData() {
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/quote/${this.data.id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const viewData = res.data.data || {};
          console.log('viewData:', viewData);
          this.setData({
            item: viewData.quote || {} 
          });
          
        } else {
          // 请求失败
          this.setData({
            errorMsg: res.data.message || '获取数据失败'
          });
        }
      },
      fail: (err) => {
        console.error(err);
      }
    });
  },
  // 生成二维码
  createQrCode() {
    const { forwardUrl } = this.data;
    console.log('forwardUrl:',forwardUrl);
    // 绘制二维码
    drawQrcode({
      width: 200, // 二维码宽度（rpx）
      height: 200, // 二维码高度（rpx）
      canvasId: 'qrCode',
      text: forwardUrl, // 二维码内容
      background: '#ffffff', // 背景色
      foreground: '#000000', // 前景色
      callback: (res) => {
        console.log('二维码生成成功', res);
        // 保存二维码图片路径
        this.canvasToTempImage();
      }
    });
  },
  // 将canvas转换为图片
  canvasToTempImage() {
    wx.canvasToTempFilePath({
      canvasId: 'qrCode',
      success: (res) => {
        this.setData({
          qrCodePath: res.tempFilePath
        });
      },
      fail: (err) => {
        console.error('canvas转换为图片失败', err);
      }
    }, this);
  },
  // 复制二维码
  copyQrCode() {
    const { qrCodePath } = this.data;
    wx.saveImageToPhotosAlbum({
      filePath: qrCodePath,
      success(res) {
        wx.showToast({
          title: '已保存到相册，可粘贴相册图片',
          icon: 'success'
        });
      },
      fail(err) {
        wx.showToast({
          title: '保存失败，请授权相册权限',
          icon: 'none'
        });
        // 如果用户拒绝过权限，可引导重新授权
        if (err.errMsg.includes('auth deny')) {
          wx.openSetting({
            success(settingRes) {
              if (settingRes.authSetting['scope.writePhotosAlbum']) {
                // 重新调用保存方法
                wx.saveImageToPhotosAlbum({
                  filePath: qrCodePath,
                  success(res) {
                    wx.showToast({
                      title: '已保存到相册',
                      icon: 'success'
                    });
                  }
                });
              }
            }
          });
        }
      }
    });
  },
  cancel(){
    wx.navigateBack()
  },
  confirm(){
    wx.navigateBack()
  }
})