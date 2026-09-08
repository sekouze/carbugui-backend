FROM node:20

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers nécessaires pour l'installation des dépendances
COPY package*.json ./

# Installer les dépendances sans utiliser le cache
RUN npm install

# Copier le reste du code de l'application
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Exposer le port utilisé par l'application (ajuste si nécessaire)
EXPOSE 5000

# Définir la commande de lancement de l'application
CMD ["node", "server.js"]
