const createAsyncRouter = require('../../../utils/asyncRouter');
const catalogController = require('../../../controllers/admin/catalog/catalogController');
const { auth, requireRole } = require('../../../middleware/auth');

const router = createAsyncRouter();

router.use(auth, requireRole('ADMIN'));

router.get('/brands', catalogController.getBrands);
router.post('/brands', catalogController.createBrand);
router.put('/brands/:id', catalogController.updateBrand);
router.delete('/brands/:id', catalogController.deleteBrand);

router.get('/areas', catalogController.getAreas);
router.post('/areas', catalogController.createArea);
router.put('/areas/:id', catalogController.updateArea);
router.delete('/areas/:id', catalogController.deleteArea);

module.exports = router;
