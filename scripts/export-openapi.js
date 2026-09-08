// Écrit docs/openapi.json à partir de docs/openapi.js, pour pouvoir le
// transmettre (email, Slack, dépôt Git) sans avoir le serveur démarré.
const fs = require('fs');
const path = require('path');
const openapiSpec = require('../docs/openapi');

const outPath = path.join(__dirname, '..', 'docs', 'openapi.json');

fs.writeFileSync(outPath, JSON.stringify(openapiSpec, null, 2));

console.log(`✅ Spec OpenAPI exportée vers ${outPath}`);
