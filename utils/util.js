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
  
  /**
   * Base64加密（微信小程序环境兼容版，不依赖TextEncoder）
   * @param {string} str - 需要加密的字符串
   * @returns {string} Base64加密后的字符串
   */
  const base64Encode = (str) => {
    // 字符串转ArrayBuffer（兼容小程序环境）
    const buffer = new ArrayBuffer(str.length);
    const uint8Array = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
      uint8Array[i] = str.charCodeAt(i); // 逐个字符转换为ASCII码
    }
    // 调用小程序原生API转换为Base64
    return wx.arrayBufferToBase64(buffer);
  };
  
  /**
   * Base64解密（微信小程序环境兼容版，不依赖TextDecoder）
   * @param {string} base64Str - 需要解密的Base64字符串
   * @returns {string} 解密后的原始字符串
   */
  const base64Decode = (base64Str) => {
    // 处理URL安全Base64和填充符
    const safeStr = base64Str.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (safeStr.length % 4)) % 4;
    const paddedStr = safeStr + '='.repeat(padLength);
    
    // 调用小程序原生API转换为ArrayBuffer
    const arrayBuffer = wx.base64ToArrayBuffer(paddedStr);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // ArrayBuffer转字符串（兼容小程序环境）
    let str = '';
    for (let i = 0; i < uint8Array.length; i++) {
      str += String.fromCharCode(uint8Array[i]);
    }
    return str;
  };
  
  /**
   * 加密ID（Base64加密后附加YWI后缀）
   * @param {number} id - 需要加密的数字ID
   * @returns {string} 加密后的字符串（Base64+YWI）
   */
  const encryptId = (id) => {
    // 验证ID有效性
    if (typeof id !== 'number' || id < 1 || !Number.isInteger(id)) {
      throw new Error('请传入有效的正整数ID');
    }
    
    // 转换为字符串后进行Base64加密
    const idStr = id.toString();
    const base64Str = base64Encode(idStr);
    
    // 附加YWI后缀并返回
    return base64Str + 'YWI';
  };
  
  /**
   * 解密ID（先移除YWI后缀再Base64解密）
   * @param {string} encryptedStr - 加密后的字符串（Base64+YWI）
   * @returns {number} 解密后的ID
   */
  const decryptId = (encryptedStr) => {
    if (typeof encryptedStr !== 'string' || encryptedStr.trim() === '') {
      throw new Error('请传入有效的加密字符串');
    }
    
    // 移除末尾的YWI后缀
    let base64Str = encryptedStr;
    if (encryptedStr.endsWith('YWI')) {
      base64Str = encryptedStr.slice(0, -3);
    } else {
      console.warn('加密字符串未包含YWI后缀，尝试直接解密');
    }
    
    // Base64解密并转换为数字
    const decodedStr = base64Decode(base64Str);
    const id = parseInt(decodedStr, 10);
    
    if (isNaN(id) || id < 1) {
      throw new Error('解密后ID无效');
    }
    
    return id;
  };
  
  // 导出所有工具函数
  module.exports = {
    formatTime,
    formatNumber,
    numberToChinese,
    encryptId,  // Base64加密并附加YWI后缀
    decryptId   // 移除YWI后缀并Base64解密
  };