import { LogOut, Shield, User } from "lucide-react-native";
import { useContext } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";

export default function ProfileScreen() {
  const { currentUser, logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: () => logout(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profilim</Text>
        </View>

        {/* PROFİL KARTI */}
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

          <View style={styles.roleBadge}>
            {currentUser?.role === "admin" ? (
              <Shield size={14} color="#4f46e5" />
            ) : (
              <User size={14} color="#64748b" />
            )}
            <Text
              style={[
                styles.roleText,
                currentUser?.role === "admin"
                  ? styles.roleAdmin
                  : styles.roleUser,
              ]}
            >
              {currentUser?.role === "admin"
                ? "Superadmin"
                : "Standart Kullanıcı"}
            </Text>
          </View>
        </View>

        {/* ÇIKIŞ YAP BUTONU */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Güvenli Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 32, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },

  // Profil Kartı
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 32,
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
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { fontSize: 32, fontWeight: "900", color: "#ffffff" },
  username: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 8,
    textTransform: "capitalize",
  },

  // Yetki Rozeti
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roleText: { fontSize: 13, fontWeight: "bold" },
  roleAdmin: { color: "#4f46e5" },
  roleUser: { color: "#64748b" },

  // Çıkış Butonu
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fee2e2",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutText: { color: "#dc2626", fontSize: 16, fontWeight: "bold" },
});
