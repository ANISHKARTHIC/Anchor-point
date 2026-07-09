import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from 'react';
import {FormDataProvider} from '../context/FormDataProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Keys from '../constants/Keys';

const AppContext = createContext();

export const initialHotelBookingData = {
  city: [],
  trip_type: 'Official',
  no_of_adults: 1,
  no_of_children: 0,
  no_of_rooms: 1,
  room_type: [],
  check_in: '',
  check_out: '',
  cost_centre: [],
  pickup: {
    isPickup: false,
    flight: '',
    time: '',
  },
  drop: {
    isDrop: false,
    flight: '',
    time: '',
  },
};

export const AppProvider = ({children}) => {
  const [mode, setMode] = useState('');
  const [counter, setCounter] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingEscalation, setIsBookingEscalation] = useState('False');
  const [cabtype, setCabType] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [hotelBookingDetails, setHotelBookingDetails] = useState(
    initialHotelBookingData,
  );
  const [EULA_Agreed, setEULA_Agreed] = useState(true);

  useEffect(() => {
    getEULAStatus();
  }, []);

  const getEULAStatus = async () => {
    const status = await AsyncStorage.getItem(Keys.AGREE_EULA);
    if (status == Keys.EULA_STATUS) {
      setEULA_Agreed(true);
    } else {
      setEULA_Agreed(false);
    }
  };

  const contextValue = useMemo(
    () => ({
      counter,
      setCounter,
      selectedDate,
      setSelectedDate,
      selectedTime,
      setSelectedTime,
      mode,
      setMode,
      cabtype,
      setCabType,
      costCenter,
      setCostCenter,
      bookingEscalation,
      setIsBookingEscalation,
      EULA_Agreed,
      setEULA_Agreed,
      hotelBookingDetails,
      setHotelBookingDetails,
      initialHotelBookingData,
    }),
    [
      counter,
      setCounter,
      selectedDate,
      setSelectedDate,
      selectedTime,
      setSelectedTime,
      mode,
      setMode,
      cabtype,
      setCabType,
      costCenter,
      setCostCenter,
      bookingEscalation,
      setIsBookingEscalation,
      EULA_Agreed,
      setEULA_Agreed,
      costCenter,
      hotelBookingDetails,
      setHotelBookingDetails,
      initialHotelBookingData,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>
      <FormDataProvider>{children}</FormDataProvider>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
