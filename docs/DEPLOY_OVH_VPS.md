# Deploiement multi-utilisateur sur un VPS OVHcloud

## Ce qui fonctionne en ligne

Chaque joueur ouvre le meme domaine et se connecte avec son propre compte Battle.net. Le callback OAuth cree ou retrouve son `app_users.id`; son roster, son personnage actif, son token chiffre et sa session PostgreSQL restent isoles des autres utilisateurs.

Les donnees du Collector local ne peuvent pas etre lues depuis le VPS. Les fonctions Battle.net sont multi-utilisateur; la synchronisation des SavedVariables depuis le PC de chaque joueur demandera un futur client Sync authentifie.

## Valeurs a adapter

Les exemples supposent:

- domaine: `azer.example.com`;
- utilisateur Linux: `azer`;
- depot: `/opt/azer-companion`;
- service: `azer-companion`;
- application Node: `127.0.0.1:3030`.

Remplacer ces valeurs dans les fichiers `.example` avant leur installation.

## Secrets et environnement

```bash
sudo install -d -m 750 -o root -g azer /etc/azer-companion
sudo cp deploy/env.production.example /etc/azer-companion/azer-companion.env
sudo chown root:azer /etc/azer-companion/azer-companion.env
sudo chmod 640 /etc/azer-companion/azer-companion.env
openssl rand -base64 48
openssl rand -base64 32
```

Placer les deux valeurs generees respectivement dans `SESSION_SECRET` et `OAUTH_ENCRYPTION_KEY`. Ne jamais les ajouter a GitHub.

Pour un serveur familial, conserver `REGISTRATION_MODE=allowlist` et placer les BattleTags autorises dans `ALLOWED_BATTLETAGS`. Un utilisateur deja lie par son identifiant Battle.net interne peut toujours se reconnecter, meme si son BattleTag change ensuite. Passer temporairement en mode `open` rendrait l'inscription accessible a toute personne connaissant le domaine.

Dans le portail developpeur Battle.net, l'URL de callback doit correspondre exactement a:

```text
https://azer.example.com/api/auth/battlenet/callback
```

## PostgreSQL

PostgreSQL doit ecouter uniquement sur localhost. Creer une base et un utilisateur dedies, renseigner leurs valeurs dans le fichier d'environnement, puis appliquer les migrations:

```bash
cd /opt/azer-companion
npm ci --omit=dev
sudo -u azer npm run db:migrate
sudo -u azer npm run db:multiuser-check
```

## systemd

```bash
sudo cp deploy/systemd/azer-companion.service.example /etc/systemd/system/azer-companion.service
sudo systemctl daemon-reload
sudo systemctl enable --now azer-companion
sudo journalctl -u azer-companion -n 100 --no-pager
```

## Nginx et HTTPS

Installer le certificat avec Certbot, adapter le domaine du fichier Nginx, puis:

```bash
sudo cp deploy/nginx/azer-companion.conf.example /etc/nginx/sites-available/azer-companion
sudo ln -s /etc/nginx/sites-available/azer-companion /etc/nginx/sites-enabled/azer-companion
sudo nginx -t
sudo systemctl reload nginx
```

Les ports publics necessaires sont `80/tcp` et `443/tcp`. Les ports `3030/tcp` et `5432/tcp` doivent rester fermes dans le pare-feu OVHcloud et le pare-feu du VPS.

## Mise a jour depuis GitHub

Une fois la branche de production poussee sur GitHub:

```bash
cd /opt/azer-companion
APP_DIR=/opt/azer-companion DEPLOY_BRANCH=main bash deploy/deploy.sh
```

Le script refuse d'ecraser des modifications locales, utilise uniquement un `git pull --ff-only`, installe les dependances verrouillees, execute les migrations et les tests, puis redemarre systemd. Les sessions restent connectees pendant le redemarrage puisqu'elles sont dans PostgreSQL.

## Verification de deux comptes

1. Ouvrir le domaine dans un navigateur normal et connecter le premier compte Battle.net.
2. Ouvrir une fenetre privee ou un second appareil et connecter le second compte.
3. Verifier que `/api/auth/me` retourne deux utilisateurs differents.
4. Verifier que chaque compte ne voit que son roster.
5. Executer `npm run db:multiuser-check` sur le VPS.
