const { encryptId } = require('../../../utils/util');

Page({
    data: {
      quotation: [], // 从服务器获取的原始数据
      filterQuotation: [], // 过滤后的报价单数据
      ifShowSearch: false,
      keyword: '',
      isLoading: false, // 加载状态
      errorMsg: '', // 错误信息
      total: 0,       // 总条数（后端返回的total）
      pageNum: 1,     // 当前页码
      pageSize: 9999, // 每页条数
      hasMore: true,  // 是否还有更多数据
      // 原始静态数据
      staticQuotation: [
        {
          name: '报价单2024040319008882',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 0,
          id: 1001 // 补充ID字段
        },
        {
          name: '报价单2024040319008883',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 1,
          id: 1002 // 补充ID字段
        },
        {
          name: '报价单2024040319008884',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 1,
          id: 1003 // 补充ID字段
        },
        {
          name: '报价单2024040319008885',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 0,
          id: 1004 // 补充ID字段
        },
        {
          name: '报价单2024040319008882',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 1,
          id: 1005 // 补充ID字段
        }
      ]
    },
  
    onLoad() {
      this.loadQuotationData();
    },
    // 从服务器加载报价单数据
    loadQuotationData(isLoadMore = false) {
      this.setData({ isLoading: true, errorMsg: '' });
      
      wx.request({
        url: `${getApp().globalData.serverUrl}/diServer/quote/list?pageNum=${this.data.pageNum}&pageSize=${this.data.pageSize}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${getApp().globalData.token}`
        },
        success: (res) => {
            console.log('报价单:',res);
          if (res.statusCode === 200 && res.data.code === 200) {
            const quotation = res.data.rows || [];
            const hasMore = this.data.pageNum * this.data.pageSize < res.data.total;
            console.log('QuotationData:',quotation);
            this.setData({
                quotation: isLoadMore ? [...this.data.quotation, ...quotation] : quotation,
                filterQuotation: isLoadMore ? [...this.data.quotation, ...quotation] : quotation,
                total: res.data.total, 
                hasMore
            });
          } else {
            // 请求失败
            this.setData({ 
              errorMsg: res.data.message || '获取数据失败',
              quotation: this.data.staticQuotation,
              filterQuotation: this.data.staticQuotation,
            });
          }
        },
        fail: (err) => {
          // 请求失败
          this.setData({ 
            errorMsg: '网络请求失败',
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
        console.log('onPullDownRefresh');
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
            item.name.includes(this.data.keyword)
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
  
    // 编辑功能
    edit(e) {
        const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/quotePackage/pages/addQuotation/addQuotation?id=${id}`,
      });
    },
  
    // 复制功能：添加copy=true参数
    copy(e) {
        const id = e.currentTarget.dataset.id;
        const app = getApp();
        
        // 重置全局数据，但保留复制源ID用于初始化
        app.globalData.submitData = {
          quote: {},
          productGroupList: [],
          quoteFileList: [],
          selectedProducts: []
        };
        app.globalData.shareSystemSelectedData = null;
        app.globalData.isCreateNewQuote = true; // 新建模式
        app.globalData.copyFromId = id; // 记录复制源ID
        
        wx.navigateTo({
          // 添加copy=true参数标记为复制模式
          url: `/quotePackage/pages/addQuotation/addQuotation?id=${id}&copy=true`
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
              // 复制链接时也使用加密ID
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
                      duration: 3000
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
  
    // 定义分享内容 - 使用加密ID和正确的预览路径
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
          // 分享路径指向预览页面，并附带加密后的ID
          path: `/quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation?id=${encryptedId}`,
          imageUrl: 'https://example.com/share-image.jpg',
          success: () => {
            wx.showToast({
              title: '分享成功',
              icon: 'success',
              duration: 2000
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
        if(id != '')
        {
            wx.showModal({
                title: '确认',
                content: '确定要删除吗？',
                success (res) {
                    if (res.confirm) {
                      wx.request({
                          url: `${getApp().globalData.serverUrl}/diServer/quote/${id}`,
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
                              // 请求失败
                              console.log('errorMsg');
                            }
                          },
                          fail: (err) => {
                            this.setData({ 
                              errorMsg: '网络请求失败，使用默认数据',
                            });
                            console.error(err);
                          },
                        });
                    } else if (res.cancel) {
                    }
                }
            });
        }
        else{
            wx.showToast({
                title: '未知错误',
                icon: 'none',
                duration: 2000
              });
        }
    
      },
  
    // 预览报价详情
    goToViewRecievedQuotation(e) {
        const id = e.currentTarget.dataset.id;
        console.log('id:',id);
        // 预览时也使用加密ID
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
  
    goToRecievedQuotation() {
      wx.redirectTo({
        url: '/quotePackage/pages/recievedQuotationForm/recievedQuotationForm',
      });
    },
  
    goToAddQuotation() {
        const app = getApp();
        // 重置全局数据，确保新建模式的纯净性
        app.globalData.submitData = {
          quote: {},
          productGroupList: [],
          quoteFileList: [],
          selectedProducts: []
        };
        app.globalData.shareSystemSelectedData = null;
        app.globalData.isCreateNewQuote = true; // 标记为新建
        app.globalData.selectedProducts = [];
        
        wx.navigateTo({
          url: '/quotePackage/pages/addQuotation/addQuotation'
        });
      },
  
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
