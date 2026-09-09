const createAsyncRouter = require('../../../utils/asyncRouter');
const authController = require('../../../controllers/station/auth/authController');
const { auth, requireRole } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, requireRole('STATION'), authController.getMe);
router.put('/password', auth, requireRole('STATION'), authController.updatePassword);

module.exports = router;
