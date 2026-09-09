const createAsyncRouter = require('../../../utils/asyncRouter');
const authController = require('../../../controllers/app/auth/authController');
const pinController = require('../../../controllers/app/auth/pinController');
const { auth } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.post('/otp/request', authController.requestOtp);
router.post('/otp/verify', authController.verifyOtp);
router.post('/refresh', authController.refreshToken);
router.post('/logout', auth, authController.logout);

router.get('/me', auth, authController.getMe);
router.put('/me', auth, authController.updateMe);
router.post('/push-token', auth, authController.registerPushToken);

// Code PIN — évite de reconsommer un SMS tant que la session est valide.
router.post('/pin/set', auth, pinController.setPin);
router.post('/pin/login', pinController.pinLogin);
router.post('/pin/forgot', pinController.forgotPin);
router.post('/pin/reset', pinController.resetPin);

module.exports = router;
