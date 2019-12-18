const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route   GET api/auth
// @desc    test route
// @access  public
router.get('/', auth, async (req, res) => {

  console.log(`Attempting to find ${ req.user.id }`);
  try {
    const theUser = await User.findById(req.user.id);
    if (!theUser) {
      return res
        .status(401)
        .send({msg : 'Unable to find user'});
    }

    return res
      .status(200)
      .send(`Welcome ${ theUser.name }. Your email address is ${ theUser.email }`);

    } catch(err) {
    throw err;
  }
});

module.exports = router;