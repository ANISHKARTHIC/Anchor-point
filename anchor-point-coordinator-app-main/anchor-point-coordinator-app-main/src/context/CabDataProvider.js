import React, {createContext, useContext, useState, useMemo} from 'react';
import {FormDataProvider} from '../context/FormDataProvider';

const CabContext = createContext();

const initialGuests = [];

export const initialCabBookingData = {
  booking: {
    bid: '',
    travel_mode: 'standard',
    cab_type: '',
    cost_centre: {
      code: '',
      gstin_no: '',
      id: null,
    },
    pickup_date: [],
    pickup_time: '',
    status: 'pending',
    type: 'Cab',
    po_number: '',
    guests: initialGuests,
  },
};

export const CabDataProvider = ({children}) => {
  const [cabBookingDetails, setCabBookingDetails] = useState(
    initialCabBookingData,
  );

  const [deletedWaypoints, setDeletedWaypoints] = useState({});
  const [deletedGuestsData, setDeletedGuestsData] = useState([]);

  const addGuest = newGuest => {
    setCabBookingDetails(prevDetails => ({
      ...prevDetails,
      booking: {
        ...prevDetails.booking,
        guests: [...prevDetails.booking.guests, newGuest],
      },
    }));
  };

  const updateGuest = (index, updatedDetails) => {
    setCabBookingDetails(prevDetails => ({
      ...prevDetails,
      booking: {
        ...prevDetails.booking,
        guests: prevDetails.booking.guests.map((guest, i) =>
          i === index ? {...guest, ...updatedDetails} : guest,
        ),
      },
    }));
  };

  const updateBookingDetails = updatedDetails => {
    setCabBookingDetails(prevDetails => ({
      ...prevDetails,
      booking: {
        ...prevDetails.booking,
        ...updatedDetails,
      },
    }));
  };

  const addDeletedWaypoints = (bookingLogId, waypoints) => {
    console.log('Before Update:', deletedWaypoints);
    setDeletedWaypoints(prev => {
      const updated = {
        ...prev,
        [bookingLogId]: (prev[bookingLogId] || []).concat(waypoints),
      };
      console.log('After Update:', updated);
      return updated;
    });
  };

  const addDeletedGuest = guest => {
    setDeletedGuestsData(prev => [...prev, guest]);
  };

  const eraseAllBookingDetails = () => {
    setCabBookingDetails({
      ...initialCabBookingData,
      booking: {
        ...initialCabBookingData.booking,
        pickup_date: [],
      },
    });
    setDeletedWaypoints([]);
    setDeletedGuestsData([]);
  };

  const contextValue = useMemo(
    () => ({
      cabBookingDetails,
      setCabBookingDetails,
      deletedWaypoints,
      setDeletedWaypoints,
      addDeletedWaypoints,
      deletedGuestsData,
      setDeletedGuestsData,
      addDeletedGuest,
      addGuest,
      updateGuest,
      updateBookingDetails,
      eraseAllBookingDetails,
    }),
    [cabBookingDetails, deletedWaypoints, deletedGuestsData],
  );

  return (
    <CabContext.Provider value={contextValue}>
      <FormDataProvider>{children}</FormDataProvider>
    </CabContext.Provider>
  );
};

export const useCabContext = () => {
  const context = useContext(CabContext);
  if (!context) {
    throw new Error('useCabContext must be used within a CabDataProvider');
  }
  return context;
};
