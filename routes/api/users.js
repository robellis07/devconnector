const express = require('express');
const router = express.Router();
const gravitar = require('gravatar');
const bcrypt = require('bcryptjs');

const { check, validationResult } = require('express-validator');

// pull model
const User = require('../../models/User');


// @route   POST api/users 
// @desc    Register User
// @access  public
router.post('/', [
  check(
    'name', 
    'Name is required')
    .not()
    .isEmpty(),
  check(
    'email', 
    'Please include a valid email')
    .isEmail(),
  check(
    'password', 
    'Please enter a password with 6 or more characters')
    .isLength({ min: 6 })
],
async (req, res) => {
  console.log(req.body);

  const errors = validationResult(req);  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // pull name, email and password from body
  const {name, email, password} = req.body;

  try {
    // see if the user exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{msg: 'User already exists'}] });
    }

    // get users gravitar based on email
    const avatar = gravitar.url(email, {
      s: '200',
      r: 'pg',
      d: 'mm'
    });

    user = new User({
      name,
      email,
      avatar,
      password
    });

    // create salt
    // encrypt the password
    const salt = await bcrypt.genSalt(10);
    // hash the password
    user.password = await bcrypt.hash(password, salt);

    // save
    await user.save();

    res.send('User Registered');
    console.log(user);

    // not yet
    // return json token (needed for login)
    
    
  } catch(err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }



});

module.exports = router;