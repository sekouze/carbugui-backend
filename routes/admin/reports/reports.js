const createAsyncRouter = require('../../../utils/asyncRouter');
const reportController = require('../../../controllers/admin/reports/reportController');
const { auth, requireRole } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.use(auth, requireRole('ADMIN'));

router.get('/', reportController.getReports);
router.put('/:id', reportController.resolveReport);

module.exports = router;
