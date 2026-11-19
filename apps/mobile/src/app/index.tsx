import { StyleSheet, Text, View } from "react-native";

// Home screen (route "/"). Placeholder until the product list in Phase 2.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ripe</Text>
      <Text style={styles.subtitle}>
        Follow new foods and supplement ingredients from lab to shop shelf.
      </Text>
      <Text style={styles.note}>Phase 0 placeholder – product list coming in Phase 2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#333333",
    marginBottom: 24,
  },
  note: {
    fontSize: 13,
    color: "#888888",
  },
});
