# Leady Commerce — version définitive du carnet

## Ce que contient cette version
- Catalogue public responsive.
- Recherche et filtres.
- Favoris enregistrés sur l'appareil du visiteur.
- Fiche individuelle partageable par URL.
- Bouton de partage.
- Statuts Disponible / Réservé / Vendu.
- Espace de gestion avec ajout, modification, suppression et photo.
- Logo Leady fourni dans `logo-leady.jpg`.

## Important pour la vraie mise en ligne
Cette version est prête côté interface, mais le stockage de l'espace gestion utilise actuellement le navigateur (`localStorage`). Cela permet de tester immédiatement le fonctionnement, mais **ce n'est pas encore un stockage en ligne sécurisé** : les annonces ajoutées depuis un appareil ne sont pas automatiquement visibles sur les autres appareils.

Pour la version réellement en production, il faut connecter :
1. une base de données en ligne (par exemple Supabase/Firebase),
2. une authentification administrateur réelle,
3. un stockage d'images,
4. un hébergement avec un nom de domaine.

Le site peut ensuite être publié sur GitHub Pages, Netlify, Vercel ou un hébergeur équivalent.

## Code de démonstration
Le code d'accès de démonstration de l'espace gestion est `LEADY2026`.
**À remplacer par une vraie authentification avant une mise en production.**

## Personnalisation
Les six chevaux de démonstration dans `app.js` servent uniquement à visualiser le carnet. Ils pourront être supprimés lorsque les vrais chevaux seront intégrés.
