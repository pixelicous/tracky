import React from "react";
import { StyleSheet, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { updateHabit } from "../../store/slices/habitsSlice";
import { Container } from "../../components/common";
import { HabitForm } from "../../components/habits";
import { theme } from "../../theme";

const EditHabitScreen = ({ route, navigation }) => {
  const { habit } = route.params;
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.habits.loading);

  const handleSubmit = (habitData) => {
    dispatch(updateHabit({ id: habit.id, habitData }))
      .unwrap()
      .then(() => {
        navigation.goBack();
      })
      .catch((error) => {
        Alert.alert("Error", "Failed to update habit. Please try again.");
      });
  };

  return (
    <Container scrollable keyboardAvoiding>
      <HabitForm
        initialValues={habit}
        onSubmit={handleSubmit}
        isEditing={true}
      />
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

export default EditHabitScreen;
