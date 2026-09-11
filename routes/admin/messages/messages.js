const createAsyncRouter = require('../../../utils/asyncRouter');
const messageController = require('../../../controllers/admin/messages/messageController');
const { auth, requireRole } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.use(auth, requireRole('ADMIN'));

router.post('/', messageController.sendMessage);
router.get('/', messageController.getMessages);
router.get('/:id', messageController.getMessageById);
router.put('/:id/cancel', messageController.cancelMessage);

module.exports = router;
