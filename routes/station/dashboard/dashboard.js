const createAsyncRouter = require('../../../utils/asyncRouter');
const dashboardController = require('../../../controllers/station/dashboard/dashboardController');
const { auth, requireRole } = require('../../../middleware/auth');
const { requireStationAccess } = require('../../../middleware/requireStationAccess');

const router = createAsyncRouter();

router.use(auth, requireRole('STATION'));

router.get('/stations', dashboardController.getMyStations);
router.get('/:stationId', requireStationAccess, dashboardController.getDashboard);
router.put('/:stationId/open', requireStationAccess, dashboardController.toggleOpen);
router.put('/:stationId/products/:product', requireStationAccess, dashboardController.updateProduct);
router.get('/:stationId/activities', requireStationAccess, dashboardController.getActivities);
router.get('/:stationId/reports', requireStationAccess, dashboardController.getReports);

module.exports = router;
