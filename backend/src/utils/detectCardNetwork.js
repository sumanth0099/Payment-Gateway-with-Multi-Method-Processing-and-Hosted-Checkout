module.exports = function detectCardNetwork(cardNumber) {
    const num = cardNumber.replace(/[\s-]/g, "");
  
    if (num.startsWith("4")) return "visa";
  
    const first2 = parseInt(num.slice(0, 2));
  
    if (first2 >= 51 && first2 <= 55) return "mastercard";
    if (first2 === 34 || first2 === 37) return "amex";
    if (num.startsWith("60") || num.startsWith("65") || (first2 >= 81 && first2 <= 89))
      return "rupay";
  
    return "unknown";
  };
  