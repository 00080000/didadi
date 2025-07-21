Page({
  data: {
    list: [] // 商品组内的商品列表
  },

  onLoad() {
    // 从临时存储中获取商品组内的商品列表
    const productList = wx.getStorageSync('currentGroupProducts') || [];
    this.setData({ list: productList });

    // 清理临时存储（可选，避免数据残留）
    wx.removeStorageSync('currentGroupProducts');
  }
});