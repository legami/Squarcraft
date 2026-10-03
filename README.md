# Squarcraft

Prototype web d'un monde de cubes, conçu pour être publié directement avec **GitHub Pages**. Il ne demande ni installation ni étape de compilation.

## Lancer localement

Ouvrez `index.html` depuis un petit serveur statique, par exemple :

```bash
python3 -m http.server 8000
```

Puis ouvrez <http://localhost:8000>.

## Commandes

- **ZQSD** ou **WASD** : se déplacer
- **Espace** : sauter
- **Clic gauche** : retirer un bloc
- **Clic droit** : poser le bloc choisi
- **1**, **2**, **3** : sélectionner herbe, terre ou pierre

## Publication GitHub Pages

Dans le dépôt GitHub, ouvrez **Settings → Pages**, puis sélectionnez la branche de publication (par exemple `main`) et le dossier racine (`/`). Le site sera alors servi depuis ce dépôt.

Le projet charge Three.js depuis jsDelivr afin de rester compatible avec un déploiement GitHub Pages sans build.
