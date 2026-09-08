const axios = require("axios");

/**
 * Récupère toutes les stations-service présentes
 * dans OpenStreetMap pour la Guinée.
 *
 * On récupère :
 * - nodes
 * - ways
 * - relations
 *
 * Pour les ways/relations, Overpass retourne
 * les coordonnées dans "center".
 */

const OVERPASS_URL =
  "https://overpass-api.de/api/interpreter";

const query = `
[out:json][timeout:180];

area["ISO3166-1"="GN"][admin_level=2]->.guinea;

(
  node["amenity"="fuel"](area.guinea);
  way["amenity"="fuel"](area.guinea);
  relation["amenity"="fuel"](area.guinea);
);

out center tags;
`;





const fetchGuineaFuelStations = async () => {
  console.log("🌍 Interrogation de l'API Overpass...");

  try {
    const response = await axios.post(
      OVERPASS_URL,
      query,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "GuineaFuelStations/1.0",
        },

        timeout: 240000,
      }
    );

    if (!response.data || !Array.isArray(response.data.elements)) {
      throw new Error(
        "Réponse Overpass invalide."
      );
    }

    console.log(
      `✅ ${response.data.elements.length} objets récupérés depuis OpenStreetMap`
    );

    return response.data.elements;
  } catch (error) {
    console.error(
      "❌ Erreur Overpass:",
      error.response?.data || error.message
    );

    throw new Error(
      "Impossible de récupérer les stations depuis OpenStreetMap."
    );
  }
}



module.exports = fetchGuineaFuelStations;
