const createAsyncRouter = require('../../../utils/asyncRouter');
const chatController = require('../../../controllers/app/chat/chatController');
const { auth } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.get('/threads', auth, chatController.getMyThreads);
router.post('/threads', auth, chatController.openThread);
router.get('/threads/:id/messages', auth, chatController.getMessages);
router.post('/threads/:id/messages', auth, chatController.sendMessage);
router.post('/threads/:id/close', auth, chatController.closeThread);

module.exports = router;
