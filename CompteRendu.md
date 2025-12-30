# Résumé du projet

## Ce qui a été ajouté

### 1) Service de traduction (API)

- Un service Angular `TranslationService` a été ajouté pour appeler l’API publique MyMemory.
- Endpoint utilisé : `https://api.mymemory.translated.net/get`
- Fichier : src/app/features/article/services/translation.service.ts
- La réponse est typée via l’interface `MyMemoryTranslateResponse`.

### 2) Traduction du contenu d’un article (page Article)

- Ajout d’un bloc UI “Traduire l'article” sur la page d’un article.
- L’utilisateur choisit une langue (`fr`, `en`, `es`, `de`) puis déclenche la traduction.
- Implémentation : le body est découpé par paragraphes (`\n\n`) puis traduit séquentiellement.
- Fichiers :
  - src/app/features/article/pages/article/article.component.html
  - src/app/features/article/pages/article/article.component.ts

### 3) Traduction des titres uniquement (liste / preview)

- Sur la liste des articles, ajout d’un sélecteur de langue pour les titres.
- Les cartes “preview” traduisent uniquement le titre (pas le contenu), pour aider l’utilisateur à comprendre le sujet avant d’ouvrir l’article.
- Par défaut, la langue du sélecteur est `en`.
- Le preview utilise :
  - un cache en mémoire par clé `slug|lang`
  - un indicateur de chargement `...`
  - un badge `TRADUIT` quand la traduction est disponible
- Fichiers :
  - src/app/features/article/components/article-list.component.ts
  - src/app/features/article/components/article-preview.component.ts

### 4) Fix CORS / URL rewriting (interceptor)

Nous avons fait une correction de l’interceptor API pour éviter de préfixer les URLs absolues. L'objectif est de ne pas transformer une URL externe en `https://api.realworld.show/apihttps://...`. Grace au fichier : src/app/core/interceptors/api.interceptor.ts

## Détails techniques importants

La logique de traduction titre suppose que le titre original est en anglais (la requête MyMemory utilise `langpair: en|<target>` pour reduire le nombre d'appel à l'api et donc tenter de limité le problème décrit dans la section suivante). Si l’article n’est pas en anglais, la traduction peut être mauvaise.

## Limites de l’API de traduction (ce qui m'a été assez bloquant et pourquoi je ne traduit pas l'entierté des pages)

L’API MyMemory du moins la version publique applique des limites d’usage pouvant dépendre de l’adresse IP. Si beaucoup de requêtes sont envoyées depuis la même IP, la traduction peut ralentir, échouer, ou renvoyer des résultats incomplets. Il faut alors se mettre sous un vpn ou alors opté pour une option payante d'une api de traduction ce qui pourrais être une évolution futur.

## Erreur sign up/sign in

Le projet RealWorld semble avoir une erreur sur leur système de connexion, en particulier pour leur demo angular, que nous avons decider de prendre. N'étant pas demander de corriger un projet mais de rajouter une fonctionnalité nous l'avons, alors, pas réparé.
