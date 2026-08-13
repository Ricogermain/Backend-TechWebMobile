# Déployer Driveo gratuitement : Render + Neon

Cette configuration déploie automatiquement l'API NestJS depuis la branche `main` sur Render et conserve les données PostgreSQL sur Neon.

## 1. Créer la base Neon

1. Créez un projet PostgreSQL sur [Neon](https://neon.com).
2. Dans **Connect**, copiez les deux chaînes de connexion pour `neondb` :
   - la chaîne **pooled** (hôte avec `-pooler`) pour `DATABASE_URL` ;
   - la chaîne **direct** (sans `-pooler`) pour `DIRECT_URL`.
3. Ne publiez jamais ces valeurs dans Git. Utilisez `.env` localement à partir de `.env.example`.

## 2. Créer le service Render

1. Poussez ce dossier backend dans un dépôt GitHub.
2. Dans Render, sélectionnez **New > Blueprint** puis le dépôt GitHub.
3. Render détecte `render.yaml`. À la création, renseignez `DATABASE_URL` et `DIRECT_URL` avec les valeurs Neon.
4. Validez le déploiement.

Render exécute automatiquement :

1. `npm ci`, génération Prisma et compilation NestJS ;
2. `npx prisma migrate deploy` avant chaque mise en production ;
3. `npm run seed` une seule fois, au premier déploiement ;
4. `npm run start:prod` pour démarrer l'API.

L'URL Render obtenue ressemble à `https://driveo-api.onrender.com`. L'interface Swagger est alors disponible sur `https://driveo-api.onrender.com/api`.

## 3. Relier Flutter

Lancez l'application avec l'URL Render :

```powershell
flutter run --dart-define=API_BASE_URL=https://driveo-api.onrender.com
```

Pour Flutter Web, servez toujours l'application depuis HTTPS afin d'éviter le blocage des requêtes mixtes.

## 4. CI/CD

Le workflow `.github/workflows/ci.yml` vérifie l'installation, le client Prisma et la compilation à chaque pull request et push sur `main`.

Les tests unitaires actuels ne sont pas inclus : leur configuration Jest ne résout pas encore les imports `src/*` et plusieurs tests ne fournissent pas le mock de `DatabaseService`. Il faut les corriger avant de les ajouter comme étape obligatoire de CI.

Render surveille `main` et réalise le déploiement automatiquement seulement après le push. Les secrets restent dans Render, jamais dans GitHub Actions.

## Limites du gratuit

Le service Render gratuit se met en veille après une période d'inactivité : le premier appel suivant peut être lent. Neon conserve les données, mais son offre gratuite est destinée à un usage de démonstration ou à faible trafic.
