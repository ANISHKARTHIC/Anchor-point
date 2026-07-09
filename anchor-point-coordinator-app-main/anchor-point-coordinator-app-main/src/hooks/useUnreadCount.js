import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect,useRef,useState} from 'react';
import Keys from '../constants/Keys';
import firestore from '@react-native-firebase/firestore';
import config from '../api/config.json';

const useUnreadCount = ()=>{
    const [unReadMsgData,setUnReadMsgData]=useState(null)
    const [loadingCount,setLoadingCount]=useState(true)
    const [currentUser,setCurrentUser]=useState({
        email:"",
        name:""
    })
    const apiToken = useRef(null)
    const unsubscribeUnReadCount = useRef()
    const unReadCollectionName = config.url === 'https://travelbuddy.anchorpoint.in'
  ? 'usersUnreadCounts'
  : 'usersUnreadCounts_dev';
    useEffect(()=>{
         const getUnreadCount=async()=>{
             const userEmail = await AsyncStorage.getItem(Keys.EMAIL)
             const userName = await AsyncStorage.getItem(Keys.NAME)
             apiToken.current = await AsyncStorage.getItem(Keys.TOKEN)
             setCurrentUser({name:userName,email:userEmail})
            //  const usersRef = collection(db, "usersUnreadCounts");
            //  const queryUserUnread = query(
            //    usersRef,
            //    where("userId", "==", userEmail),
            //    where("role", "==", "coordinator"),
            //  );
             unsubscribeUnReadCount.current=firestore().collection(unReadCollectionName).where("userId", "==", userEmail).where("role", "==", "coordinator").onSnapshot(
               (snapshot) => {
                 if (snapshot.empty) {
                    setUnReadMsgData(null);
                    setLoadingCount(false)
                //    console.log("No unread documents found");
                 } else {
                   const docData = snapshot.docs.map((doc) => doc.data());
                   setUnReadMsgData(docData[0]);
                   setLoadingCount(false)
                //    console.log("docData", docData);
                 }
                 
               },
               (err) => {
                 console.log("Getting UnreadCount Error", err);
                 setLoadingCount(false)
               },
             )
            
         }
         getUnreadCount()
         return ()=>{
            if(unsubscribeUnReadCount.current){
                unsubscribeUnReadCount.current()
            }
          }
    },[])
    return {unReadMsgData,loadingCount,currentUser}
}

export default useUnreadCount