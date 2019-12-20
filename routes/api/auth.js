const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const config = require("config");
const jsonwebtoken = require("jsonwebtoken");

// @route   GET api/auth
// @desc    test route
// @access  public
router.get("/", auth, async (req, res) => {
  try {
    const theUser = await User.findById(req.user.id).select("-password");
    if (!theUser) {
      return res.status(500).send({ msg: "Unable to find user" });
    }

    return res.status(200).send(theUser);
  } catch (err) {
    throw err;
  }
});

// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  public

router.post(
  "/login",
  [
    check("email", "Please supply an email").isEmail(),
    check("password", "Please supply a password")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const errorReturn = function() {
      return res
        .status(401)
        .json({ msg: "Email or password is invalid, please try again1" });
    };

    try {
      const { email, password } = req.body;
      // get the hashed password from the mongodb
      const user = await User.findOne({ email });

      if (!user) {
        return errorReturn();
      }

      // get salt from user, hash the password and verify that it matches
      const salt = await bcrypt.getSalt(user.password);
      const hashedPwd = await bcrypt.hash(password, salt);
      if (hashedPwd !== user.password) {
        return errorReturn();
      }

      // send payload of user, this will refresh the token
      const payload = { user: { id: user.id } };

      //return json token (needed for login)
      user.id = await jsonwebtoken.sign(
        payload,
        config.get("jasontokensecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          return res.json({ token });
        }
      );
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ msg: "An error occured, please try again" });
    }
  }
);

router.get("/", auth, async (req, res) => {
  try {
    const theUser = await User.findById(req.user.id).select("-password");
    if (!theUser) {
      return res.status(500).send({ msg: "Unable to find user" });
    }

    return res.status(200).send(theUser);
  } catch (err) {
    throw err;
  }
});

module.exports = router;
