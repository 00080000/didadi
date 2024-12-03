// loginPages/register/register.js
Page({
  data: {
    step:1,
    phone:null,
    code:null,
    password:null,
    passwordAgain:null
  },

  // 输入手机号后，跳转至获取验证码
  goToStep2(){
    this.setData({
      step:2,
    })
  },

  //输入验证码后，跳转至输入密码
  goToStep3(){
    this.setData({
      step:3,
    })
  }
})