import { initializeApp } from "firebase/app";
import { getToken, getMessaging, onMessage } from "firebase/messaging";
import { BASE_URL } from "./constants/string";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithCustomToken, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD_gum-0sNnK64pcYDY_pKD74gI6R6jEd8",
  authDomain: "anchorpoint-8ac26.firebaseapp.com",
  projectId: "anchorpoint-8ac26",
  storageBucket: "anchorpoint-8ac26.appspot.com",
  messagingSenderId: "239873402377",
  appId: "1:239873402377:web:e8a944ae74e43f110bbad8",
};

export const firebaseApp = initializeApp(firebaseConfig);

const messaging = getMessaging(firebaseApp);

const db = getFirestore(firebaseApp);

const auth = getAuth();

export const requestPermission = (setTokenFound) => {
  return getToken(messaging, {
    vapidKey:
      "BMbm8XR_RvHsPKk1hkLoZEq9aRFHa4A6FW5kI2O2iFp0xR3CTBXcYVF-8oNie8obdKmO32d8-HMcASgbERcLNa8",
  })
    .then((currentToken) => {
      if (currentToken) {
        if (localStorage.getItem("fcmToken") === null) {
          localStorage.setItem("fcmToken", currentToken);
          setFcmToken();
        } else {
          const expiredToken = localStorage.getItem("fcmToken");
          if (currentToken != expiredToken) {
            localStorage.setItem("fcmToken", currentToken);
            setFcmToken(expiredToken);
          }
        }
        setTokenFound(true);
        return currentToken;
      } else {
        console.log(
          "No registration token available. Request permission to generate one.",
        );
        setTokenFound(false);
      }
    })
    .catch((err) => {
      console.error("An error occurred while retrieving token. ", err);
    });
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

const setFcmToken = async (expiredToken = "") => {
  try {
    const requestData = {
      fcm_token: localStorage.getItem("fcmToken"),
      device_type: "web",
      expired_fcm_token: expiredToken,
    };
    const response = await fetch(`${BASE_URL}/devices/fcm-token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error("Netwwork response was not ok");
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
};

export const handleFirebaseAuth=(customToken)=>{
  
  return new Promise((resolve, reject) => {
    signInWithCustomToken(auth,customToken)
    .then((userCredential) => {
      const user = userCredential.user;
      resolve(userCredential)
    })
    .catch((error) => {
        reject(error);
      });
  });
}

export const handleFireBaseSignout=()=>{
  return new Promise((resolve,reject)=>{
    signOut(auth).then(() => {
      resolve(true)
    }).catch((error) => {
       reject(error)
    });
  })
}

export default db;


