import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import problemReducer from "./problemSlice";
import chatReducer from "./chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    problems: problemReducer,
    chat: chatReducer,
  },
});

export default store;
