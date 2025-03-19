import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../../services/api/firebase";

// Async thunks for social features
export const fetchFriends = createAsyncThunk(
  "social/fetchFriends",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;
      const userDoc = await getDoc(doc(firestore, "users", uid));

      if (!userDoc.exists()) {
        return rejectWithValue("User document not found");
      }

      const friendsIds = userDoc.data().friends || [];
      const friends = [];

      // Get friend data
      for (const friendId of friendsIds) {
        const friendDoc = await getDoc(doc(firestore, "users", friendId));

        if (friendDoc.exists()) {
          friends.push({
            id: friendDoc.id,
            displayName: friendDoc.data().displayName,
            photoURL: friendDoc.data().photoURL,
            stats: friendDoc.data().stats,
          });
        }
      }

      return friends;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFriendRequests = createAsyncThunk(
  "social/fetchFriendRequests",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;

      // Get incoming friend requests
      const incomingRequestsQuery = query(
        collection(firestore, "friendRequests"),
        where("receiverId", "==", uid),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const incomingSnapshot = await getDocs(incomingRequestsQuery);
      const incomingRequests = [];

      for (const doc of incomingSnapshot.docs) {
        const requestData = doc.data();
        const senderDoc = await getDoc(
          doc(firestore, "users", requestData.senderId)
        );

        if (senderDoc.exists()) {
          incomingRequests.push({
            id: doc.id,
            type: "incoming",
            sender: {
              id: senderDoc.id,
              displayName: senderDoc.data().displayName,
              photoURL: senderDoc.data().photoURL,
            },
            createdAt: requestData.createdAt?.toDate() || new Date(),
          });
        }
      }

      // Get outgoing friend requests
      const outgoingRequestsQuery = query(
        collection(firestore, "friendRequests"),
        where("senderId", "==", uid),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const outgoingSnapshot = await getDocs(outgoingRequestsQuery);
      const outgoingRequests = [];

      for (const doc of outgoingSnapshot.docs) {
        const requestData = doc.data();
        const receiverDoc = await getDoc(
          doc(firestore, "users", requestData.receiverId)
        );

        if (receiverDoc.exists()) {
          outgoingRequests.push({
            id: doc.id,
            type: "outgoing",
            receiver: {
              id: receiverDoc.id,
              displayName: receiverDoc.data().displayName,
              photoURL: receiverDoc.data().photoURL,
            },
            createdAt: requestData.createdAt?.toDate() || new Date(),
          });
        }
      }

      return {
        incoming: incomingRequests,
        outgoing: outgoingRequests,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  "social/sendFriendRequest",
  async (receiverId, { getState, rejectWithValue }) => {
    try {
      const { uid, displayName } = getState().auth.user;

      // Check if users are already friends
      const receiverDoc = await getDoc(doc(firestore, "users", receiverId));

      if (!receiverDoc.exists()) {
        return rejectWithValue("User not found");
      }

      if (receiverDoc.data().friends?.includes(uid)) {
        return rejectWithValue("Already friends with this user");
      }

      // Check if request already exists
      const existingRequestQuery = query(
        collection(firestore, "friendRequests"),
        where("senderId", "==", uid),
        where("receiverId", "==", receiverId),
        where("status", "==", "pending")
      );

      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      if (!existingRequestSnapshot.empty) {
        return rejectWithValue("Friend request already sent");
      }

      // Create friend request
      const requestRef = await addDoc(collection(firestore, "friendRequests"), {
        senderId: uid,
        senderName: displayName,
        receiverId,
        receiverName: receiverDoc.data().displayName,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      return {
        id: requestRef.id,
        type: "outgoing",
        receiver: {
          id: receiverId,
          displayName: receiverDoc.data().displayName,
          photoURL: receiverDoc.data().photoURL,
        },
        createdAt: new Date(),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const respondToFriendRequest = createAsyncThunk(
  "social/respondToFriendRequest",
  async ({ requestId, accept }, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;

      // Get request details
      const requestDoc = await getDoc(
        doc(firestore, "friendRequests", requestId)
      );

      if (!requestDoc.exists()) {
        return rejectWithValue("Friend request not found");
      }

      const requestData = requestDoc.data();

      // Verify this user is the receiver
      if (requestData.receiverId !== uid) {
        return rejectWithValue("Not authorized to respond to this request");
      }

      // Update request status
      await updateDoc(doc(firestore, "friendRequests", requestId), {
        status: accept ? "accepted" : "rejected",
        respondedAt: serverTimestamp(),
      });

      if (accept) {
        // Add each user to the other's friends list
        await updateDoc(doc(firestore, "users", uid), {
          friends: arrayUnion(requestData.senderId),
        });

        await updateDoc(doc(firestore, "users", requestData.senderId), {
          friends: arrayUnion(uid),
        });

        // Get sender data for UI update
        const senderDoc = await getDoc(
          doc(firestore, "users", requestData.senderId)
        );

        return {
          requestId,
          accepted: true,
          friend: {
            id: senderDoc.id,
            displayName: senderDoc.data().displayName,
            photoURL: senderDoc.data().photoURL,
            stats: senderDoc.data().stats,
          },
        };
      }

      return {
        requestId,
        accepted: false,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeFriend = createAsyncThunk(
  "social/removeFriend",
  async (friendId, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;

      // Remove from each user's friends list
      await updateDoc(doc(firestore, "users", uid), {
        friends: arrayRemove(friendId),
      });

      await updateDoc(doc(firestore, "users", friendId), {
        friends: arrayRemove(uid),
      });

      return friendId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchChallenges = createAsyncThunk(
  "social/fetchChallenges",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;

      // Get challenges where user is a participant
      const challengesQuery = query(
        collection(firestore, "challenges"),
        where("participants", "array-contains", {
          userId: uid,
          progress: 0,
          completed: false,
        }),
        orderBy("startDate", "desc")
      );

      const querySnapshot = await getDocs(challengesQuery);
      const challenges = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        challenges.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || data.startDate,
          endDate: data.endDate?.toDate() || data.endDate,
        });
      });

      return challenges;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Social slice
const socialSlice = createSlice({
  name: "social",
  initialState: {
    friends: [],
    requests: {
      incoming: [],
      outgoing: [],
    },
    challenges: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch friends
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch friend requests
      .addCase(fetchFriendRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchFriendRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Send friend request
      .addCase(sendFriendRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests.outgoing.push(action.payload);
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Respond to friend request
      .addCase(respondToFriendRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToFriendRequest.fulfilled, (state, action) => {
        state.loading = false;

        // Remove the request from incoming requests
        state.requests.incoming = state.requests.incoming.filter(
          (request) => request.id !== action.payload.requestId
        );

        // If accepted, add to friends list
        if (action.payload.accepted) {
          state.friends.push(action.payload.friend);
        }
      })
      .addCase(respondToFriendRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove friend
      .addCase(removeFriend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = state.friends.filter(
          (friend) => friend.id !== action.payload
        );
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch challenges
      .addCase(fetchChallenges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChallenges.fulfilled, (state, action) => {
        state.loading = false;
        state.challenges = action.payload;
      })
      .addCase(fetchChallenges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = socialSlice.actions;
export default socialSlice.reducer;
