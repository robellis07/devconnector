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

// @route   GET api/posts/:id
// @desc    get all posts for a user
// @access  private
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`param:${req.params.id}`);
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }
    return res.json(post);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.user.toString() != req.user.id.toString()) {
      return res.status(400).json({ msg: 'Post not found' });
    }
    await post.remove();
    return res.json({ msg: 'Your post has been deleted' });
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/:id
// @desc    get all posts for a user
// @access  private
router.get('/user/:id', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id }).sort({
      date: -1
    });
    return res.json(posts);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid User ID' });
    }
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  private
router.put('/like/:id', auth, async (req, res) => {
  try {
    // find the post
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }

    if (
      post.likes.filter(f => f.user.toString() === req.user.id.toString())
        .length > 0
    ) {
      return res.status(400).json({ msg: 'You have already liked this post' });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid Post id' });
    }
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    // find the post
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }

    if (
      post.likes.filter(f => f.user.toString() == req.user.id.toString())
        .length > 0
    ) {
      post.likes = post.likes.filter(
        f => f.user.toString() !== req.user.id.toString()
      );
      await post.save();
      return res.json({ msg: 'Like removed from this post.' });
    }

    res.status(400).json({
      msg: 'You cannot unlike a post that you do not currently like.'
    });
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid Post id' });
    }
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/comment/:id/:otherid
// @desc    put a comment on a post
// @access  private
router.put(
  '/comment/:id/',
  [auth, [check('text', 'Text is required').notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // find the post
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(400).json({ msg: 'Post not found' });
      }

      // find the user
      const user = await User.findById(req.user.id).select('-password');
      const comment = {
        user: user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar
      };

      post.comments.unshift(comment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      if (err.kind == 'ObjectId') {
        return res.status(400).json({ msg: 'Invalid Post id' });
      }
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete a comment
// @access  private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }

    const comment = post.comments.find(
      comment => comment.id == req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // check user
    if (comment.user != req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // remove it
    const removeIndex = post.comments.map(item => item.id).indexOf(comment.id);
    post.comments.splice(removeIndex, 1);

    // save
    await post.save();
    return res.json({ msg: 'Your comment has been deleted' });
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
