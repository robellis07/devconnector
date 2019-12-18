const express = require('express');
const router = express.Router();
const gravitar = require('gravatar');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');

const { check, validationResult } = require('express-validator');

// config settings
const config = require('../../config');

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
    .isLength({ min: 6 }),
  check(
    'password',
    'Password cannot contain spaces')
    .not().contains(" "),    
],
async (req, res) => {
  const errors = validationResult(req);  
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  // pull name, email and password from body
  const {name, email, password} = req.body;

  try {
    // see if the user exists
    let user = await User.findOne({ email });

    if (user) {
      res.status(400).json({ errors: [{msg: 'User already exists'}] });
      return;
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

    const payload = {
      user: {
        id: user.id,
      }
    }
  
    // return json token (needed for login)
    user.id = await jsonwebtoken.sign(
      payload, 
      config.get('jasontokensecret'),
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        return res.json({ token });
      });
    } catch(err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }



});

module.exports = router;