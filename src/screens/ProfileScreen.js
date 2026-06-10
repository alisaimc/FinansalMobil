import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Cloud,
  CloudRain,
  LogOut,
  Snowflake,
  Sun,
} from "lucide-react-native";
import { useContext, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiClient from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

// 1. ANİMASYON TEMALARI
const WEATHER_ANIMATIONS = [
  { id: "clear", label: "Güneşli", icon: Sun },
  { id: "rain", label: "Yağmur", icon: CloudRain },
  { id: "snow", label: "Kar", icon: Snowflake },
  { id: "clouds", label: "Bulutlu", icon: Cloud },
];

// 2. ARKA PLAN RENKLERİ
const COLOR_THEMES = [
  { id: "grad-ocean", label: "Okyanus", colors: ["#0ea5e9", "#2563eb"] },
  { id: "grad-sunset", label: "Gün Batımı", colors: ["#f59e0b", "#ef4444"] },
  { id: "grad-forest", label: "Orman", colors: ["#10b981", "#047857"] },
  { id: "grad-dark", label: "Gece", colors: ["#1e293b", "#000000"] },
  { id: "solid-purple", label: "Mor", colors: ["#8b5cf6", "#8b5cf6"] },
  { id: "solid-red", label: "Kırmızı", colors: ["#ef4444", "#ef4444"] },
];

export default function ProfileScreen({ navigation }) {
  const { currentUser, setCurrentUser, logout } = useContext(AuthContext);
  const [isUploading, setIsUploading] = useState(false);

  // Veritabanındaki JSON Ayarlarını Okuma
  let currentSettings = { color: "grad-ocean", weather: "clear" };
  try {
    if (currentUser?.backgroundImage?.startsWith("{")) {
      currentSettings = JSON.parse(currentUser.backgroundImage);
    }
  } catch (e) {}

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: () => logout() },
    ]);
  };

  const updateSetting = async (type, value) => {
    // 1. HIZLI TEPKİ (Optimistic Update): Önce arayüzü anında değiştir!
    const newSettings = { ...currentSettings, [type]: value };
    const jsonString = JSON.stringify(newSettings);
    const newSession = { ...currentUser, backgroundImage: jsonString };

    // Uygulama hiç beklemeden anında yeni temaya/animasyona geçer
    setCurrentUser(newSession);

    try {
      // 2. ARKA PLANDA KAYIT: Telefon hafızasına ve Vercel'e arka planda yazılır
      AsyncStorage.setItem("currentUser", JSON.stringify(newSession));

      const updatedUser = {
        id: currentUser.id || currentUser._id,
        backgroundImage: jsonString,
      };
      await apiClient.post("/api/users", updatedUser);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Hata",
        "Ayar veritabanına kaydedilirken bir bağlantı sorunu oluştu.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft color="#1e293b" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profilim</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFİL FOTOĞRAFI KARTI BURADA (Aynı Bıraktım) */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser?.username
                ? currentUser.username.substring(0, 2).toUpperCase()
                : "U"}
            </Text>
          </View>
          <Text style={styles.username}>
            {currentUser?.username || "Kullanıcı"}
          </Text>
        </View>

        {/* 1. HAVA DURUMU ANİMASYONLARI */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Hava Durumu Efekti</Text>
          <Text style={styles.settingsDesc}>
            Arka planda oynatılacak hareketli animasyonu seçin.
          </Text>
          <View style={styles.themeGrid}>
            {WEATHER_ANIMATIONS.map((anim) => {
              const isActive = currentSettings.weather === anim.id;
              const Icon = anim.icon;
              return (
                <TouchableOpacity
                  key={anim.id}
                  onPress={() => updateSetting("weather", anim.id)}
                  style={[
                    styles.animOption,
                    isActive && styles.animOptionActive,
                  ]}
                >
                  <Icon color={isActive ? "#4f46e5" : "#64748b"} size={28} />
                  <Text
                    style={[
                      styles.themeLabel,
                      isActive && styles.themeLabelActive,
                    ]}
                  >
                    {anim.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. ARKA PLAN RENKLERİ */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Arka Plan Rengi</Text>
          <Text style={styles.settingsDesc}>
            Animasyonların arkasında duracak sabit renk geçişi.
          </Text>
          <View style={styles.themeGrid}>
            {COLOR_THEMES.map((theme) => {
              const isActive = currentSettings.color === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  onPress={() => updateSetting("color", theme.id)}
                  style={styles.themeOption}
                >
                  <LinearGradient
                    colors={theme.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.themeCircle,
                      isActive && styles.themeCircleActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      isActive && styles.themeLabelActive,
                    ]}
                  >
                    {theme.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut color="#dc2626" size={20} />
          <Text style={styles.logoutText}>Güvenli Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  backButton: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 12 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },

  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#ffffff" },
  username: { fontSize: 24, fontWeight: "900", color: "#1e293b" },

  settingsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 8,
  },
  settingsDesc: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 20,
  },

  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },

  // Animasyon Kutuları
  animOption: {
    width: "22%",
    paddingVertical: 12,
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "transparent",
  },
  animOptionActive: { backgroundColor: "#e0e7ff", borderColor: "#4f46e5" },

  // Renk Daireleri
  themeOption: { width: "22%", alignItems: "center", gap: 8, marginBottom: 8 },
  themeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  themeCircleActive: { borderColor: "#4f46e5", borderWidth: 4 },

  themeLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94a3b8",
    textAlign: "center",
  },
  themeLabelActive: { color: "#4f46e5" },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fee2e2",
    paddingVertical: 16,
    borderRadius: 16,
  },
  logoutText: { color: "#dc2626", fontSize: 16, fontWeight: "bold" },
});
