import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";
import { Alert } from "react-native"; // Hata mesajları için ekledik
import apiClient from "../api/apiClient"; // Az önce oluşturduğumuz dosyayı çektik

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Kullanıcı bilgilerini tutmak için

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem("userToken");
      let user = await AsyncStorage.getItem("currentUser");

      if (token && user) {
        setUserToken(token);
        setCurrentUser(JSON.parse(user));
      }
    } catch (e) {
      console.log(`Token okuma hatası: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  // GERÇEK API BAĞLANTISI
  const login = async (username, password) => {
    setIsLoading(true);
    try {
      // apiClient doğrudan Vercel adresine /api/login isteği atar
      const response = await apiClient.post("/api/login", {
        username: username.trim().toLowerCase(),
        password: password,
      });

      const { token, user } = response.data; // Vercel'den dönen veriler

      setUserToken(token);
      setCurrentUser(user);

      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("currentUser", JSON.stringify(user));
    } catch (error) {
      console.error("Giriş Hatası:", error.response?.data || error.message);
      Alert.alert(
        "Hata",
        "Kullanıcı adı veya şifre yanlış, ya da sunucuya ulaşılamadı.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setCurrentUser(null);
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("currentUser");
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        isLoading,
        userToken,
        currentUser,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
