module.exports = function luhnCheck(cardNumber) {
    const num = cardNumber.replace(/[\s-]/g, "");
    if (!/^\d{13,19}$/.test(num)) return false;
  
    let sum = 0;
    let shouldDouble = false;
  
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i]);
  
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
  
      sum += digit;
      shouldDouble = !shouldDouble;
    }
  
    return sum % 10 === 0;
  };
  