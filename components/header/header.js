// components/header/header.js
Component({
  data: {},
  methods: {
    search(){
      wx.navigateTo({
        url: '/pages/search/search',
      })
    }
  }
})