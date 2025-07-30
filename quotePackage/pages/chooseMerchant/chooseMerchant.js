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

  // 获取商家列表（核心：预初始化默认联系人字段）
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
          console.log('merchants:', res.data.rows);

          // 为每个商家添加默认联系人字段（兼容写法）
          var tempMerchants = [];
          for (var i = 0; i < merchants.length; i++) {
            var merchant = merchants[i];
            var newMerchant = Object.assign({}, merchant, {
              defaultContactName: '加载中...',
              defaultContactPhone: '加载中...'
            });
            tempMerchants.push(newMerchant);
          }

          this.setData({
            merchants: tempMerchants,
            filterMerchant: tempMerchants
          });

          // 加载每个商家的联系人
          for (var j = 0; j < tempMerchants.length; j++) {
            this.fetchContactsByCompanyId(tempMerchants[j].id);
          }
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
          var { merchants } = this.data;
          var updatedMerchants = [];
          for (var i = 0; i < merchants.length; i++) {
            var merchant = merchants[i];
            if (String(merchant.id) === String(companyId)) {
              var updatedMerchant = Object.assign({}, merchant, {
                defaultContactName: defaultContact.userName || '无联系人',
                defaultContactPhone: defaultContact.tel || '无电话'
              });
              updatedMerchants.push(updatedMerchant);
            } else {
              updatedMerchants.push(merchant);
            }
          }

          // 更新联系人分组数据
          var { allContacts } = this.data;
          var isExist = false;
          for (var j = 0; j < allContacts.length; j++) {
            if (allContacts[j].companyId === String(companyId)) {
              allContacts[j].contacts = contacts;
              isExist = true;
              break;
            }
          }
          if (!isExist) {
            allContacts.push({ companyId: String(companyId), contacts: contacts });
          }

          // 刷新数据
          this.setData({
            merchants: updatedMerchants,
            filterMerchant: updatedMerchants,
            allContacts: allContacts
          });

          // 如果当前选中该商家，同步更新联系人列表
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
    var { merchants, merchantKeyword } = this.data;
    if (!merchantKeyword) {
      this.setData({ filterMerchant: merchants });
      return;
    }
    var filtered = [];
    for (var i = 0; i < merchants.length; i++) {
      if (merchants[i].companyName.indexOf(merchantKeyword) !== -1) {
        filtered.push(merchants[i]);
      }
    }
    this.setData({ filterMerchant: filtered });
  },

  // 搜索联系人
  inputContact() {
    var { allContacts, contactKeyword, selectedMerchant } = this.data;
    if (!selectedMerchant) return;

    var strCompanyId = String(selectedMerchant.id);
    var merchantContacts = [];
    for (var i = 0; i < allContacts.length; i++) {
      if (allContacts[i].companyId === strCompanyId) {
        merchantContacts = allContacts[i].contacts;
        break;
      }
    }

    if (!contactKeyword) {
      this.setData({ filterContact: merchantContacts });
      return;
    }

    var filtered = [];
    for (var j = 0; j < merchantContacts.length; j++) {
      if (merchantContacts[j].userName.indexOf(contactKeyword) !== -1) {
        filtered.push(merchantContacts[j]);
      }
    }
    this.setData({ filterContact: filtered });
  },

  // 选择商家
  chooseMerchant(e) {
    var merchantId = e.currentTarget.dataset.id;
    var { merchants } = this.data;
    var selectedMerchant = null;

    for (var i = 0; i < merchants.length; i++) {
      if (String(merchants[i].id) === String(merchantId)) {
        selectedMerchant = merchants[i];
        break;
      }
    }

    if (selectedMerchant) {
      var { allContacts } = this.data;
      var filterContact = [];
      for (var j = 0; j < allContacts.length; j++) {
        if (allContacts[j].companyId === String(merchantId)) {
          filterContact = allContacts[j].contacts;
          break;
        }
      }

      this.setData({
        selectedMerchant: selectedMerchant,
        selectedContact: null,
        filterContact: filterContact
      });
    }
  },

  // 选择联系人
  chooseContact(e) {
    var contactId = e.currentTarget.dataset.id;
    var { filterContact } = this.data;
    var selectedContact = null;

    for (var i = 0; i < filterContact.length; i++) {
      if (String(filterContact[i].id) === String(contactId)) {
        selectedContact = filterContact[i];
        break;
      }
    }

    if (selectedContact) {
      this.setData({ selectedContact: selectedContact });
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
      // 新建商家：模拟空数据事件
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


confirm() {
    var app = getApp();
    var { selectedMerchant, selectedContact } = this.data;
    var result = null;
  
    if (selectedMerchant && selectedContact) {
      // 关键修改：明确存储联系人电话字段（tel）到contactTel
      result = {
        companyId: selectedMerchant.id,
        companyName: selectedMerchant.companyName,
        contactId: selectedContact.id,
        contactName: selectedContact.userName,
        contactTel: selectedContact.tel || '', // 确保从tel字段获取电话
        contactEmail: selectedContact.email || '' // 额外添加邮箱字段（如果接口有返回）
      };
    } else if (selectedMerchant) {
      var strCompanyId = String(selectedMerchant.id);
      var { allContacts } = this.data;
      var merchantContacts = [];
      for (var i = 0; i < allContacts.length; i++) {
        if (allContacts[i].companyId === strCompanyId) {
          merchantContacts = allContacts[i].contacts;
          break;
        }
      }
      var defaultContact = merchantContacts[0] || {};
      // 关键修改：默认联系人也确保有contactTel
      result = {
        companyId: selectedMerchant.id,
        companyName: selectedMerchant.companyName,
        contactId: defaultContact.id || '',
        contactName: defaultContact.userName || '无联系人',
        contactTel: defaultContact.tel || '', // 从tel字段获取
        contactEmail: defaultContact.email || '' // 额外添加邮箱
      };
    } else if (selectedContact) {
      result = {
        companyId: selectedContact.companyId,
        companyName: selectedContact.companyName,
        contactId: selectedContact.id,
        contactName: selectedContact.userName,
        contactTel: selectedContact.tel || '', // 从tel字段获取
        contactEmail: selectedContact.email || ''
      };
    }
  
    if (result) {
      app.globalData.shareSystemSelectedData = result;
      wx.navigateBack();
    } else {
      wx.showToast({ title: '请选择商家或联系人', icon: 'none' });
    }
  }
  
});
