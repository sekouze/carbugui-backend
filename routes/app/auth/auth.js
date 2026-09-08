const createAsyncRouter = require('../../../utils/asyncRouter');
const authController = require('../../../controllers/app/auth/authController');
const { auth } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.post('/otp/request', authController.requestOtp);
router.post('/otp/verify', authController.verifyOtp);
router.post('/refresh', authController.refreshToken);
router.post('/logout', auth, authController.logout);

router.get('/me', auth, authController.getMe);
router.put('/me', auth, authController.updateMe);
router.post('/push-token', auth, authController.registerPushToken);

module.exports = router;
