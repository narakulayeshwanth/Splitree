const express = require('express');
const router = express.Router();
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');

// GET /api/users/search?email=xxx
// Used when adding a member to a group by email
router.get('/search', authenticate, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query parameter is required' });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(user);
  } catch (err) {
    console.error('User search error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
