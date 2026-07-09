import auth from '@react-native-firebase/auth';

export const handleFireBaseAuth = token => {
  return new Promise((resolve, reject) => {
    auth()
      .signInWithCustomToken(token)
      .then(user => {
        resolve(user);
      })
      .catch(err => reject(err));
  });
};

export const handleFireBaseSignout = () => {
  return new Promise((resolve, reject) => {
    auth()
      .signOut()
      .then(() => {
        resolve(true);
        console.log('Account Screen User signed out!');
      })
      .catch(err => {
        reject(err);
      });
  });
};
