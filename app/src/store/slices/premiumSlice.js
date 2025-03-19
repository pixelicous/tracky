import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../../services/api/firebase";
import Purchases from "react-native-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Initialize RevenueCat
export const initializeRevenueCat = createAsyncThunk(
  "premium/initializeRevenueCat",
  async (_, { rejectWithValue }) => {
    try {
      const apiKey = Purchases.isConfigured
        ? null
        : process.env.REVENUECAT_API_KEY;

      if (apiKey) {
        await Purchases.configure({ apiKey });
      }

      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch subscription offerings
export const fetchSubscriptionOfferings = createAsyncThunk(
  "premium/fetchSubscriptionOfferings",
  async (_, { rejectWithValue }) => {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch user subscription status
export const fetchUserSubscription = createAsyncThunk(
  "premium/fetchUserSubscription",
  async (_, { getState, rejectWithValue }) => {
    try {
      // Try to get from RevenueCat first
      const purchaserInfo = await Purchases.getPurchaserInfo();
      const entitlements = purchaserInfo.entitlements.active;

      // Check if user has premium entitlement
      if (entitlements.premium) {
        const { uid } = getState().auth.user;

        // Update subscription status in Firestore
        const userDocRef = doc(firestore, "users", uid);
        await updateDoc(userDocRef, {
          "subscription.tier": "premium",
          "subscription.expiryDate": new Date(entitlements.premium.expiresDate),
          "subscription.platform": entitlements.premium.store,
          updatedAt: serverTimestamp(),
        });

        return {
          isSubscribed: true,
          tier: "premium",
          expiryDate: entitlements.premium.expiresDate,
          platform: entitlements.premium.store,
        };
      }

      // If not found in RevenueCat, check Firestore as backup
      const { uid } = getState().auth.user;
      const userDocRef = doc(firestore, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const { subscription } = userDoc.data();

        if (subscription && subscription.tier === "premium") {
          // Verify subscription is not expired
          const expiryDate =
            subscription.expiryDate?.toDate() || subscription.expiryDate;

          if (expiryDate && new Date(expiryDate) > new Date()) {
            return {
              isSubscribed: true,
              tier: subscription.tier,
              expiryDate: expiryDate,
              platform: subscription.platform,
            };
          }
        }
      }

      return {
        isSubscribed: false,
        tier: "free",
        expiryDate: null,
        platform: null,
      };
    } catch (error) {
      // If there's an error, check local storage as fallback
      try {
        const { uid } = getState().auth.user;
        const cachedSubscription = await AsyncStorage.getItem(
          `subscription_${uid}`
        );

        if (cachedSubscription) {
          return JSON.parse(cachedSubscription);
        }
      } catch (storageError) {
        console.error("Error retrieving cached subscription:", storageError);
      }

      return rejectWithValue(error.message);
    }
  }
);

// Purchase subscription
export const purchaseSubscription = createAsyncThunk(
  "premium/purchaseSubscription",
  async (packageToPurchase, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;

      // Purchase package
      const purchaserInfo = await Purchases.purchasePackage(packageToPurchase);
      const entitlements = purchaserInfo.entitlements.active;

      if (entitlements.premium) {
        // Record transaction in Firestore
        await addDoc(collection(firestore, "transactions"), {
          userId: uid,
          type: "subscription",
          productId: packageToPurchase.product.identifier,
          amount: packageToPurchase.product.price,
          currency: packageToPurchase.product.currencyCode,
          platform: packageToPurchase.product.store,
          status: "completed",
          createdAt: serverTimestamp(),
          receipt: {
            purchaseDate: new Date().toISOString(),
            expiryDate: entitlements.premium.expiresDate,
          },
        });

        // Update user subscription status in Firestore
        const userDocRef = doc(firestore, "users", uid);
        await updateDoc(userDocRef, {
          "subscription.tier": "premium",
          "subscription.expiryDate": new Date(entitlements.premium.expiresDate),
          "subscription.platform": entitlements.premium.store,
          updatedAt: serverTimestamp(),
        });

        // Save subscription status to AsyncStorage as backup
        const subscriptionData = {
          isSubscribed: true,
          tier: "premium",
          expiryDate: entitlements.premium.expiresDate,
          platform: entitlements.premium.store,
        };

        await AsyncStorage.setItem(
          `subscription_${uid}`,
          JSON.stringify(subscriptionData)
        );

        return subscriptionData;
      }

      return rejectWithValue("Subscription purchase failed");
    } catch (error) {
      if (error.userCancelled) {
        return rejectWithValue("Purchase cancelled");
      }
      return rejectWithValue(error.message);
    }
  }
);

// Restore purchases
export const restorePurchases = createAsyncThunk(
  "premium/restorePurchases",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;

      // Restore purchases from RevenueCat
      const purchaserInfo = await Purchases.restorePurchases();
      const entitlements = purchaserInfo.entitlements.active;

      if (entitlements.premium) {
        // Update user subscription status in Firestore
        const userDocRef = doc(firestore, "users", uid);
        await updateDoc(userDocRef, {
          "subscription.tier": "premium",
          "subscription.expiryDate": new Date(entitlements.premium.expiresDate),
          "subscription.platform": entitlements.premium.store,
          updatedAt: serverTimestamp(),
        });

        return {
          isSubscribed: true,
          tier: "premium",
          expiryDate: entitlements.premium.expiresDate,
          platform: entitlements.premium.store,
        };
      }

      return {
        isSubscribed: false,
        tier: "free",
        expiryDate: null,
        platform: null,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch available store items (one-time purchases)
export const fetchStoreItems = createAsyncThunk(
  "premium/fetchStoreItems",
  async (_, { rejectWithValue }) => {
    try {
      // Get items from Firestore
      const itemsQuery = query(
        collection(firestore, "storeItems"),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(itemsQuery);
      const items = [];

      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return items;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Purchase store item
export const purchaseStoreItem = createAsyncThunk(
  "premium/purchaseStoreItem",
  async (itemId, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;
      const { availableItems } = getState().premium;

      // Find item in available items
      const item = availableItems.find((i) => i.id === itemId);

      if (!item) {
        return rejectWithValue("Item not found");
      }

      // Check if user has enough coins/credits
      const userDocRef = doc(firestore, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return rejectWithValue("User not found");
      }

      const userData = userDoc.data();

      if (userData.stats.xpPoints < item.price) {
        return rejectWithValue("Not enough XP points");
      }

      // Update user inventory
      let inventoryUpdate = {};

      if (item.type === "avatar") {
        inventoryUpdate = {
          "inventory.avatars": [
            ...(userData.inventory?.avatars || []),
            item.itemId,
          ],
        };
      } else if (item.type === "theme") {
        inventoryUpdate = {
          "inventory.themes": [
            ...(userData.inventory?.themes || []),
            item.itemId,
          ],
        };
      } else if (item.type === "booster") {
        inventoryUpdate = {
          "inventory.boosters": [
            ...(userData.inventory?.boosters || []),
            {
              id: item.itemId,
              purchasedAt: new Date().toISOString(),
              used: false,
            },
          ],
        };
      }

      // Deduct XP points and update inventory
      await updateDoc(userDocRef, {
        "stats.xpPoints": userData.stats.xpPoints - item.price,
        ...inventoryUpdate,
        updatedAt: serverTimestamp(),
      });

      // Record transaction
      await addDoc(collection(firestore, "transactions"), {
        userId: uid,
        type: "one-time",
        productId: itemId,
        amount: item.price,
        currency: "XP",
        status: "completed",
        createdAt: serverTimestamp(),
        itemDetails: {
          name: item.name,
          type: item.type,
          itemId: item.itemId,
        },
      });

      return {
        item,
        inventory: {
          ...userData.inventory,
          ...inventoryUpdate,
        },
        newXpPoints: userData.stats.xpPoints - item.price,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Premium slice
const premiumSlice = createSlice({
  name: "premium",
  initialState: {
    subscription: {
      isSubscribed: false,
      tier: "free",
      expiryDate: null,
      platform: null,
    },
    offerings: null,
    inventory: {
      avatars: ["default"],
      themes: ["default"],
      boosters: [],
    },
    availableItems: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    useBooster: (state, action) => {
      const boosterId = action.payload;
      state.inventory.boosters = state.inventory.boosters.map((booster) =>
        booster.id === boosterId ? { ...booster, used: true } : booster
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize RevenueCat
      .addCase(initializeRevenueCat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeRevenueCat.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(initializeRevenueCat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch subscription offerings
      .addCase(fetchSubscriptionOfferings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionOfferings.fulfilled, (state, action) => {
        state.loading = false;
        state.offerings = action.payload;
      })
      .addCase(fetchSubscriptionOfferings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch user subscription
      .addCase(fetchUserSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload;
      })
      .addCase(fetchUserSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Purchase subscription
      .addCase(purchaseSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(purchaseSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload;
      })
      .addCase(purchaseSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Restore purchases
      .addCase(restorePurchases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restorePurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload;
      })
      .addCase(restorePurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch store items
      .addCase(fetchStoreItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoreItems.fulfilled, (state, action) => {
        state.loading = false;
        state.availableItems = action.payload;
      })
      .addCase(fetchStoreItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Purchase store item
      .addCase(purchaseStoreItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(purchaseStoreItem.fulfilled, (state, action) => {
        state.loading = false;
        state.inventory = action.payload.inventory;
      })
      .addCase(purchaseStoreItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, useBooster } = premiumSlice.actions;
export default premiumSlice.reducer;
