const { encryptId } = require('../../../utils/util');

Page({
  data: {
    quotation: [], // 从服务器获取的原始数据
    filterQuotation: [], // 过滤后的报价单数据
    staticQuotation: [
      {
        name: '报价单2024040319008882',
        quoteDate: '2024.04.13',
        time: '20:09:45',
        totalPrice: '331.58',
        isExpired: false,
        id: 1001,
        companyName: '供应商A'
      },
      {
        name: '报价单2024040319008883',
        quoteDate: '2024.04.13',
        time: '20:09:45',
        totalPrice: '331.58',
        isExpired: true,
        id: 1002,
        companyName: '供应商B'
      },
      {
        name: '报价单2024040319008884',
        quoteDate: '2024.04.13',
        time: '20:09:45',
        totalPrice: '331.58',
        isExpired: false,
        id: 1003,
        companyName: '供应商C'
      }
    ],
    ifShowSearch: false,
    keyword: '',
    isLoading: false, // 加载状态
    errorMsg: '', // 错误信息
    pageNum: 1,     // 固定页码
    pageSize: 9999, // 固定一页显示全部数据
  },

  onLoad() {
    this.loadQuotationData();
  },

  // 从服务器加载报价单数据
  loadQuotationData() {
    this.setData({ isLoading: true, errorMsg: '' });
    
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/quote/outQuote/list?pageNum=${this.data.pageNum}&pageSize=${this.data.pageSize}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getApp().globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          let quotation = res.data.rows || [];
          // 处理过期状态
          quotation = quotation.map(item => {
            // 计算是否过期
            const isExpired = item.validityTime && new Date(item.validityTime) < new Date();
            return {
              ...item,
              isExpired,
              // 格式化日期显示
              quoteDate: item.quoteDate ? item.quoteDate.split(' ')[0] : '',
              time: item.quoteDate ? item.quoteDate.split(' ')[1] : ''
            };
          });
          
          this.setData({
            quotation,
            filterQuotation: quotation
          });
        } else {
          // 请求失败，使用本地静态数据
          this.setData({ 
            errorMsg: res.data.message || '获取数据失败，使用本地数据',
            quotation: this.data.staticQuotation,
            filterQuotation: this.data.staticQuotation
          });
        }
      },
      fail: (err) => {
        // 请求失败，使用本地静态数据
        this.setData({ 
          errorMsg: '网络请求失败，使用本地数据',
          quotation: this.data.staticQuotation,
          filterQuotation: this.data.staticQuotation
        });
        console.error(err);
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadQuotationData();
    wx.stopPullDownRefresh();
  },

  // 搜索功能
  inputQuotation() {
    if (this.data.keyword === '') {
      this.setData({ filterQuotation: this.data.quotation });
    } else {
      this.setData({
        filterQuotation: this.data.quotation.filter(item => 
          (item.name && item.name.includes(this.data.keyword)) ||
          (item.quoteNo && item.quoteNo.includes(this.data.keyword)) ||
          (item.companyName && item.companyName.includes(this.data.keyword))
        )
      });
    }
  },

  // 显示/隐藏搜索框
  showSearch() {
    this.setData({
      ifShowSearch: !this.data.ifShowSearch,
      filterQuotation: this.data.quotation,
      keyword: ''
    });
  },

  // 编辑功能（禁用状态，仅保留方法）
  edit(e) {
    wx.showToast({
      title: '收到的报价单不允许编辑',
      icon: 'none'
    });
  },

  // 复制功能（禁用状态，仅保留方法）
  copy(e) {
    wx.showToast({
      title: '收到的报价单不允许复制',
      icon: 'none'
    });
  },

  // 分享功能
  share(e) {
    const id = e.currentTarget.dataset.id;
    // 获取当前报价单信息用于分享
    const currentQuote = this.data.quotation.find(item => item.id === id) || {};
    
    wx.showActionSheet({
      itemList: ['系统内发送', '生成二维码', '复制链接', '发送邮件', '分享至微信'],
      success: function (res) {
        switch (res.tapIndex) {
          case 0: {
            wx.navigateTo({
              url: `/quotePackage/pages/shareWithSystem/shareWithSystem?id=${id}`,
            });
            break;
          }
          case 1: {
            wx.navigateTo({
              url: `/quotePackage/pages/shareWithCode/shareWithCode?id=${id}`,
            });
            break;
          }
          case 2: {
            // 复制链接时使用加密ID
            try {
              const encryptedId = encryptId(id);
              const shareUrl = `${getApp().globalData.webUrl}/#/preview?i=${encryptedId}`;
              wx.setClipboardData({
                data: shareUrl,
                success: () => {
                  wx.showToast({
                    title: '链接复制成功',
                    icon: 'none',
                  });
                }
              });
            } catch (err) {
              wx.showToast({
                title: '复制失败，请重试',
                icon: 'none',
              });
              console.error('复制链接失败:', err);
            }
            break;
          }
          case 3: {
            wx.navigateTo({
              url: `/quotePackage/pages/shareWithEmail/shareWithEmail?id=${id}`,
            });
            break;
          }
          case 4: {
            // 分享至微信，先加密ID
            try {
              const encryptedId = encryptId(id);
              // 设置当前要分享的报价单ID
              getApp().globalData.shareQuoteId = id;
              
              wx.updateShareMenu({
                withShareTicket: true,
                success: () => {
                  wx.showToast({
                    title: '请点击右上角“···”分享到微信',
                    icon: 'none',
                    duration: 1500
                  });
                },
                fail: (err) => {
                  wx.showToast({
                    title: err.errMsg + '，请稍后重试',
                    icon: 'none'
                  });
                }
              });
            } catch (err) {
              wx.showToast({
                title: '分享准备失败，请重试',
                icon: 'none',
              });
              console.error('分享准备失败:', err);
            }
            break;
          }
        }
      },
      fail: function (err) {
        wx.showToast({
          title: err.errMsg + '，请稍后重试',
          icon: 'none',
        });
      }
    });
  },

  // 定义分享内容
  onShareAppMessage() {
    // 获取当前要分享的报价单ID
    const shareQuoteId = getApp().globalData.shareQuoteId;
    if (!shareQuoteId) {
      // 如果没有指定ID，使用第一个报价单
      const firstQuote = this.data.filterQuotation[0];
      if (firstQuote && firstQuote.id) {
        getApp().globalData.shareQuoteId = firstQuote.id;
      } else {
        return {
          title: '报价单分享',
          path: '/quotePackage/pages/recievedQuotationForm/recievedQuotationForm',
          imageUrl: 'https://example.com/share-image.jpg'
        };
      }
    }
    
    try {
      // 加密ID
      const encryptedId = encryptId(getApp().globalData.shareQuoteId);
      // 获取报价单名称作为分享标题
      const quote = this.data.quotation.find(item => item.id === getApp().globalData.shareQuoteId) || {};
      
      return {
        title: `${quote.name || '报价单'}`,
        path: `/quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation?id=${encryptedId}`,
        imageUrl: 'https://example.com/share-image.jpg',
        success: () => {
          wx.showToast({
            title: '分享成功',
            icon: 'success',
            duration: 1000
          });
        },
        fail: (err) => {
          console.error('分享失败:', err);
        }
      };
    } catch (err) {
      console.error('生成分享内容失败:', err);
      return {
        title: '报价单分享',
        path: '/quotePackage/pages/recievedQuotationForm/recievedQuotationForm',
        imageUrl: 'https://example.com/share-image.jpg'
      };
    }
  },

  // 删除确认
  confirmDelete(e){
    const id = e.currentTarget.dataset.id;
    console.log('id:',id)
    if(id != '') {
      wx.showModal({
        title: '确认',
        content: '确定要删除吗？',
        success (res) {
          if (res.confirm) {
            wx.request({
              url: `${getApp().globalData.serverUrl}/diServer/quote/outQuote/${id}`,
              method: 'DELETE',
              header: {
                'Authorization': `Bearer ${getApp().globalData.token}`
              },
              success: (res) => {
                console.log(res);
                if (res.statusCode === 200 && res.data.code === 200) {
                  // 刷新当前页面数据
                  setTimeout(() => {
                    const currentPage = getCurrentPages()[getCurrentPages().length - 1];
                    currentPage.onLoad();
                  }, 500);
                } else {
                  wx.showToast({
                    title: res.data.message || '删除失败',
                    icon: 'none'
                  });
                }
              },
              fail: (err) => {
                wx.showToast({
                  title: '网络请求失败',
                  icon: 'none'
                });
                console.error(err);
              },
            });
          }
        }
      });
    } else {
      wx.showToast({
        title: '未知错误',
        icon: 'none',
        duration: 1500
      });
    }
  },

  // 预览报价详情
  goToViewRecievedQuotation(e) {
    const id = e.currentTarget.dataset.id;
    console.log('id:', id);
    // 预览时使用加密ID
    try {
      const encryptedId = encryptId(id);
      wx.navigateTo({
        url: `/quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation?id=${encryptedId}`
      });
    } catch (err) {
      console.error('加密ID失败:', err);
      wx.showToast({
        title: '预览失败，请重试',
        icon: 'none'
      });
    }
  },

  // 导航相关方法
  goToInquiry() {
    wx.redirectTo({
      url: '/inquiryPackage/pages/sendedInquiryForm/sendedInquiryForm',
    });
  },

  goToSendedQuotation() {
    wx.redirectTo({
      url: '/quotePackage/pages/sendedQuotationForm/sendedQuotationForm',
    });
  },

  // 隐藏新建报价单方法，收到的报价单不允许新建
  
  navigateToMain() {
    wx.redirectTo({
      url: '/mainPackage/pages/home/home',
    });
  },

  navigateToMerchant() {
    wx.redirectTo({
      url: '/merchantPackage/pages/merchants/merchants',
    });
  },

  navigateToProduct() {
    wx.redirectTo({
      url: '/productPackage/pages/singleProduct/singleProduct',
    });
  }
});
    