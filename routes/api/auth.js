const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator');;

// @route   GET api/auth
// @desc    test route
// @access  public
router.get('/', auth, async (req, res) => {
  try {
    const theUser = await User.findById(req.user.id).select('-password');
    if (!theUser) {
      return res
        .status(500)
        .send({msg : 'Unable to find user'});
    }

    return res
      .status(200)
      .send(theUser);

    } catch(err) {
    throw err;
  }
});

// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  public

router.post('/login', [
  check(
    'email', 
    'Please supply an email')
    .isEmail(),
  check(
    'password', 
    'Please supply a password')
    .not()
    .isEmpty(),   
],
async (req, res) => {
  const errors = validationResult(req);  
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array() });
  }

  const {email, password} = req.body;
  
  // get the hashed password from the mongodb
  const user = await User.findOne({ email });

  if (!user) {
    return res 
      .status(401)
      .json( {
        msg: 'Email or password is invalid, please try again'
    });
  }
  
  /*
    instead of the code below, could have used bcrypt.compare(password, user.password)
    it would then do the same code below and return true/false
  */
  // get the salt of the saved user
  const salt = await bcrypt.getSalt(user.password);

  // hash the password
  const hashedPwd = await bcrypt.hash(password, salt);

  // stuff below needs to return token
  // the way to get the token is the same as the auth create
  // it needs to set the expiration and send the payload, this will restart the timeout
  // and will return the token

  // also the fail check should be before the match
  // and it should all be wrapped in a try catch  (stuff above)
  if (hashedPwd == user.password) {
    return res
      .status(200)
      .send(`Thanks ${user.name} you are now logged in.`);
  }

  // if reached here, password invalid, send same message
  return res 
    .status(401)
    .json( {
      msg: 'Email or password is invalid, please try again'
    });
});

module.exports = router;