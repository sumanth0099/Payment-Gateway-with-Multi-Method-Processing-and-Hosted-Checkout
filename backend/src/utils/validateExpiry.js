module.exports = function validateExpiry(month, year) {
    const m = parseInt(month);
    if (m < 1 || m > 12) return false;
  
    let y = parseInt(year);
    if (year.length === 2) y += 2000;
  
    const now = new Date();
    const expDate = new Date(y, m - 1, 1);
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
  
    return expDate >= current;
  };
  