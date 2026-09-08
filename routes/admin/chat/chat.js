const createAsyncRouter = require('../../../utils/asyncRouter');
const chatController = require('../../../controllers/admin/chat/chatController');
const { auth, requireRole } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.use(auth, requireRole('ADMIN'));

router.get('/threads', chatController.getThreads);
router.get('/threads/:id/messages', chatController.getMessages);
router.post('/threads/:id/messages', chatController.sendMessage);
router.put('/threads/:id/close', chatController.closeThread);

module.exports = router;
