# Bloc API – diagnostic des erreurs 500 lors de la création

Lorsque l'appel `POST /api/blocks` retourne une erreur HTTP 500, les causes les plus fréquentes concernent la base de données ou la cohérence des données d'entrée. Les points ci-dessous résument les vérifications à effectuer et la réponse attendue de l'API.

## Causes probables
- **Schéma non migré** : la table `blocks` ou la colonne attendue n'existe pas (SQLSTATE `42S02` ou `42S22`).
- **Clé étrangère invalide** : `farm_id` pointe vers une exploitation absente ou supprimée (SQLSTATE `23000` ou `23503`).
- **Description trop longue** : texte > 255 caractères (SQLSTATE `22001`).
- **Valeurs inattendues** : `type` différent de `openfield`/`greenhouse` ou `farm_id` nul/0 entraîne une réponse de validation 422 côté Laravel avant même l'insertion.

## Étapes de diagnostic
1. **Consulter les logs** :
   - `tail -f storage/logs/laravel.log` pendant l'appel API.
   - Les erreurs SQL (`QueryException`) sont maintenant journalisées avec le `sql_state` et le `farm_id` incriminé.
2. **Vérifier le schéma** :
   - `php artisan migrate:status` pour vérifier que les migrations sont appliquées.
   - `php artisan migrate` si les tables sont manquantes.
3. **Contrôler les données envoyées** :
   - S'assurer que `farm_id` correspond à une exploitation existante et non supprimée.
   - Limiter `description` à 255 caractères.
   - Confirmer que `type` vaut `openfield` ou `greenhouse`.
4. **Rejouer la requête** : après correction, l'API doit répondre **201** en cas de succès ou **422** si une contrainte de données est violée.

## Résultat attendu côté API
- **201 Created** : bloc créé avec succès.
- **422 Unprocessable Entity** : contraintes de validation (type invalide, farm_id manquant, description trop longue, clé étrangère inexistante).
- **500 Internal Server Error** : schéma de base non à jour; le message de réponse invite à rejouer les migrations et les logs détaillent l'erreur SQL.
