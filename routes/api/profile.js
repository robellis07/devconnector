const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const { check, validationResult } = require('express-validator');

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
      return res.status(400).send({ msg: 'there is no profile.' });
    }

    return res.status(200).send({ msg: 'Testing' });
  } catch (err) {
    return res.status(500).json({ msg: 'Server Error, sorry' });
  }
});

// @route   POST api/profile
// @desc    create or update a user profile
// @access  private
router.post(
  '/',
  [
    auth,
    check('status', 'Please supply status')
      .not()
      .isEmpty(),
    check('skills', 'Please supply at lease one skill (comma separated list)')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubUsername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    // build profile object
    const profileFields = {};
    profileFields.social = {};

    // get from request
    profileFields.user = req.user.id;

    // rest of fields
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubUsername) profileFields.githubUsername = githubUsername;

    if (skills) profileFields.skills = skills.split(',').map(f => f.trim()); // turn into array

    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile == null) {
        profile = new Profile(profileFields);
        await profile.save();
      } else {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
      }
      return res.json(profile);
    } catch (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
  }
);

// @route   GET api/profile
// @desc    get all profiles
// @access public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    return res.status(200).json(profiles);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    get profie by userid
// @access public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'profile']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);

    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile
// @desc    delete profile, user and posts
// @access  private
router.delete('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'Profile and user removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/experience
// @desc    add profile experiences
// @access  private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('company', 'Company is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // destruct
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title: title,
      company: company,
      location: location,
      from: from,
      to: to,
      current: current,
      description: description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res
          .status(400)
          .json({ msg: 'You must first make your profile' });
      }

      // check for existing to update.
      profile.experience.unshift(newExp); // pushes to beginning not end opposite of push
      await profile.save();
      res.json({ msg: profile });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
