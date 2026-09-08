const slugify = require('slugify');
const prisma = require('../../../utils/prisma');

const makeSlug = (label) => slugify(label, { lower: true, strict: true, locale: 'fr' });

// --- Brands ---------------------------------------------------------------

exports.getBrands = async (req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  return res.status(200).json({ success: true, data: brands });
};

exports.createBrand = async (req, res) => {
  const { name, logoUrl } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name est requis.' });

  const brand = await prisma.brand.create({ data: { name, slug: makeSlug(name), logoUrl: logoUrl || null } });
  return res.status(201).json({ success: true, data: brand });
};

exports.updateBrand = async (req, res) => {
  const { name, logoUrl } = req.body;

  const brand = await prisma.brand.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name, slug: makeSlug(name) }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
  });

  return res.status(200).json({ success: true, data: brand });
};

exports.deleteBrand = async (req, res) => {
  await prisma.brand.delete({ where: { id: req.params.id } });
  return res.status(200).json({ success: true, message: 'Marque supprimée.' });
};

// --- Areas -----------------------------------------------------------------

exports.getAreas = async (req, res) => {
  const areas = await prisma.area.findMany({ orderBy: { sortOrder: 'asc' } });
  return res.status(200).json({ success: true, data: areas });
};

exports.createArea = async (req, res) => {
  const { label, latitude, longitude, sortOrder } = req.body;
  if (!label || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: 'label, latitude et longitude sont requis.' });
  }

  const area = await prisma.area.create({
    data: {
      label,
      slug: makeSlug(label),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      sortOrder: sortOrder ?? 0,
    },
  });

  return res.status(201).json({ success: true, data: area });
};

exports.updateArea = async (req, res) => {
  const { label, latitude, longitude, sortOrder, isActive } = req.body;

  const area = await prisma.area.update({
    where: { id: req.params.id },
    data: {
      ...(label !== undefined && { label, slug: makeSlug(label) }),
      ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
      ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return res.status(200).json({ success: true, data: area });
};

exports.deleteArea = async (req, res) => {
  await prisma.area.delete({ where: { id: req.params.id } });
  return res.status(200).json({ success: true, message: 'Zone supprimée.' });
};
