import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStoreItems,
  purchaseStoreItem,
  fetchSubscriptionOfferings,
  purchaseSubscription,
} from "../../store/slices/premiumSlice";
import { useNavigation } from "@react-navigation/native";

const StoreScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { availableItems, subscription, offerings, loading, error } =
    useSelector((state) => state.premium);
  const { xpPoints } = useSelector((state) => state.auth.user.stats);

  useEffect(() => {
    dispatch(fetchStoreItems());
    dispatch(fetchSubscriptionOfferings());
  }, [dispatch]);

  const handlePurchaseItem = (itemId) => {
    dispatch(purchaseStoreItem(itemId));
  };

  const handlePurchaseSubscription = (packageToPurchase) => {
    dispatch(purchaseSubscription(packageToPurchase));
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text>{item.description}</Text>
      <Text>Price: {item.price} XP</Text>
      <TouchableOpacity
        style={styles.purchaseButton}
        onPress={() => handlePurchaseItem(item.id)}
        disabled={xpPoints < item.price}
      >
        <Text style={styles.purchaseButtonText}>
          {xpPoints < item.price ? "Not enough XP" : "Purchase"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubscription = () => {
    if (!offerings?.current) {
      return <Text>No subscription offerings available.</Text>;
    }

    const packageToPurchase = offerings.current.availablePackages[0]; // Assuming first package is the one to purchase

    return (
      <View style={styles.subscriptionContainer}>
        <Text style={styles.subscriptionTitle}>Premium Subscription</Text>
        <Text>Unlock all premium features!</Text>
        <Text>Price: {packageToPurchase.product.localizedPrice}</Text>
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={() => handlePurchaseSubscription(packageToPurchase)}
        >
          <Text style={styles.purchaseButtonText}>Subscribe</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Store</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={availableItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderSubscription}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  purchaseButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  purchaseButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  subscriptionContainer: {
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
});

export default StoreScreen;
