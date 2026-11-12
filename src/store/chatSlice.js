import { createSlice } from "@reduxjs/toolkit";

// Load cached conversations from localStorage if available
const loadCachedConversations = () => {
  try {
    const raw = localStorage.getItem("dsa_chat_conversations");
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
};

// Persist conversations to localStorage
const persistConversations = (conversations) => {
  try {
    localStorage.setItem("dsa_chat_conversations", JSON.stringify(conversations));
  } catch (_) {}
};

const initialState = {
  conversations: loadCachedConversations(),
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    /**
     * Add a single message to a specific conversation channel (e.g. problemId or "global")
     */
    addChatMessage: (state, action) => {
      const { channelId = "global", message } = action.payload;
      if (!state.conversations[channelId]) {
        state.conversations[channelId] = [];
      }
      state.conversations[channelId].push(message);
      persistConversations(state.conversations);
    },

    /**
     * Set/replace entire message list for a specific channel
     */
    setChatMessages: (state, action) => {
      const { channelId = "global", messages } = action.payload;
      state.conversations[channelId] = messages;
      persistConversations(state.conversations);
    },

    /**
     * Clear messages for a specific conversation channel
     */
    clearChatConversation: (state, action) => {
      const { channelId = "global" } = action.payload;
      delete state.conversations[channelId];
      persistConversations(state.conversations);
    },
  },
});

export const { addChatMessage, setChatMessages, clearChatConversation } =
  chatSlice.actions;

export default chatSlice.reducer;

