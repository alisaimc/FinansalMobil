import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import apiClient from "../api/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Uygulama açılırken cihaz hafızasında kayıtlı oturum var mı kontrol et
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("currentUser");
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Oturum kontrol hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // GERÇEK BACKEND GİRİŞ SİSTEMİ
  const login = async (username, password) => {
    try {
      const response = await apiClient.post("/api/login", {
        username: username.trim().toLowerCase(),
        password,
      });

      if (response.data && response.data.user) {
        const sessionUser = {
          id: response.data.user.id || response.data.user._id,
          username: response.data.user.username,
          role: response.data.user.role,
          backgroundImage: response.data.user.backgroundImage,
          token: response.data.token,
        };

        // Oturumu cihaz hafızasına kaydet ve state'i güncelle
        await AsyncStorage.setItem("currentUser", JSON.stringify(sessionUser));
        setCurrentUser(sessionUser);
      } else {
        Alert.alert("Giriş Başarısız", "Sunucudan geçersiz veri döndü.");
      }
    } catch (error) {
      console.error("Giriş API hatası:", error);
      const serverError =
        error.response?.data?.error ||
        "Sunucuya bağlanılamadı. Bilgilerinizi kontrol edin.";
      Alert.alert("Giriş Başarısız", serverError);
    }
  };

  // ÇIKIŞ İŞLEMİ
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("currentUser");
      setCurrentUser(null);
    } catch (error) {
      console.error("Çıkış hatası:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUser, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
