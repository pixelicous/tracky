import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setOnboardingComplete } from "../../store/slices/uiSlice";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "../../components/common";
import { Title, Body } from "../../components/common/Typography";
import { theme } from "../../theme";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: "1",
    title: "Track Your Habits",
    description:
      "Create and track your daily habits with our fun and engaging interface",
    animation: require("../../../assets/animations/flag.json"),
  },
  {
    id: "2",
    title: "Build Consistency",
    description: "Maintain your streaks and watch your progress grow over time",
    animation: require("../../../assets/animations/consistency.json"),
  },
  {
    id: "3",
    title: "Achieve Your Goals",
    description:
      "Set goals, earn rewards, and become the best version of yourself",
    animation: require("../../../assets/animations/goals.json"),
  },
  {
    id: "4",
    title: "Connect with Friends",
    description:
      "Share your progress and challenge friends to stay motivated together",
    animation: require("../../../assets/animations/flag.json"),
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();
  const dispatch = useDispatch();
  const currentTheme = useSelector((state) => state.ui.theme);
  const currentThemeColors =
    currentTheme === "dark" ? theme.colors.darkMode : theme.colors;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    // Mark onboarding as complete
    await AsyncStorage.setItem("onboardingComplete", "true");
    dispatch(setOnboardingComplete(true));

    // Navigate to sign in
    navigation.navigate("SignIn");
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <LottieView
          source={item.animation}
          autoPlay
          loop
          style={styles.animation}
        />

        <View style={styles.textContainer}>
          <Title style={styles.title}>{item.title}</Title>
          <Body style={styles.description}>{item.description}</Body>
        </View>
      </View>
    );
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentIndex && styles.activeDot]}
          />
        ))}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: currentThemeColors.white }]}
    >
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Body>Skip</Body>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        keyExtractor={(item) => item.id}
      />

      {renderPaginationDots()}

      <View style={styles.buttonContainer}>
        <Button
          title={
            currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"
          }
          onPress={handleNext}
          size="large"
          icon={
            currentIndex === onboardingData.length - 1 ? null : (
              <Ionicons
                name="arrow-forward"
                size={20}
                color={currentThemeColors.white}
              />
            )
          }
          iconPosition="right"
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  slide: {
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.large,
  },
  animation: {
    width: width * 0.8,
    height: width * 0.8,
  },
  textContainer: {
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    marginBottom: theme.spacing.medium,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    maxWidth: width * 0.8,
    color: theme.colors.darkGray,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: theme.spacing.medium,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.lightGray,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 20,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.large,
    paddingBottom: theme.spacing.xxl,
  },
  button: {
    width: "100%",
  },
});

export default OnboardingScreen;
