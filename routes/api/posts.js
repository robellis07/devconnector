const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

// @route   POST api/posts
// @desc    Create a post
// @access  private
router.post('/', [auth, [check('text').notEmpty()]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(req.body);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // get name, avatar and user
    const user = await User.findById(req.user.id).select('-password');

    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    });

    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/posts
// @desc    get all posts
// @access  private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    return res.json(posts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/:user_id
// @desc    get all posts for a user
// @access  private
router.get('/:user_id', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.user_id }).sort({
      date: -1
    });
    return res.json(posts);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid userid' });
    }
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
