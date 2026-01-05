const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Lấy token từ "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: '❌ Không có token, vui lòng đăng nhập!' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '❌ Token không hợp lệ!' });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;