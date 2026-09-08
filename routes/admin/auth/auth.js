const createAsyncRouter = require('../../../utils/asyncRouter');
const authController = require('../../../controllers/admin/auth/authController');
const { auth, requireRole } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.post('/login', authController.login);
router.get('/me', auth, requireRole('ADMIN'), authController.getMe);

module.exports = router;
