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
  
  // 金额转大写函数
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

  // 加密密钥（增加长度以提高安全性）
  const ENCRYPT_KEY = 'QuoteShare2023Key';
  
  /**
   * 加密ID（支持1-99999范围的整数）
   * @param {number} id - 需要加密的数字ID
   * @returns {string} 加密后的字符串
   */
  const encryptId = (id) => {
    // 确保ID是有效范围内的整数
    if (typeof id !== 'number' || id < 1 || id > 99999 || !Number.isInteger(id)) {
      throw new Error('请传入1-99999之间的有效整数ID');
    }
    
    // 将ID转换为5位字符串（不足5位前面补零），统一长度
    let idStr = id.toString().padStart(5, '0');
    let result = [];
    
    // 使用异或运算加密每个字符
    for (let i = 0; i < idStr.length; i++) {
      // 循环使用密钥的每个字符
      const keyChar = ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length);
      // 异或运算并转换为16进制
      const encrypted = (idStr.charCodeAt(i) ^ keyChar).toString(16);
      // 确保每个加密后的字符是两位
      result.push(encrypted.padStart(2, '0'));
    }
    
    // 添加6位随机字符串混淆，增加破解难度
    const randomStr = Math.random().toString(36).substr(2, 6);
    return result.join('') + randomStr;
  };
  
  /**
   * 解密ID
   * @param {string} encryptedStr - 加密后的字符串
   * @returns {number} 解密后的ID
   */
  const decryptId = (encryptedStr) => {
    if (typeof encryptedStr !== 'string' || encryptedStr.length !== 16) {
      throw new Error('请传入有效的加密字符串');
    }
    
    // 移除随机混淆字符串（最后6位）
    const encryptedPart = encryptedStr.slice(0, -6);
    let result = [];
    
    // 每两位16进制字符为一组进行解密
    for (let i = 0; i < encryptedPart.length; i += 2) {
      const hexStr = encryptedPart.substr(i, 2);
      // 转换16进制为10进制
      const encryptedCode = parseInt(hexStr, 16);
      // 使用异或运算解密
      const keyChar = ENCRYPT_KEY.charCodeAt((i/2) % ENCRYPT_KEY.length);
      const decryptedCode = encryptedCode ^ keyChar;
      // 转换为字符
      result.push(String.fromCharCode(decryptedCode));
    }
    
    // 转换为数字并返回（自动去除前面的补零）
    return parseInt(result.join(''), 10);
  };
  
  // 导出所有工具函数
  module.exports = {
    formatTime,
    numberToChinese,
    encryptId,   // ID加密函数
    decryptId    // ID解密函数
  }
