# Mémo : Procédure de Mise à Jour (OTA)

Ce document décrit les étapes manuelles à suivre pour envoyer une nouvelle version de Fihirana Jesosy Mpanafaka aux utilisateurs sans qu'ils aient à réinstaller l'application manuellement.

## 1. Préparation (Local)

1.  **Changer la version :** Ouvre `src-tauri/tauri.conf.json` et incrémente la version.
      * *Exemple :* `"version": "1.0.1"`

2. **Tester en local à l'aide d'un appareil connecté :**
    ```bash
    # Pour vérifier les appareils, dans le terminale lancer
    adb devices 

    # Connecter un appareil
    adb connect 192... (activer la mode dévéloppeur sur mobile à l'aide d'un hotpot ou par câble) 
    ```

3.  **Build de l'APK :**
    ```bash
    # Dans android studio (Lancer dans le terminal dans /android-studio/bin)
    sh /opt/android-studio/bin/studio.sh

    npx tauri android build
    ```
    *Le fichier généré se trouve généralement dans :*
    `src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk`

    En cas de BUild erreur, on fait quelques vérifications :
    ```bash
    # 1. Nettoyer les fichiers de build précédents
    cd src-tauri
    rm Cargo.lock
    cargo clean
    cd ..

    # Si on a changé package.json
    rm -rf node_modules
    rm package-lock.json
    npm install

    # 2. Supprimer les schémas qui ont été générés avec les mauvaises versions
    rm -rf src-tauri/gen
    rm -rf src-tauri/target

    # 3. Lancer le build
    npx tauri android init
    npx tauri android build

    en cas de changement mineau on peut faire :
    # Recompiler l\'application
    # Build : 
    npm run tauri android build -- --release

    #Signe à nouveau : (Reprends la commande apksigner).

    # Réinstalle : 
    adb install -r fihirana-final.apk.
    
    ```

-----

## 2. Publication sur GitHub

1.  Va sur le repo : [fihirana-offline](https://www.google.com/search?q=https://github.com/ezdev2/fihirana-offline).
2.  Crée une **Nouvelle Release** (Tags \> Releases \> Create a new release).
3.  Nomme le tag `v1.0.1` (doit correspondre au `tauri.conf.json`).
4.  **Important :** Glisse et dépose le fichier `app-release.apk` dans la zone "Assets".
5.  Publie la Release.

-----

## 3. Mise à jour du fichier `update.json`

Modifie le fichier `update.json` à la racine du projet local avec les nouvelles infos.

### Exemplaire à copier/coller :

```json
{
  "version": "1.0.1",
  "notes": "Ajout de 10 nouveaux chants et amélioration de la recherche.",
  "pub_date": "2026-04-08T15:00:00Z",
  "platforms": {
    "android-aarch64": {
      "url": "https://github.com/ezdev2/fihirana-offline/releases/download/v1.0.1/app-release.apk"
    }
  }
}
```

> **Attention :** Vérifie bien que l'URL dans `url` correspond exactement au nom de la Release et au nom du fichier APK sur GitHub.

-----

## 4. Déploiement Final

### Mettre en place un logo (Icones de l'application)

> npm run tauri icon ./src/assets/logo192.png

Une fois le fichier `update.json` modifié localement :

```bash
git add .
git commit -m "chore: release version 1.0.1"
git push
```

Element fichier env

```bash
TAURI_ANDROID_KEYSTORE_PATH="fihirana.keystore"
TAURI_ANDROID_KEYSTORE_PASSWORD="TON_MOT_DE_PASSE"
TAURI_ANDROID_KEY_ALIAS="fihirana-key"
TAURI_ANDROID_KEY_PASSWORD="TON_MOT_DE_PASSE"
```

## 5. Vérifier si l'APK après build est bien signé
Une fois le build terminé, si on a un doute sur le fait que la signature a bien fonctionné, on peut utiliser cette commande (toujours avec l'outil d'Android Studio) pour vérifier :

```bash
/opt/android-studio/jbr/bin/apksigner verify --print-certs src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk
```

## 6. Signer l'APK
```bash
# Etape 1 : On vérifie
PATH="/opt/android-studio/jbr/bin:$PATH" ~/Android/Sdk/build-tools/35.0.0/apksigner verify --print-certs src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk

# Etape 2 : On signe manuellement
PATH="/opt/android-studio/jbr/bin:$PATH" ~/Android/Sdk/build-tools/35.0.0/apksigner sign \
  --ks fihirana.keystore \
  --ks-key-alias fihirana-key \
  --out fihirana-final.apk \
  src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk

# Etape 3 : On vérifie la signature
PATH="/opt/android-studio/jbr/bin:$PATH" ~/Android/Sdk/build-tools/35.0.0/apksigner verify --print-certs fihirana-final.apk

# Etape 4 (optionnelle) : On change le nom
mv Fihirana_Offline_v1.0.0.apk Fihirana_v1.0.0.apk

```

-----

### Pourquoi ?

L'application installée chez l'utilisateur interroge cette URL :
`https://raw.githubusercontent.com/ezdev2/fihirana-offline/main/update.json`

Dès qu'on fais `git push`, le fichier sur GitHub change, et l'application détecte immédiatement qu'une version `1.0.1` est disponible.

-----

### Rappel technique (Front-end)

Le bouton "Mise à jour" dans le code React appelle cette logique :

1.  `check()` -\> Lit le `update.json` distant.
2.  Compare avec sa version locale.
3.  Si `distant > local` -\> Propose le téléchargement.
4.  `downloadAndInstall()` -\> Télécharge l'APK depuis l'URL indiquée dans le JSON.

-----
