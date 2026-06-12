import {
  NavigationContainer
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Context
import { AuthContext, AuthProvider } from "./src/context/AuthContext";

// Ekranlar
import LoginScreen from "./src/screens/LoginScreen";
import MainScreen from "./src/screens/MainScreen";
import ProfileScreen from "./src/screens/ProfileScreen"; // Profil ekranını import ettik

const Stack = createNativeStackNavigator();

// Yönlendirme Yöneticisi
const RootNavigator = () => {
  const { currentUser, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {currentUser ? (
          // Giriş yapılmışsa Ana Ekran ve Profil Ekranı rotaları açılır
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ presentation: "modal" }} // Profil ekranını alttan kayarak (modal) açtırıyoruz
            />
          </>
        ) : (
          // Giriş yapılmamışsa sadece Login rotası açıktır
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
