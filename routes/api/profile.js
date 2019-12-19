const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route   GET api/profile/me
// @desc    gets the current user based on the token (using the auth method)
// @access  private (beause it has the auth)
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // should be this;
    //    const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name', 'avatar');
    console.log('profile is', profile);

    if (!profile) {
      return res.status(400).send({msg: "there is no profile."});
    }

    return res.status(200).send({msg: 'Testing'});
  } catch(err) {
    return res.status(500).json({ msg: "Server Error, sorry" });
  }
});

module.exports = router;