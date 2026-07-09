import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  creditNoteInvoice: [
    
  ]
};

const creditNoteInvoiceSlice = createSlice({
    name: "creditNote",
    initialState,
    reducers:{
        setCreditNoteInvoice: (state,action)=>{
            state.creditNoteInvoice = action.payload;
        },
        clearCreditNoteInvoice:(state)=>{
            state.creditNoteInvoice = []
        }
    }
})

export const {
    setCreditNoteInvoice,
    clearCreditNoteInvoice,
} = creditNoteInvoiceSlice.actions;

export default creditNoteInvoiceSlice.reducer;