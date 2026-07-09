
import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  where,
} from "firebase/firestore";
import moment from "moment";
import { Box } from "@mui/system";
import { Divider, Paper, Typography } from "@mui/material";
import { BASE_URL } from "../constants/string";
import { getCollectionName } from "../utils/utils";

const PAGE_SIZE = 10;

const Chat = ({ bookingId, bookingType, currentUser, bookingData }: any) => {
  const db = getFirestore();
  const { coordinator } = bookingData;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState(""); // Input state
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [bookingMsgData, setBookingMsgData] = useState<any>([]);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const isAtBottom = useRef(true);
  const firstFetch = useRef(false);
  // Fetch initial messages
  const fetchMessages = async (isPaginating = false) => {
    setIsLoading(true);
    const messagesRef = collection(db, getCollectionName("bookings"), bookingId, "messages");
    let q = query(
      messagesRef,
      orderBy("createdDate", "desc"),
      limit(PAGE_SIZE),
    );

    if (isPaginating && lastVisible) {
      q = query(
        messagesRef,
        orderBy("createdDate", "desc"),
        startAfter(lastVisible),
        limit(PAGE_SIZE),
      );
    }

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMessages((prev) =>
        isPaginating
          ? [...fetchedMessages.reverse(), ...prev]
          : fetchedMessages.reverse(),
      );
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } else {
      setHasMore(false);
    }
    if (firstFetch.current) {
      setTimeout(() => {
        scrollToBottom(true);
        firstFetch.current = false;
      }, 100);
    }
    setIsLoading(false);
  };

  // Listen for new messages in real-time
  useEffect(() => {
    const messagesRef = collection(db, getCollectionName("bookings"), bookingId, "messages");
    const q = query(messagesRef, orderBy("createdDate", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (newMessages.length > 0 && !isAtBottom.current) {
        if (newMessages[0].userId != currentUser.email) {
          setNewMessageNotification(true);
        }
        setMessages((prev) => [...prev, ...newMessages]);
      } else if (newMessages.length > 0 && isAtBottom.current) {
        setMessages((prev) => [...prev, ...newMessages]);
        scrollToBottom();
      }
    });

    return unsubscribe;
  }, []);
  useEffect(() => {
    let unSubscribeMsgRef: any = null;
    const getChatMessages = async () => {
      const bookingDocRef = doc(db, getCollectionName("bookings"), bookingId);
      try {
        const snapshot = await getDoc(bookingDocRef);
        if (snapshot.exists()) {
          let bookingMsgData = snapshot.data();
          setBookingMsgData(bookingMsgData);
          firstFetch.current = true;
          fetchMessages()
        } else {
          console.log("Bookings Document not exists");
        }
      } catch (err) {
        console.error("Error in fetching booking document: ", err);
      }
    };
    getChatMessages();
  }, []);
  // Load older messages when scrolling to the top
  const handleScroll = () => {
    if (containerRef.current.scrollTop === 0 && hasMore && !isLoading) {
      fetchMessages(true);
    }

    const container = containerRef.current;
    const isUserAtBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 50;
    isAtBottom.current = isUserAtBottom;
  };

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
    isAtBottom.current = true;
    setNewMessageNotification(false);
  };
  useEffect(() => {
    updateUserUnreadCount();
  }, []);
  const updateUserUnreadCount = async () => {
    try {
      const usersRef = collection(db, getCollectionName("usersUnreadCounts"));
      let queryEmail =
        currentUser.role == "coordinator"
          ? currentUser.email
          : "admin@gmail.com";
      let queryRole =
        currentUser.role == "coordinator" ? "coordinator" : "organizer";
      const unreadCountData = {
        cabbookings: {},
        hotelbookings: {},
        role: queryRole,
        totalUnreadCount: 0,
        userId: queryEmail,
        createdDate: new Date(),
        updatedDate: new Date(),
      };
      const q = query(
        usersRef,
        where("userId", "==", queryEmail),
        where("role", "==", queryRole),
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        const docData = querySnapshot.docs[0].data();
        if (bookingType === "cab") {
          unreadCountData["cabbookings"] = {
            ...docData["cabbookings"],
            [bookingId]: 0,
          };
          unreadCountData["hotelbookings"]={
            ...docData["hotelbookings"]
          }
          if(docData["cabbookings"][bookingId]!=null){
            unreadCountData["totalUnreadCount"] =  docData["totalUnreadCount"]>0?
            docData["totalUnreadCount"] - docData["cabbookings"][bookingId]:0;
          }
          else{
            unreadCountData["totalUnreadCount"]= docData["totalUnreadCount"]
          }
          
        } else {
          unreadCountData["hotelbookings"] = {
            ...docData["hotelbookings"],
            [bookingId]: 0,
          };
          unreadCountData["cabbookings"]={
            ...docData["cabbookings"]
          }
          if(docData["hotelbookings"][bookingId]!=null){
            unreadCountData["totalUnreadCount"] = docData["totalUnreadCount"]>0?
            docData["totalUnreadCount"] - docData["hotelbookings"][bookingId]:0;
          }
          else{
            unreadCountData["totalUnreadCount"]= docData["totalUnreadCount"]
          }
          
        }

        await updateDoc(docRef, unreadCountData);
      }
    } catch (err) {
      console.error("Error in updating user unread count", err);
    }
  };

  // Send a message

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;
    const messageData = {
      createdDate: new Date(),
      message: inputMessage,
      readStatus: false,
      type: "text",
      userId: currentUser.email,
    };
    const bookingsMsg = {
      bookingType: bookingType,
      createdDate: new Date(),
      updatedDate: new Date(),
      users: {
        [currentUser.email]: {
          name: currentUser.name,
          role: currentUser.role,
        },
      },
    };
    const bookingsRef = doc(db, getCollectionName("bookings"), bookingId);
    const messagesRef = collection(db, getCollectionName("bookings"), bookingId, "messages");
    try {
      const querySnapshot = await getDoc(bookingsRef);
      if (querySnapshot.exists()) {
        const docuData = querySnapshot.data();
        let tempUsers = {
          ...docuData?.users,
          [currentUser.email]: {
            name: currentUser.name,
            role: currentUser.role,
          },
        };
        let tempBookingsMsg = {
          ...docuData,
          updatedDate: new Date(),
          users: {...tempUsers},
        };
        await updateDoc(bookingsRef, tempBookingsMsg);
        await addDoc(messagesRef, messageData);
      } else {
        delete bookingsMsg["updatedDate"];
        await setDoc(bookingsRef, bookingsMsg);
        await addDoc(messagesRef, messageData);
      }
    } catch (err) {
      console.error("Send Message Error", err);
    } finally {
      updateUnReadCount();
      sendNotification(inputMessage)
      setInputMessage("");
    }
  };
  const sendNotification=async(text: string)=>{
    var tempData={
      "booking_id": bookingId,
      "booking_type": bookingType,
      "message": text,
      "notification_type":"chat",
      "recipient": {
        "email":currentUser.role == "coordinator" ?bookingData?.organizer?.email : coordinator.email,
        "role": currentUser.role == "coordinator" ?"organizer":"coordinator"
      }
  }
    try{
      const response = await fetch(`${BASE_URL}/send-push-notification`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("userToken"),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body:JSON.stringify(tempData)
      });
      const data = await response.json();
    }
    catch(err){
      console.error("sendNotification Err==>",err)
    }
   
  }
  const updateUnReadCount = async () => {
    const { name, email } = coordinator;
    try {
      const usersRef = collection(db, getCollectionName("usersUnreadCounts"));
      let queryEmail =
        currentUser.role == "coordinator" ? "admin@gmail.com" : email;
      let queryRole =
        currentUser.role == "coordinator" ? "organizer" : "coordinator";
      const q = query(
        usersRef,
        where("userId", "==", queryEmail),
        where("role", "==", queryRole),
      );
      const querySnapshot = await getDocs(q);
      const unreadCountData = {
        cabbookings: {},
        hotelbookings: {},
        role: queryRole,
        totalUnreadCount: 1,
        userId: queryEmail,
        createdDate: new Date(),
        updatedDate: new Date(),
      };
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        const docData = querySnapshot.docs[0].data();
        console.log("docData==>",docData["hotelbookings"][bookingId])
        if (bookingType === "cab") {
          unreadCountData["cabbookings"] = {
            ...docData["cabbookings"],
            [bookingId]:docData["cabbookings"][bookingId]!=null?docData["cabbookings"][bookingId] + 1:1,
          };
          unreadCountData["hotelbookings"] = {
            ...docData["hotelbookings"],
          };
        } else {
          unreadCountData["hotelbookings"] = {
            ...docData["hotelbookings"],
            [bookingId]:docData["hotelbookings"][bookingId]!=null? docData["hotelbookings"][bookingId] + 1:1,
          };
          unreadCountData["cabbookings"] = {
            ...docData["cabbookings"],
          };
        }
        unreadCountData["totalUnreadCount"] = docData.totalUnreadCount + 1;
        delete unreadCountData["createdDate"];
        await updateDoc(docRef, unreadCountData);
      } else {
        if (bookingType === "cab") {
          unreadCountData["cabbookings"] = { [bookingId]: 1 };
        } else {
          unreadCountData["hotelbookings"] = { [bookingId]: 1 };
        }
        delete unreadCountData["updatedDate"];
        await addDoc(usersRef, unreadCountData);
      }
    } catch (err) {
      console.error("Update Unread Count Error", err);
    }
  };
  const renderChatMessage = () => {
    const groupedMessages = messages.reduce((acc, item): any => {
      const timestampInMilliseconds =
        item.createdDate.seconds * 1000 +
        Math.floor(item.createdDate.nanoseconds / 1e6);
      const formattedDate = moment(timestampInMilliseconds).format(
        "YYYY-MM-DD HH:mm:ss",
      );
      let groupKey = moment(formattedDate).format("DD-MM-YYYY");
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push({ ...item, formattedDate: formattedDate });
      return acc;
    }, {});
    return (
      <>
        {Object.keys(groupedMessages).map((date) => (
          <Box key={date} sx={{ marginBottom: 2 }}>
            {/* Date Separator */}
            <Box
              sx={{
                textAlign: "center",
                marginY: 1,
                position: "relative",
                zIndex: 1,
              }}
            >
              <Divider>
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: "#e5ddd5",
                    paddingX: 1,
                    color: "#555",
                  }}
                >
                  {moment(moment(date, "DD-MM-YYYY")).calendar(null, {
                    sameDay: "[Today]",
                    lastDay: "[Yesterday]",
                    lastWeek: "dddd",
                    sameElse: "MMMM D, YYYY",
                  })}
                </Typography>
              </Divider>
            </Box>

            {/* Messages for the given date */}
            {groupedMessages[date].map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  justifyContent:
                    msg.userId === currentUser.email
                      ? "flex-end"
                      : "flex-start",
                  marginBottom: 1.5,
                }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    padding: "10px 15px",
                    maxWidth: "70%",
                    bgcolor:
                      msg.userId === currentUser.email ? "#DCF8C6" : "#FFF",
                    borderRadius:
                      msg.userId === currentUser.email
                        ? "10px 0 10px 10px"
                        : "0 10px 10px 10px",
                    boxShadow: "0 2px 3px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {msg.userId != currentUser.email && (bookingMsgData!=null&&bookingMsgData?.users&&bookingMsgData?.users[msg.userId]!=null) && (
                    <Typography
                      display={"inline"}
                      sx={{ color: "lightgray" }}
                      variant={"caption"}
                    >{`${bookingMsgData.users[msg.userId]
                      ?.name} : ${bookingMsgData.users[msg.userId]
                      ?.role}`}</Typography>
                  )}
                  <Typography
                    variant="body1"
                    sx={{ wordBreak: "break-word", fontSize: "18px" }}
                  >
                    {msg.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      fontSize: "10px",
                      color: "#888",
                      textAlign: "right",
                    }}
                  >
                    {moment(msg.formattedDate).format("h:mm A")}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        ))}
      </>
    );
    // return(
    //   messages.map((msg) => (
    //     <div
    //       key={msg.id}
    //       style={{
    //         ...styles.message,
    //       }}
    //     >
    //       {/* <strong>{bookingMsgData?.users[msg.userId]?bookingMsgData?.users[msg.userId]?.name+` (${bookingMsgData?.users[msg.userId]?.role})` :""}</strong> */}
    //       <p style={{...{width:"100%"},...(msg.userId === currentUser.email
    //           ? styles.sentMessage
    //           : styles.receivedMessage)}}>{msg.message}</p>
    //       <small>
    //         {msg.createdDate?.seconds
    //           ? new Date(msg.createdDate.seconds * 1000).toLocaleTimeString()
    //           : "Sending..."}
    //       </small>
    //     </div>
    //   ))
    // )
  };
  return (
    <div style={styles.container}>
      <div
        style={styles.messageList}
        onScroll={handleScroll}
        ref={containerRef}
      >
        {isLoading && <p>Loading messages...</p>}
        {messages.length > 0 ? (
          renderChatMessage()
        ) : (
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            No Conversations Found
          </div>
        )}
        <div ref={messagesEndRef}></div>
        {newMessageNotification && (
          <div style={styles.newMessageNotification} onClick={scrollToBottom}>
            New message. Click to see.
          </div>
        )}
      </div>
      {/* <form onSubmit={sendMessage}> */}
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.sendButton}>
          Send
        </button>
      </div>
      {/* </form> */}
    </div>
  );
};

// CSS-in-JS styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "600px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    overflow: "hidden",
  },
  messageList: {
    flex: 1,
    overflowY: "scroll",
    padding: "10px",
    backgroundColor: "#f5f5f5",
    flexDirection: "column-reverse",
  },
  message: {
    margin: "10px 0",
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "70%",
  },
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#daf8e3",
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e3e3e3",
  },
  inputContainer: {
    display: "flex",
    padding: "10px",
    backgroundColor: "#fff",
    borderTop: "1px solid #ccc",
    flexDirection: "row",
  },
  input: {
    flex: 1,
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  sendButton: {
    marginLeft: "10px",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  sendButtonHover: {
    backgroundColor: "#0056b3",
  },
  newMessageNotification: {
    position: "sticky",
    bottom: "10px",
    backgroundColor: "#007bff",
    color: "white",
    textAlign: "center",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default Chat;
