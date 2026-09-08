const createAsyncRouter = require('../../../utils/asyncRouter');
const stationController = require('../../../controllers/app/stations/stationController');
const { auth, optionalAuth } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.get('/', stationController.getStations);
router.get('/nearby', optionalAuth, stationController.getNearbyStations);
router.get('/:id', stationController.getStationById);
router.post('/:id/reports', auth, stationController.createReport);

module.exports = router;
