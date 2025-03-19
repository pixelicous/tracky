import React from "react";
import { StyleSheet, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { createHabit } from "../../store/slices/habitsSlice";
import { Container } from "../../components/common";
import { HabitForm } from "../../components/habits";
import { theme } from "../../theme";

const AddHabitScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.habits.loading);

  const handleSubmit = (habitData) => {
    dispatch(createHabit(habitData))
      .unwrap()
      .then(() => {
        navigation.goBack();
      })
      .catch((error) => {
        Alert.alert("Error", "Failed to create habit. Please try again.");
      });
  };

  return (
    <Container scrollable keyboardAvoiding>
      <HabitForm onSubmit={handleSubmit} />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.background,
  },
});

export default AddHabitScreen;
