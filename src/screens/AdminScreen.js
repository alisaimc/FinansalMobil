import { Plus, Shield, Trash2, Users } from "lucide-react-native";
import { useCallback, useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import apiClient from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

export default function AdminScreen() {
  const { currentUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [appUsers, setAppUsers] = useState([]);

  // Yeni Kullanıcı Formu
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    password: "",
    role: "user",
  });

  // Kullanıcıları Çek
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/users");
      setAppUsers(response.data);
    } catch (error) {
      console.error("Kullanıcılar çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Yeni Kullanıcı Ekle
  const handleAddUser = async () => {
    const username = newUserForm.username.trim().toLowerCase();

    if (!username || !newUserForm.password) {
      Alert.alert("Uyarı", "Lütfen kullanıcı adı ve şifre giriniz.");
      return;
    }

    if (appUsers.find((u) => u.username === username)) {
      Alert.alert("Uyarı", "Bu kullanıcı adı zaten mevcut!");
      return;
    }

    try {
      await apiClient.post("/api/users", {
        username,
        password: newUserForm.password,
        role: newUserForm.role,
      });

      Alert.alert("Başarılı", `${username} kullanıcısı eklendi!`);
      setNewUserForm({ username: "", password: "", role: "user" });
      fetchUsers(); // Listeyi tazele
    } catch (error) {
      Alert.alert("Hata", "Kullanıcı eklenemedi.");
    }
  };

  // Kullanıcı Güncelle (Rol veya Şifre)
  const handleUpdateUser = async (userId, field, newValue) => {
    const targetUser = appUsers.find((u) => u.id === userId);
    if (!targetUser || targetUser[field] === newValue) return;

    const updatedUser = { ...targetUser, [field]: newValue };

    try {
      await apiClient.post("/api/users", updatedUser);
      Alert.alert("Başarılı", "Kullanıcı bilgisi güncellendi.");
      fetchUsers();
    } catch (error) {
      Alert.alert("Hata", "Kullanıcı güncellenirken hata oluştu.");
    }
  };

  // Kullanıcı Sil
  const handleDeleteUser = (userId) => {
    if (userId === currentUser.id) {
      Alert.alert("Uyarı", "Kendi hesabınızı silemezsiniz!");
      return;
    }

    Alert.alert(
      "Silme İşlemi",
      "Bu kullanıcıyı tamamen silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/api/users?id=${userId}`);
              Alert.alert("Başarılı", "Kullanıcı silindi.");
              fetchUsers();
            } catch (error) {
              Alert.alert("Hata", "Silme işlemi başarısız.");
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Shield size={28} color="#4f46e5" />
          <Text style={styles.headerTitle}>Sistem Yöneticisi</Text>
        </View>

        {/* YENİ KULLANICI EKLEME FORMU */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Users size={20} color="#1e293b" />
            <Text style={styles.cardTitle}>Yeni Kullanıcı Ekle</Text>
          </View>

          <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
          <TextInput
            style={styles.input}
            value={newUserForm.username}
            onChangeText={(t) =>
              setNewUserForm({ ...newUserForm, username: t })
            }
            placeholder="Örn: ahmet123"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Geçici Şifre</Text>
          <TextInput
            style={styles.input}
            value={newUserForm.password}
            onChangeText={(t) =>
              setNewUserForm({ ...newUserForm, password: t })
            }
            placeholder="Örn: 123456"
            secureTextEntry
          />

          <Text style={styles.inputLabel}>Yetki</Text>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleBtn,
                newUserForm.role === "user" && styles.roleBtnActive,
              ]}
              onPress={() => setNewUserForm({ ...newUserForm, role: "user" })}
            >
              <Text
                style={[
                  styles.roleBtnText,
                  newUserForm.role === "user" && styles.roleTextActive,
                ]}
              >
                Standart
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleBtn,
                newUserForm.role === "admin" && styles.roleBtnActive,
              ]}
              onPress={() => setNewUserForm({ ...newUserForm, role: "admin" })}
            >
              <Text
                style={[
                  styles.roleBtnText,
                  newUserForm.role === "admin" && styles.roleTextActive,
                ]}
              >
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleAddUser}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>Kullanıcıyı Ekle</Text>
          </TouchableOpacity>
        </View>

        {/* MEVCUT KULLANICILAR LİSTESİ */}
        <Text style={styles.sectionTitle}>
          SİSTEM KULLANICILARI ({appUsers.length})
        </Text>

        {appUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.username.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.userRole}>
                  {user.role === "admin" ? "Superadmin" : "Standart Kullanıcı"}
                </Text>
              </View>
            </View>

            {/* Admin kendisini silemesin */}
            {user.id !== currentUser.id && (
              <TouchableOpacity
                onPress={() => handleDeleteUser(user.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  container: { flex: 1 },
  content: { padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 32,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },

  inputLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },

  roleSelector: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 4,
    borderRadius: 16,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  roleBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  roleBtnText: { fontWeight: "bold", color: "#64748b" },
  roleTextActive: { color: "#4f46e5" },

  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 12,
    color: "#64748b",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "900", color: "#4f46e5" },
  username: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    textTransform: "capitalize",
  },
  userRole: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  deleteButton: { padding: 8, backgroundColor: "#fef2f2", borderRadius: 12 },
});
