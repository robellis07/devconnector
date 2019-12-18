const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

// @route   GET api/auth
// @desc    test route
// @access  public
router.get('/', auth, (req, res) => {
  return res
    .status(200)
    .send(`Welcome ${req.user.name}`);
  }
);

module.exports = router;