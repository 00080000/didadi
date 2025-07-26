Page({
    data: {
      quotation: [], // 从服务器获取的原始数据
      filterQuotation: [], // 过滤后的报价单数据
      ifShowSearch: false,
      keyword: '',
      isLoading: false, // 加载状态
      errorMsg: '', // 错误信息
      // 总条数（后端返回的total）
    total: 0,
    pageNum: 1,        // 当前页码
    pageSize: 9999,      // 每页条数
    hasMore: true,     // 是否还有更多数据
      // 原始静态数据
      staticQuotation: [
        {
          name: '报价单2024040319008882',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 0
        },
        {
          name: '报价单2024040319008883',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 1
        },
        {
          name: '报价单2024040319008884',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 1
        },
        {
          name: '报价单2024040319008885',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 0
        },
        {
          name: '报价单2024040319008882',
          quoteDate: '2024.04.13',
          time: '20:09:45',
          totalPrice: '331.58',
          status: 1
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
          if (res.statusCode === 200 && res.data.code === 200) {
            const quotation = res.data.rows || [];
            const hasMore = this.data.pageNum * this.data.pageSize < res.data.total;
            console.log('QuotationData:',quotation);
            this.setData({
                quotation: isLoadMore ? [...this.data.quotation, ...quotation] : quotation,
            // 筛选列表同步更新
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
        const index = e.currentTarget.dataset.index;
      const item = this.data.filterQuotation[index];
      wx.navigateTo({
        url: '/quotePackage/pages/addQuotation/addQuotation',
      });
    },
  
    // 复制功能
    copy(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.filterQuotation[index];
      const textToCopy = `名称: ${item.name}\n日期: ${item.date}\n时间: ${item.time}\n金额: ${item.amount}\n状态: ${item.status === 1 ? '已处理' : '未处理'}`;
      
      wx.setClipboardData({
        data: textToCopy,
        success: function () {
          wx.showToast({
            title: '复制成功',
            icon: 'none'
          });
        },
        fail: function () {
          wx.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
    },
  
    // 分享功能
    share(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.filterQuotation[index];
      
      wx.showActionSheet({
        itemList: ['系统内发送', '生成二维码', '复制链接', '发送邮件', '分享至微信'],
        success: function (res) {
          switch (res.tapIndex) {
            case 0: {
              wx.navigateTo({
                url: '/quotePackage/pages/shareWithSystem/shareWithSystem',
              });
              break;
            }
            case 1: {
              wx.navigateTo({
                url: '/quotePackage/pages/shareWithCode/shareWithCode',
              });
              break;
            }
            case 2: {
              wx.showToast({
                title: '复制成功',
                icon: 'none',
              });
              break;
            }
            case 3: {
              wx.navigateTo({
                url: `/quotePackage/pages/shareWithEmail/shareWithEmail?name=${item.name}`,
              });
              break;
            }
            case 4: {
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
      return {
        title: '报价记录分享',
        path: `/quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation?name=${this.data.filterQuotation[0]?.name || ''}`,
        imageUrl: 'https://example.com/share-image.jpg',
        extraData: {}
      };
    },
  
    // 删除确认
    confirmDelete() {
      wx.showModal({
        title: '确认',
        content: '确定要删除吗？',
        success (res) {
          if (res.confirm) {
            console.log('用户点击确定');
            // 这里添加实际删除逻辑
          } else if (res.cancel) {
            console.log('用户点击取消');
          }
        }
      });
    },
  
// 预览报价详情
goToViewRecievedQuotation(e) {
    const id = e.currentTarget.dataset.id;
    console.log('id:',id);
    wx.navigateTo({
      url: `/quotePackage/pages/viewRecievedQuotation/viewRecievedQuotation?id=${id}`
    });
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
      wx.navigateTo({
        url: '/quotePackage/pages/addQuotation/addQuotation',
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