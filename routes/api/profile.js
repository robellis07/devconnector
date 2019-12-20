const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const { check, validationResult } = require("express-validator");

// @route   GET api/profile/me
// @desc    gets the current user based on the token (using the auth method)
// @access  private (beause it has the auth)
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // should be this;
    //    const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name', 'avatar');
    console.log("profile is", profile);

    if (!profile) {
      return res.status(400).send({ msg: "there is no profile." });
    }

    return res.status(200).send({ msg: "Testing" });
  } catch (err) {
    return res.status(500).json({ msg: "Server Error, sorry" });
  }
});

// @route   POST api/profile
// @desc    create or update a user profile
// @access  private

router.post(
  "/",
  [
    auth,
    check("status", "Please supply status")
      .not()
      .isEmpty(),
    check("skills", "Please supply at lease one skill (comma separated list)")
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

    if (skills) profileFields.skills = skills.split(",").map(f => f.trim()); // turn into array

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
      return res.status(500).send("Server error");
    }
  }
);

module.exports = router;
