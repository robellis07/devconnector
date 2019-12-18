const jsonwebtoken = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
  // find the token from the header
  const token = req.header('x-auth-token');

  // check header for token
  if (!token) {
    return res
      .status(401)
      .json({ msg: 'Unable to find the token in the header' });
  }

  // verify the token
  try {
    const decoded = jsonwebtoken.verify(token, config.get('jasontokensecret'));
    console.log('decoded value', decoded);
    req.user = decoded.user;
    next();
  }
  catch(err) {
    return res
      .status(401)
      .json({ msg: "Token was invalid" })
  }
}