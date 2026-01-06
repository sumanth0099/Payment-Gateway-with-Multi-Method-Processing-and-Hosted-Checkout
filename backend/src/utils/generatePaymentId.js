function random16() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < 16; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }
  
  module.exports = function generatePaymentId() {
    return "pay_" + random16();
  };
  