if [ “$1” == “prod” ]
then
  echo "Switching to Prod"
  yes | cp -rf environments/prod/config.json src/api/
  yes | cp -rf environments/prod/google-services.json android/app/
  yes | cp -rf environments/prod/GoogleService-Info.plist ios/anchor_point_mobile/
elif [ “$1” == “preprod” ]
then
  echo "Switching to Preprod"
  yes | cp -rf environments/preprod/config.json src/api/
  yes | cp -rf environments/preprod/google-services.json android/app/
  yes | cp -rf environments/preprod/GoogleService-Info.plist ios/anchor_point_mobile/
elif [ “$1” == “dev” ]
then
  echo "Switching to Dev"
  yes | cp -rf environments/dev/config.json src/api/
  yes | cp -rf environments/dev/google-services.json android/app/
  yes | cp -rf environments/dev/GoogleService-Info.plist ios/anchor_point_mobile/
elif [ “$1” == “envs” ]
then
  echo "prod"
  echo "preprod"
  echo "dev"
else
  echo "Run ‘env.sh envs’ to list available environments."
fi