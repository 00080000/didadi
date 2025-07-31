Page({
  data: {
    merchants: [], // 商家列表（含默认联系人字段）
    allContacts: [], // 所有联系人（按商家ID分组）
    filterMerchant: [], // 筛选后的商家
    filterContact: [], // 筛选后的联系人
    index: 1, // 1:商家库 2:联系人库
    merchantKeyword: '', // 商家搜索关键词
    contactKeyword: '', // 联系人搜索关键词
    selectedMerchant: null, // 选中的商家
    selectedContact: null, // 选中的联系人
    quoteId: '' // 报价单ID
  },

  onLoad(options) {
    this.setData({ quoteId: options.quoteId || '' });
    this.fetchMerchants();
  },

  // 获取商家列表（预初始化默认联系人字段）
  fetchMerchants() {
    wx.showLoading({ title: '加载商家...' });
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/company/list?pageNum=1&pageSize=100`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${getApp().globalData.token}` },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.code === 200) {
          let merchants = res.data.rows || [];

          // 为每个商家添加默认联系人字段
          const tempMerchants = merchants.map(merchant => ({
            ...merchant,
            defaultContactName: '加载中...',
            defaultContactPhone: '加载中...'
          }));

          this.setData({
            merchants: tempMerchants,
            filterMerchant: tempMerchants
          });

          // 加载每个商家的联系人
          tempMerchants.forEach(merchant => {
            this.fetchContactsByCompanyId(merchant.id);
          });
        } else {
          wx.showToast({ title: '加载商家失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('加载商家失败：', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 加载商家的联系人并更新默认信息
  fetchContactsByCompanyId(companyId) {
    wx.request({
      url: `${getApp().globalData.serverUrl}/diServer/companyLinkman/list?companyId=${companyId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${getApp().globalData.token}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const contacts = res.data.rows || [];
          const defaultContact = contacts[0] || {};

          // 更新商家列表中的默认联系人信息
          const updatedMerchants = this.data.merchants.map(merchant => {
            if (String(merchant.id) === String(companyId)) {
              return {
                ...merchant,
                defaultContactName: defaultContact.userName || '无联系人',
                defaultContactPhone: defaultContact.tel || '无电话'
              };
            }
            return merchant;
          });

          // 更新联系人分组数据
          let { allContacts } = this.data;
          const existingIndex = allContacts.findIndex(item => item.companyId === String(companyId));
          if (existingIndex > -1) {
            allContacts[existingIndex].contacts = contacts;
          } else {
            allContacts.push({ companyId: String(companyId), contacts: contacts });
          }

          // 刷新数据
          this.setData({
            merchants: updatedMerchants,
            filterMerchant: updatedMerchants,
            allContacts
          });

          // 同步更新选中商家的联系人列表
          if (this.data.selectedMerchant && String(this.data.selectedMerchant.id) === String(companyId)) {
            this.setData({ filterContact: contacts });
          }
        }
      }
    });
  },

  // 切换到商家库
  switchToMerchant() {
    this.setData({ index: 1 });
  },

  // 切换到联系人库
  switchToContact() {
    this.setData({ index: 2 });
  },

  // 搜索商家
  inputMerchant() {
    const { merchants, merchantKeyword } = this.data;
    if (!merchantKeyword) {
      this.setData({ filterMerchant: merchants });
      return;
    }
    const filtered = merchants.filter(merchant => 
      merchant.companyName.includes(merchantKeyword)
    );
    this.setData({ filterMerchant: filtered });
  },

  // 搜索联系人
  inputContact() {
    const { allContacts, contactKeyword, selectedMerchant } = this.data;
    if (!selectedMerchant) return;

    const strCompanyId = String(selectedMerchant.id);
    const merchantContacts = allContacts.find(item => item.companyId === strCompanyId)?.contacts || [];

    if (!contactKeyword) {
      this.setData({ filterContact: merchantContacts });
      return;
    }

    const filtered = merchantContacts.filter(contact => 
      contact.userName.includes(contactKeyword)
    );
    this.setData({ filterContact: filtered });
  },

  // 选择商家
  chooseMerchant(e) {
    const merchantId = e.currentTarget.dataset.id;
    const selectedMerchant = this.data.merchants.find(merchant => 
      String(merchant.id) === String(merchantId)
    );

    if (selectedMerchant) {
      const filterContact = this.data.allContacts.find(item => 
        item.companyId === String(merchantId)
      )?.contacts || [];

      this.setData({
        selectedMerchant,
        selectedContact: null,
        filterContact
      });
    }
  },

  // 选择联系人
  chooseContact(e) {
    const contactId = e.currentTarget.dataset.id;
    const selectedContact = this.data.filterContact.find(contact => 
      String(contact.id) === String(contactId)
    );

    if (selectedContact) {
      this.setData({ selectedContact });
    }
  },

  // 取消选择
  cancelChoice() {
    this.setData({
      selectedMerchant: null,
      selectedContact: null,
      filterContact: []
    });
  },

  // 跳转到编辑商家页面
  goToEditMerchant(e) {
    const item = e.currentTarget.dataset.item || {};
    wx.navigateTo({
      url: `/merchantPackage/pages/editInformation/editInformation`,
      events: {},
      success: function(res) {
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: item })
      }
    })
  },

  // 新建按钮
  addNew() {
    if (this.data.index === 1) {
      // 新建商家
      this.goToEditMerchant({ currentTarget: { dataset: { item: {} } } });
    } else {
      // 新建联系人（需先选商家）
      if (this.data.selectedMerchant) {
        wx.navigateTo({
          url: `/merchantPackage/pages/addContact/addContact?companyId=${this.data.selectedMerchant.id}`
        });
      } else {
        wx.showToast({ title: '请先选择商家', icon: 'none' });
      }
    }
  },

  // 取消
  cancel() {
    wx.navigateBack();
  },

  // 确认选择（核心修改：适配主页面数据格式）
  confirm() {
    const { selectedMerchant, selectedContact } = this.data;
    let result = null;

    if (selectedMerchant && selectedContact) {
      // 选中商家和联系人：格式与主页面merchant对象匹配
      result = {
        firm: selectedMerchant.companyName, // 对应主页面的merchant.firm
        firmId: selectedMerchant.id, // 对应主页面的merchant.firmId
        name: selectedContact.userName, // 对应主页面的merchant.name
        phone: selectedContact.tel || '', // 对应主页面的merchant.phone
        email: selectedContact.email || '' // 对应主页面的merchant.email
      };
    } else if (selectedMerchant) {
      // 仅选中商家：使用默认联系人
      const strCompanyId = String(selectedMerchant.id);
      const merchantContacts = this.data.allContacts.find(item => 
        item.companyId === strCompanyId
      )?.contacts || [];
      const defaultContact = merchantContacts[0] || {};

      result = {
        firm: selectedMerchant.companyName,
        firmId: selectedMerchant.id,
        name: defaultContact.userName || '无联系人',
        phone: defaultContact.tel || '',
        email: defaultContact.email || ''
      };
    } else if (selectedContact) {
      // 仅选中联系人：反推商家信息
      result = {
        firm: selectedContact.companyName,
        firmId: selectedContact.companyId,
        name: selectedContact.userName,
        phone: selectedContact.tel || '',
        email: selectedContact.email || ''
      };
    }

    if (result) {
      // 关键：获取主页面实例，直接更新主页面的merchant数据
      const pages = getCurrentPages();
      const mainPage = pages[pages.length - 2]; // 主页面是上一页
      if (mainPage) {
        mainPage.setData({
          merchant: result // 直接赋值给主页面的merchant对象
        }, () => {
          wx.showToast({ title: '选择成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack(); // 返回主页面
          }, 500);
        });
      } else {
        wx.showToast({ title: '数据更新失败', icon: 'none' });
      }
    } else {
      wx.showToast({ title: '请选择商家或联系人', icon: 'none' });
    }
  }
});