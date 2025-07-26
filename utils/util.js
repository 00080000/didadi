// utils/util.js

// 时间格式化函数
const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
  
    return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
  }
  
  // 辅助函数：数字补零
  const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : `0${n}`
  }
  
  // 金额转大写函数（新增）
  const numberToChinese = num => {
    // 处理数字格式（保留两位小数）
    num = parseFloat(num).toFixed(2)
    if (isNaN(num)) return '零元整'
  
    const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
    const unit = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿', '拾', '佰', '仟']
    const decUnit = ['角', '分']
    let [integer, decimal] = num.split('.') // 分离整数和小数部分
  
    let res = ''
  
    // 处理整数部分
    if (parseInt(integer, 10) > 0) {
      for (let i = 0; i < integer.length; i++) {
        const idx = integer.length - i - 1 // 单位索引
        const numDigit = integer[i]
        if (numDigit !== '0') {
          res += digit[numDigit] + unit[idx]
        } else {
          // 处理连续零的情况
          if (i < integer.length - 1 && integer[i + 1] !== '0') {
            res += digit[numDigit]
          }
        }
      }
      res += '元'
    } else {
      res += '零元'
    }
  
    // 处理小数部分
    if (decimal === '00') {
      res += '整'
    } else {
      if (decimal[0] !== '0') {
        res += digit[decimal[0]] + decUnit[0]
      }
      if (decimal[1] !== '0') {
        res += digit[decimal[1]] + decUnit[1]
      }
    }
  
    return res
  }
  
  // 导出所有工具函数
  module.exports = {
    formatTime,
    numberToChinese  // 新增导出金额转大写函数
  }