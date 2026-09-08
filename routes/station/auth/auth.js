const createAsyncRouter = require('../../../utils/asyncRouter');
const authController = require('../../../controllers/station/auth/authController');
const { auth, requireRole } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.post('/login', authController.login);
router.put('/password', auth, requireRole('STATION'), authController.updatePassword);

module.exports = router;
