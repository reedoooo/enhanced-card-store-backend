// // src/middleware/authenticate.js
// const jwt = require("jsonwebtoken");

// const authenticate = (req, res, next) => {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     jwt.verify(token, process.env.JWT_SECRET);
//     next();
//   } catch (error) {
//     res.status(401).json({ message: "Authentication failed!" });
//   }
// };

// module.exports = authenticate;
