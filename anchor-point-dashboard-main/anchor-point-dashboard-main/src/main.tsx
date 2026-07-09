import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store.ts";
import {
  GOOGLE_MAP_API_KEY,
} from "../src/constants/string.ts";
import {
  LoadScript,
} from "@react-google-maps/api";
import Chat from "./components/Chat.tsx";
const bookingId = "23a261b4-467a-40db-8f6e-df6d4b63404f";
const bookingType = "hotel"
const user  = {
"role": "organizer",
"name": "Admin"
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
      <BrowserRouter>
        <LoadScript
          googleMapsApiKey={GOOGLE_MAP_API_KEY}
          libraries={["places"]}
        >
        <App />
        {/* <Chat bookingId={bookingId} bookingType={bookingType} currentUser={user}/> */}
        </LoadScript>
      </BrowserRouter>
  </Provider>,
);
