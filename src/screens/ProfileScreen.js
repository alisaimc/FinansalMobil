import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  Camera,
  ChevronLeft,
  Cloud,
  CloudRain,
  Key,
  LogOut,
  MapPin,
  Snowflake,
  Sun,
  Trash2,
} from "lucide-react-native";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

  // Yükleme Durumları
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  // Şifre Formu
  const [passwordForm, setPasswordForm] = useState({ newPass: "" });

  // Veritabanındaki JSON Ayarlarını Okuma
  let currentSettings = { color: "grad-ocean", weather: "clear" };
  let hasCustomBgImage = false;

  try {
    if (currentUser?.backgroundImage) {
      if (currentUser.backgroundImage.startsWith("{")) {
        currentSettings = JSON.parse(currentUser.backgroundImage);
      } else if (currentUser.backgroundImage.startsWith("data:image")) {
        hasCustomBgImage = true;
      }
    }
  } catch (e) {}

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: () => logout() },
    ]);
  };

  // --- 1. TEMA GÜNCELLEME ---
  const updateSetting = async (type, value) => {
    const newSettings = { ...currentSettings, [type]: value };
    const jsonString = JSON.stringify(newSettings);
    const newSession = { ...currentUser, backgroundImage: jsonString };

    setCurrentUser(newSession);

    try {
      await AsyncStorage.setItem("currentUser", JSON.stringify(newSession));
      await apiClient.post("/api/users", {
        id: currentUser.id || currentUser._id,
        backgroundImage: jsonString,
      });
    } catch (error) {
      Alert.alert("Hata", "Ayar kaydedilirken bir sorun oluştu.");
    }
  };

  // --- 2. PROFİL FOTOĞRAFI GÜNCELLEME ---
  const handlePhotoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "İzin Gerekli",
        "Fotoğraf seçmek için galeri izni vermelisiniz.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Kare Kırpma
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsUploadingPhoto(true);
      try {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await apiClient.post("/api/users", {
          id: currentUser.id || currentUser._id,
          profilePhoto: base64Image,
        });

        const newSession = { ...currentUser, profilePhoto: base64Image };
        setCurrentUser(newSession);
        await AsyncStorage.setItem("currentUser", JSON.stringify(newSession));

        Alert.alert("Başarılı", "Profil fotoğrafınız güncellendi!");
      } catch (error) {
        Alert.alert("Hata", "Fotoğraf yüklenirken sorun oluştu.");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  // --- 3. PROFİL FOTOĞRAFINI SİLME (UYARILI) ---
  const handleDeletePhoto = async () => {
    Alert.alert("Emin misiniz?", "Profil fotoğrafınız tamamen kaldırılacak.", [
      { text: "İptal", style: "cancel" },
      {
        text: "Kaldır",
        style: "destructive",
        onPress: async () => {
          setIsUploadingPhoto(true);
          try {
            await apiClient.post("/api/users", {
              id: currentUser.id || currentUser._id,
              profilePhoto: null,
            });

            const newSession = { ...currentUser, profilePhoto: null };
            setCurrentUser(newSession);
            await AsyncStorage.setItem(
              "currentUser",
              JSON.stringify(newSession),
            );

            Alert.alert("Başarılı", "Profil fotoğrafı başarıyla kaldırıldı.");
          } catch (error) {
            Alert.alert("Hata", "Silme işlemi başarısız.");
          } finally {
            setIsUploadingPhoto(false);
          }
        },
      },
    ]);
  };

  // --- 4. KİŞİSEL ARKA PLAN YÜKLEME ---
  const handleBgImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsUploadingBg(true);
      try {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await apiClient.post("/api/users", {
          id: currentUser.id || currentUser._id,
          backgroundImage: base64Image,
        });

        const newSession = { ...currentUser, backgroundImage: base64Image };
        setCurrentUser(newSession);
        await AsyncStorage.setItem("currentUser", JSON.stringify(newSession));

        Alert.alert("Başarılı", "Kişisel arka plan resminiz ayarlandı!");
      } catch (error) {
        Alert.alert("Hata", "Arka plan yüklenirken sorun oluştu.");
      } finally {
        setIsUploadingBg(false);
      }
    }
  };

  // --- 5. KİŞİSEL ARKA PLANI SİLME ---
  const handleDeleteBgImage = async () => {
    Alert.alert("Emin misiniz?", "Kişisel arka plan resminiz kaldırılacak.", [
      { text: "İptal", style: "cancel" },
      {
        text: "Kaldır",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.post("/api/users", {
              id: currentUser.id || currentUser._id,
              backgroundImage: null,
            });

            const newSession = { ...currentUser, backgroundImage: null };
            setCurrentUser(newSession);
            await AsyncStorage.setItem(
              "currentUser",
              JSON.stringify(newSession),
            );

            Alert.alert(
              "Başarılı",
              "Arka plan kaldırıldı, varsayılan temaya dönüldü.",
            );
          } catch (error) {
            Alert.alert("Hata", "Silme işlemi başarısız.");
          }
        },
      },
    ]);
  };

  // --- 6. ŞİFRE GÜNCELLEME ---
  const handlePasswordUpdate = async () => {
    if (!passwordForm.newPass.trim()) {
      Alert.alert("Uyarı", "Lütfen yeni bir şifre girin.");
      return;
    }

    setIsUpdatingPass(true);
    try {
      await apiClient.post("/api/users", {
        id: currentUser.id || currentUser._id,
        password: passwordForm.newPass,
      });

      Alert.alert("Başarılı", "Şifreniz başarıyla güncellendi!");
      setPasswordForm({ newPass: "" });
    } catch (error) {
      Alert.alert("Hata", "Şifre güncellenirken bir sorun oluştu.");
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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
          keyboardShouldPersistTaps="handled"
        >
          {/* PROFİL FOTOĞRAFI */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                onPress={handlePhotoUpload}
                disabled={isUploadingPhoto}
                style={styles.avatarContainer}
                activeOpacity={0.8}
              >
                {isUploadingPhoto ? (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator size="large" color="#ffffff" />
                  </View>
                ) : currentUser?.profilePhoto ? (
                  <Image
                    source={{ uri: currentUser.profilePhoto }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>
                      {currentUser?.username
                        ? currentUser.username.substring(0, 2).toUpperCase()
                        : "U"}
                    </Text>
                  </View>
                )}

                {/* Güncelleme İkonu (Kamera) */}
                <View style={styles.editIconBadge}>
                  <Camera size={16} color="#ffffff" />
                </View>
              </TouchableOpacity>

              {/* Silme İkonu (Sadece fotoğraf varsa görünür) */}
              {currentUser?.profilePhoto && (
                <TouchableOpacity
                  style={styles.deleteIconBadge}
                  onPress={handleDeletePhoto}
                  disabled={isUploadingPhoto}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#dc2626" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.username}>
              {currentUser?.username || "Kullanıcı"}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {currentUser?.role === "admin"
                  ? "Sistem Yöneticisi"
                  : "Standart Kullanıcı"}
              </Text>
            </View>
          </View>

          {/* KİŞİSEL ARKA PLAN (SİLME VE GÜNCELLEME) */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeaderRow}>
              <MapPin size={20} color="#4f46e5" />
              <Text style={styles.settingsTitle}>Kişisel Arka Plan</Text>
            </View>
            <Text style={styles.settingsDesc}>
              Uygulamanın arka planında görünmesi için galerinizden bir resim
              yükleyin.
            </Text>

            <View style={styles.bgUploadRow}>
              <TouchableOpacity
                style={styles.uploadBgBtn}
                onPress={handleBgImageUpload}
                disabled={isUploadingBg}
              >
                {isUploadingBg ? (
                  <ActivityIndicator color="#4f46e5" />
                ) : (
                  <Text style={styles.uploadBgBtnText}>Resim Yükle</Text>
                )}
              </TouchableOpacity>

              {hasCustomBgImage && (
                <TouchableOpacity
                  style={styles.deleteBgBtn}
                  onPress={handleDeleteBgImage}
                >
                  <Trash2 size={20} color="#dc2626" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ŞİFRE DEĞİŞTİRME FORMU */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeaderRow}>
              <Key size={20} color="#4f46e5" />
              <Text style={styles.settingsTitle}>Şifre Değiştir</Text>
            </View>
            <Text style={styles.settingsDesc}>
              Hesabınızın güvenliği için şifrenizi güncelleyin.
            </Text>

            <View style={styles.passwordFormRow}>
              <TextInput
                style={styles.input}
                value={passwordForm.newPass}
                onChangeText={(t) => setPasswordForm({ newPass: t })}
                placeholder="Yeni Şifre"
                secureTextEntry
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                style={styles.updatePassBtn}
                onPress={handlePasswordUpdate}
                disabled={isUpdatingPass}
              >
                {isUpdatingPass ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.updatePassBtnText}>Güncelle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 1. HAVA DURUMU ANİMASYONLARI */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Hava Durumu Efekti</Text>
            <Text style={styles.settingsDesc}>
              Arka planda oynatılacak hareketli animasyonu seçin.
            </Text>
            <View style={styles.themeGrid}>
              {WEATHER_ANIMATIONS.map((anim) => {
                const isActive =
                  !hasCustomBgImage && currentSettings.weather === anim.id;
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
                const isActive =
                  !hasCustomBgImage && currentSettings.color === theme.id;
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
      </KeyboardAvoidingView>
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
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarContainer: {
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#e0e7ff",
  },
  avatarLoading: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.8,
  },
  avatarText: { fontSize: 32, fontWeight: "900", color: "#ffffff" },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: -4,
    backgroundColor: "#1e293b",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  deleteIconBadge: {
    position: "absolute",
    bottom: 0,
    left: -4,
    backgroundColor: "#fef2f2",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  username: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1e293b",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "bold", color: "#4f46e5" },

  settingsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  settingsTitle: { fontSize: 16, fontWeight: "900", color: "#1e293b" },
  settingsDesc: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 20,
  },

  bgUploadRow: { flexDirection: "row", gap: 12 },
  uploadBgBtn: {
    flex: 1,
    backgroundColor: "#e0e7ff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBgBtnText: { color: "#4f46e5", fontWeight: "bold", fontSize: 14 },
  deleteBgBtn: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordFormRow: { flexDirection: "row", gap: 12 },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
  },
  updatePassBtn: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  updatePassBtnText: { color: "#ffffff", fontWeight: "bold", fontSize: 14 },

  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },
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
