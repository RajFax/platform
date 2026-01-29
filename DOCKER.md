# Dockerisation du projet

## Prérequis
- Docker + Docker Compose

## Démarrage
```bash
docker compose up --build
```

## Accès
- Backend Laravel: http://localhost:8000
- Frontend Vite (build statique servi par Nginx): http://localhost:5173

## Commandes utiles
- Lancer les migrations (si besoin):
```bash
docker compose exec backend php artisan migrate
```
