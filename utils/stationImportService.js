const slugify = require("slugify");
const {PrismaClient,Prisma}=require('@prisma/client');

const prisma=new PrismaClient

const fetchGuineaFuelStations= require("./stations");

/**
 * Génère un slug propre.
 */
const generateSlug = (name, osmId) => {
  let slug = slugify(name || "station", {
    lower: true,
    strict: true,
    locale: "fr",
  });

  if (!slug) {
    slug = "station";
  }

  return `${slug}-${osmId}`;
}

/**
 * Récupère latitude/longitude.
 *
 * Pour un node :
 *
 * element.lat
 * element.lon
 *
 * Pour un way/relation :
 *
 * element.center.lat
 * element.center.lon
 */
const getCoordinates = (element) => {
  if (
    typeof element.lat === "number" &&
    typeof element.lon === "number"
  ) {
    return {
      latitude: element.lat,
      longitude: element.lon,
    };
  }

  if (
    element.center &&
    typeof element.center.lat === "number" &&
    typeof element.center.lon === "number"
  ) {
    return {
      latitude: element.center.lat,
      longitude: element.center.lon,
    };
  }

  return null;
}

/**
 * Nettoyage d'une valeur.
 */
const cleanValue = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return String(value).trim();
}

/**
 * Détermine le nom de la station.
 */
const getStationName = (tags, osmId) => {
  return (
    cleanValue(tags.name) ||
    cleanValue(tags["name:fr"]) ||
    cleanValue(tags.brand) ||
    `Station ${osmId}`
  );
}

/**
 * Retourne la marque présente dans OSM.
 */
const getBrandName = (tags) => {
  return (
    cleanValue(tags.brand) ||
    cleanValue(tags.operator) ||
    null
  );
}

/**
 * Recherche une marque.
 *
 * IMPORTANT :
 * Adapte ici les champs de ton modèle Brand
 * si ton modèle est différent.
 */
async function findOrCreateBrand(brandName) {
  if (!brandName) {
    return null;
  }

  const normalizedName = brandName.trim();

  /**
   * Si ton modèle Brand possède un champ "name".
   */
  let brand = await prisma.brand.findFirst({
    where: {
      name: {
        equals: normalizedName,
      },
    },
  });

  if (brand) {
    return brand;
  }

  /**
   * Création automatique de la marque.
   *
   * Si ton modèle Brand nécessite d'autres champs,
   * ajoute-les ici.
   */
  brand = await prisma.brand.create({
    data: {
      name: normalizedName,
    },
  });

  return brand;
}

/**
 * Vérifie si une station existe déjà.
 *
 * Priorité :
 *
 * 1. googlePlaceId si disponible
 * 2. proximité GPS
 * 3. osmId stocké dans le slug
 */
const findExistingStation = async ({
  latitude,
  longitude,
  osmId,
}) => {
  /**
   * On récupère les stations proches.
   *
   * Prisma/MySQL n'est pas utilisé ici pour faire
   * un calcul géographique compliqué.
   *
   * On prend une petite boîte autour du point.
   */
  const delta = 0.0005;

  const stations = await prisma.station.findMany({
    where: {
      latitude: {
        gte: latitude - delta,
        lte: latitude + delta,
      },

      longitude: {
        gte: longitude - delta,
        lte: longitude + delta,
      },
    },

    take: 20,
  });

  if (stations.length > 0) {
    /**
     * Vérification de distance approximative.
     */
    for (const station of stations) {
      const distance = calculateDistance(
        latitude,
        longitude,
        station.latitude,
        station.longitude
      );

      /**
       * 80 mètres.
       *
       * Deux stations séparées de moins de 80 m
       * sont probablement le même établissement.
       */
      if (distance <= 80) {
        return station;
      }
    }
  }

  /**
   * Recherche via le slug OSM.
   */
  const osmStation = await prisma.station.findFirst({
    where: {
      slug: {
        startsWith: `osm-${osmId}`,
      },
    },
  });

  return osmStation || null;
}

/**
 * Distance GPS en mètres.
 */
const calculateDistance = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const R = 6371000;

  const toRad = (value) =>
    (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

/**
 * Importe les stations OSM.
 */
const importStationsFromOSM = async () => {
  console.log(
    "🚀 Début import des stations-service de Guinée..."
  );

  const elements =
    await fetchGuineaFuelStations();

  let created = 0;  
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const results = [];

  for (const element of elements) {
    try {
      const tags = element.tags || {};

      const coordinates =
        getCoordinates(element);

      if (!coordinates) {
        console.warn(
          `⚠️ Station OSM ${element.id} sans coordonnées`
        );

        skipped++;

        continue;
      }

      const {
        latitude,
        longitude,
      } = coordinates;

      const name =
        getStationName(
          tags,
          element.id
        );

      const brandName =
        getBrandName(tags);

      /**
       * Marque.
       */
      let brand = null;

      if (brandName) {
        brand =
          await findOrCreateBrand(
            brandName
          );
      }

      /**
       * Informations complémentaires.
       */
      const phoneNumber =
        cleanValue(
          tags.phone ||
            tags["contact:phone"] ||
            tags["contact:mobile"]
        );

      const address =
        cleanValue(
          tags["addr:full"] ||
            tags.address
        );

      const neighborhood =
        cleanValue(
          tags["addr:suburb"] ||
            tags["addr:neighbourhood"] ||
            tags["addr:quarter"]
        );

      const city =
        cleanValue(
          tags["addr:city"]
        ) || "Conakry";

      /**
       * Horaires.
       */
      const openingHours =
        cleanValue(
          tags.opening_hours
        );

      /**
       * Slug.
       *
       * On utilise OSM + ID afin d'avoir
       * une valeur toujours unique.
       */
      //les 6 premier chiffres de l'id osm pour le slug
      const osmIdStr = String(element.id);
      const osmIdPrefix = osmIdStr.slice(0, 6);
      const osmSlug =
        `sonap-${osmIdPrefix}`;

      /**
       * Recherche d'une station existante.
       */
      let existing =
        await prisma.station.findUnique({
          where: {
            slug: osmSlug,
          },
        });

      /**
       * Si elle n'existe pas via son slug,
       * recherche géographique.
       */
      if (!existing) {
        existing =
          await findExistingStation({
            latitude,
            longitude,
            osmId: element.id,
          });
      }

      /**
       * Préparation des horaires.
       *
       * Ton champ est Json.
       */
      let openingHoursJson = null;

      if (openingHours) {
        openingHoursJson = {
          source: "openstreetmap",
          value: openingHours,
        };
      }

      /**
       * Données communes.
       */
      const data = {
        name,

        latitude,
        longitude,

        city,

        address,

        phoneNumber,

        neighborhood,

        isOpen: true,

        isPublished: true,

        statusUpdatedAt:
          new Date(),

        ...(brand
          ? {
              brand: {
                connect: {
                  id: brand.id,
                },
              },
            }
          : {}),

        ...(openingHoursJson
          ? {
              openingHours:
                openingHoursJson,
            }
          : {}),
      };

      /**
       * UPDATE
       */
      if (existing) {
        const station =
          await prisma.station.update({
            where: {
              id: existing.id,
            },

            data,
          });

        updated++;

        results.push({
          action: "updated",
          id: station.id,
          name: station.name,
          latitude:
            station.latitude,
          longitude:
            station.longitude,
        });

        continue;
      }

      /**
       * CREATE
       */
      const station =
        await prisma.station.create({
          data: {
            ...data,

            slug: osmSlug,
          },
        });

      created++;

      results.push({
        action: "created",
        id: station.id,
        name: station.name,
        latitude:
          station.latitude,
        longitude:
          station.longitude,
      });

      console.log(
        `✅ ${name} (${latitude}, ${longitude})`
      );
    } catch (error) {
      errors++;

      console.error(
        `❌ Erreur station OSM ${element.id}:`,
        error.message
      );
    }
  }

  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "📊 RÉSULTAT IMPORT OSM"
  );
  console.log(
    "======================================"
  );
  console.log(
    `📥 Récupérées : ${elements.length}`
  );
  console.log(
    `🆕 Créées     : ${created}`
  );
  console.log(
    `🔄 Modifiées  : ${updated}`
  );
  console.log(
    `⏭️ Ignorées   : ${skipped}`
  );
  console.log(
    `❌ Erreurs    : ${errors}`
  );
  console.log(
    "======================================"
  );

  return {
    total: elements.length,
    created,
    updated,
    skipped,
    errors,
    results,
  };
}

module.exports = {
  importStationsFromOSM,
};