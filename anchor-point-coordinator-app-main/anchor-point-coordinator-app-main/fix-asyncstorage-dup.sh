#!/usr/bin/env bash
set -euo pipefail

echo "===> 1) Make backup dir"
BACKUP_DIR="$PWD/tmp_asyncstorage_backup_$(date +%s)"
mkdir -p "$BACKUP_DIR"
echo "Backup dir: $BACKUP_DIR"

echo "===> 2) Find files that declare the duplicate class"
grep -RIl --exclude-dir=android/build --exclude-dir=node_modules/.bin "class NativeAsyncStorageModuleSpec" . || true

echo "===> 3) Back up & move conflicting source files (but keep generated files)"
grep -RIl "class NativeAsyncStorageModuleSpec" . 2>/dev/null | while IFS= read -r f; do
  if [[ "$f" == *"/android/build/generated/"* ]] || [[ "$f" == *"/build/generated/"* ]]; then
    echo "  (keep generated) $f"
  else
    echo "  backing up & removing $f -> $BACKUP_DIR/"
    mkdir -p "$(dirname "$BACKUP_DIR/$f")"
    git mv -f "$f" "$BACKUP_DIR/$f" 2>/dev/null || mv -f "$f" "$BACKUP_DIR/$f"
  fi
done

echo "===> 4) Explicitly remove common old manual files if present (safe to run)"
for path in \
  "node_modules/@react-native-async-storage/async-storage/android/src/main/java/com/reactnativecommunity/asyncstorage/AsyncStorageModule.java" \
  "node_modules/@react-native-async-storage/async-storage/android/src/javaPackage/java/com/reactnativecommunity/asyncstorage/AsyncStoragePackage.java" \
  "node_modules/@react-native-async-storage/async-storage/android/src/main/java/com/reactnativecommunity/asyncstorage/NativeAsyncStorageModuleSpec.java"
do
  if [ -f "$path" ]; then
    echo "  backing up: $path -> $BACKUP_DIR/$(basename "$path")"
    mkdir -p "$(dirname "$BACKUP_DIR/$path")"
    git mv -f "$path" "$BACKUP_DIR/$path" 2>/dev/null || mv -f "$path" "$BACKUP_DIR/$path"
  fi
done

echo "===> 5) Remove generated build folders (safe removal)"
rm -rf node_modules/@react-native-async-storage/async-storage/android/build/generated/
rm -rf android/app/build/generated/
rm -rf android/build/

echo "===> 6) (Optional) reinstall node_modules if you want a fresh state"
# rm -rf node_modules && yarn install

echo "===> 7) Clean Gradle and Gradle caches used by the project"
cd android
./gradlew clean --no-daemon
./gradlew cleanBuildCache --no-daemon || true
cd ..

echo "===> 8) Verify there are no remaining Java sources with the duplicate class"
grep -RIl "class NativeAsyncStorageModuleSpec" . || echo "  no matches found (good)"

echo "===> 9) Build release via gradle assembleRelease"
cd android
./gradlew assembleRelease --no-daemon --stacktrace

echo "===> DONE. Backed-up files are in: $BACKUP_DIR"
