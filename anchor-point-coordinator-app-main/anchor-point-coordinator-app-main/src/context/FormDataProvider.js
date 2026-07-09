import React, {createContext, useContext, useReducer} from 'react';

const initialState = {
  guests: [],
};

const FormDataContext = createContext();

const formDataReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_GUEST':
      const {guest, counter, index} = action.payload;
      if (index >= 0 && index < state.guests.length) {
        const updatedGuests = [...state.guests];
        updatedGuests[index] = guest;
        return {...state, guests: updatedGuests};
      } else {
        if (state.guests.length < counter) {
          return {...state, guests: [...state.guests, guest]};
        } else {
          return state;
        }
      }
    case 'CLEAR_FORM_DATA':
      return {...state, guests: []};
    default:
      return state;
  }
};

const FormDataProvider = ({children}) => {
  const [state, dispatch] = useReducer(formDataReducer, initialState);

  const clearFormData = () => {
    dispatch({
      type: 'CLEAR_FORM_DATA',
    });
  };

  return (
    <FormDataContext.Provider value={{state, dispatch, clearFormData}}>
      {children}
    </FormDataContext.Provider>
  );
};

const useFormData = () => {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
};

export {FormDataProvider, useFormData};
