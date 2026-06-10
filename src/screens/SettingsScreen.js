import { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Lock ikonunu import'a ekledik
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Edit2,
  Key,
  Lock,
  Plus,
  Settings,
  Trash2,
  Users
} from "lucide-react-native";
import apiClient from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

export default function SettingsScreen() {
  const { currentUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  // Üst Sekme: 'categories' veya 'users'
  const [activeTab, setActiveTab] = useState("categories");

  // --- KATEGORİ STATE ---
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "GİDER" });
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Kategori Düzenleme State'leri
  const [editCatModalVisible, setEditCatModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [editCatForm, setEditCatForm] = useState({ name: "", type: "GİDER" });
  const [isUpdatingCat, setIsUpdatingCat] = useState(false);

  // --- KULLANICI STATE ---
  const [appUsers, setAppUsers] = useState([]);
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    password: "",
    role: "user",
  });
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Şifre Değiştirme State'leri
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Veritabanından Verileri Çekme
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [catRes, userRes] = await Promise.all([
        apiClient.get("/api/category"),
        apiClient.get("/api/users"),
      ]);
      setCategories(catRes.data);
      setAppUsers(userRes.data);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // 1. KULLANICI YÖNETİMİ AKSİYONLARI
  // ==========================================
  const handleAddUser = async () => {
    const username = newUserForm.username.trim().toLowerCase();
    if (!username || !newUserForm.password) {
      Alert.alert("Eksik Bilgi", "Lütfen kullanıcı adı ve geçici şifre girin.");
      return;
    }
    if (appUsers.find((u) => u.username === username)) {
      Alert.alert("Uyarı", "Bu kullanıcı adı zaten sistemde mevcut!");
      return;
    }
    setIsAddingUser(true);
    try {
      await apiClient.post("/api/users", {
        username,
        password: newUserForm.password,
        role: newUserForm.role,
      });
      Alert.alert("Başarılı", `${username} başarıyla eklendi!`);
      setNewUserForm({ username: "", password: "", role: "user" });
      fetchData();
    } catch (error) {
      Alert.alert("Hata", "Kullanıcı eklenemedi.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = (userId) => {
    if (String(userId) === String(currentUser.id || currentUser._id)) {
      Alert.alert(
        "İşlem Engellendi",
        "Kendi yönetici hesabınızı silemezsiniz!",
      );
      return;
    }
    Alert.alert(
      "Kullanıcıyı Sil",
      "Bu kullanıcıyı tamamen silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const previousUsers = [...appUsers];
            setAppUsers(
              appUsers.filter((u) => String(u.id || u._id) !== String(userId)),
            );
            try {
              await apiClient.delete(`/api/users?id=${userId}`);
            } catch (error) {
              setAppUsers(previousUsers);
              Alert.alert("Hata", "Kullanıcı silinemedi.");
            }
          },
        },
      ],
    );
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert("Uyarı", "Lütfen yeni bir şifre girin.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiClient.post("/api/users", {
        id: selectedUserForPassword.id || selectedUserForPassword._id,
        password: newPassword,
      });
      Alert.alert("Başarılı", "Şifre başarıyla değiştirildi!");
      setPasswordModalVisible(false);
      setNewPassword("");
    } catch (error) {
      Alert.alert("Hata", "Şifre güncellenirken sorun oluştu.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ==========================================
  // 2. KATEGORİ YÖNETİMİ AKSİYONLARI
  // ==========================================
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      Alert.alert("Uyarı", "Lütfen bir kategori adı girin.");
      return;
    }
    setIsAddingCat(true);
    try {
      const payload = {
        name: categoryForm.name.toLocaleUpperCase("tr-TR"),
        type: categoryForm.type,
      };
      const response = await apiClient.post("/api/category", payload);
      setCategories([...categories, response.data]);
      setCategoryForm({ name: "", type: "GİDER" });
    } catch (error) {
      Alert.alert("Hata", "Kategori eklenemedi.");
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleDeleteCategory = (cat) => {
    // 1. Ekstra Güvenlik: isGlobal Kontrolü
    if (cat.isGlobal) {
      Alert.alert(
        "Erişim Engellendi",
        "Sistem tarafından oluşturulan global kategoriler silinemez.",
      );
      return;
    }

    Alert.alert("Kategoriyi Sil", "Silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const previousCats = [...categories];
          setCategories(
            categories.filter(
              (c) => String(c._id || c.id) !== String(cat._id || cat.id),
            ),
          );
          try {
            await apiClient.delete(`/api/category?id=${cat._id || cat.id}`);
          } catch (error) {
            setCategories(previousCats);
            Alert.alert("Hata", "Silme işlemi başarısız.");
          }
        },
      },
    ]);
  };

  const handleOpenEditCat = (cat) => {
    // 2. Ekstra Güvenlik: isGlobal Kontrolü
    if (cat.isGlobal) {
      Alert.alert(
        "Erişim Engellendi",
        "Sistem tarafından oluşturulan global kategoriler düzenlenemez.",
      );
      return;
    }

    setSelectedCat(cat);
    setEditCatForm({ name: cat.name, type: cat.type });
    setEditCatModalVisible(true);
  };

  const handleUpdateCategory = async () => {
    if (!editCatForm.name.trim()) {
      Alert.alert("Uyarı", "Kategori adı boş bırakılamaz.");
      return;
    }
    setIsUpdatingCat(true);
    try {
      const payload = {
        id: selectedCat._id || selectedCat.id,
        name: editCatForm.name.toLocaleUpperCase("tr-TR"),
        type: editCatForm.type,
      };

      await apiClient.put("/api/category", payload);

      setCategories(
        categories.map((c) =>
          String(c._id || c.id) === String(payload.id)
            ? { ...c, name: payload.name, type: payload.type }
            : c,
        ),
      );

      setEditCatModalVisible(false);
      Alert.alert("Başarılı", "Kategori başarıyla güncellendi.");
    } catch (error) {
      Alert.alert("Hata", "Kategori güncellenirken sunucu hatası oluştu.");
    } finally {
      setIsUpdatingCat(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const incomeCategories = categories.filter((c) => c.type === "GELİR");
  const expenseCategories = categories.filter((c) => c.type === "GİDER");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Settings size={28} color="#4f46e5" />
        <Text style={styles.headerTitle}>Sistem Ayarları</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "categories" && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab("categories")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "categories" && styles.tabTextActive,
            ]}
          >
            Kategoriler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "users" && styles.tabBtnActive]}
          onPress={() => setActiveTab("users")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "users" && styles.tabTextActive,
            ]}
          >
            Kullanıcı Yönetimi
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* --- KATEGORİ SEKMESİ --- */}
        {activeTab === "categories" && (
          <View>
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Kategori Adı</Text>
              <TextInput
                style={styles.input}
                value={categoryForm.name}
                onChangeText={(t) =>
                  setCategoryForm({ ...categoryForm, name: t })
                }
                placeholder="Örn: AKARYAKIT"
                autoCapitalize="characters"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.inputLabel}>Tür Seçimi</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    categoryForm.type === "GİDER" &&
                      styles.typeBtnExpenseActive,
                  ]}
                  onPress={() =>
                    setCategoryForm({ ...categoryForm, type: "GİDER" })
                  }
                >
                  <ArrowDownCircle
                    size={18}
                    color={
                      categoryForm.type === "GİDER" ? "#dc2626" : "#64748b"
                    }
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      categoryForm.type === "GİDER" && styles.textExpense,
                    ]}
                  >
                    Gider
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    categoryForm.type === "GELİR" && styles.typeBtnIncomeActive,
                  ]}
                  onPress={() =>
                    setCategoryForm({ ...categoryForm, type: "GELİR" })
                  }
                >
                  <ArrowUpCircle
                    size={18}
                    color={
                      categoryForm.type === "GELİR" ? "#16a34a" : "#64748b"
                    }
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      categoryForm.type === "GELİR" && styles.textIncome,
                    ]}
                  >
                    Gelir
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddCategory}
                disabled={isAddingCat}
              >
                {isAddingCat ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Plus size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Kategori Ekle</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* GİDER KATEGORİLERİ */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, styles.textExpense]}>
                GİDER KATEGORİLERİ
              </Text>
              <View style={styles.chipContainer}>
                {expenseCategories.map((c) => (
                  <View
                    key={c._id || c.id}
                    style={[
                      styles.chip,
                      c.isGlobal ? styles.chipGlobal : styles.chipExpense,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        c.isGlobal && styles.chipTextGlobal,
                      ]}
                    >
                      {c.name}
                    </Text>
                    {c.isGlobal ? (
                      // Sistem Kategorisi İse Kilit İkonu Göster
                      <View style={styles.lockIconContainer}>
                        <Lock size={14} color="#0284c7" />
                      </View>
                    ) : (
                      // Kullanıcı Kategorisi İse Düzenle/Sil Göster
                      <View style={styles.chipActionsRow}>
                        <TouchableOpacity
                          onPress={() => handleOpenEditCat(c)}
                          style={styles.actionIconBtn}
                        >
                          <Edit2 size={16} color="#4f46e5" />
                        </TouchableOpacity>
                        <View style={styles.actionDivider} />
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(c)}
                          style={styles.actionIconBtn}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* GELİR KATEGORİLERİ */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, styles.textIncome]}>
                GELİR KATEGORİLERİ
              </Text>
              <View style={styles.chipContainer}>
                {incomeCategories.map((c) => (
                  <View
                    key={c._id || c.id}
                    style={[
                      styles.chip,
                      c.isGlobal ? styles.chipGlobal : styles.chipIncome,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        c.isGlobal && styles.chipTextGlobal,
                      ]}
                    >
                      {c.name}
                    </Text>
                    {c.isGlobal ? (
                      // Sistem Kategorisi İse Kilit İkonu Göster
                      <View style={styles.lockIconContainer}>
                        <Lock size={14} color="#0284c7" />
                      </View>
                    ) : (
                      // Kullanıcı Kategorisi İse Düzenle/Sil Göster
                      <View style={styles.chipActionsRow}>
                        <TouchableOpacity
                          onPress={() => handleOpenEditCat(c)}
                          style={styles.actionIconBtn}
                        >
                          <Edit2 size={16} color="#4f46e5" />
                        </TouchableOpacity>
                        <View style={styles.actionDivider} />
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(c)}
                          style={styles.actionIconBtn}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* --- KULLANICI SEKMESİ --- */}
        {activeTab === "users" && (
          <View>
            <View style={styles.formCard}>
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
                placeholderTextColor="#94a3b8"
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
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.inputLabel}>Yetki</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    newUserForm.role === "user" && styles.typeBtnActive,
                  ]}
                  onPress={() =>
                    setNewUserForm({ ...newUserForm, role: "user" })
                  }
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      newUserForm.role === "user" && styles.tabTextActive,
                    ]}
                  >
                    Standart
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    newUserForm.role === "admin" && styles.typeBtnActive,
                  ]}
                  onPress={() =>
                    setNewUserForm({ ...newUserForm, role: "admin" })
                  }
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      newUserForm.role === "admin" && styles.tabTextActive,
                    ]}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddUser}
                disabled={isAddingUser}
              >
                {isAddingUser ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Plus size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>
                      Kullanıcıyı Ekle
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitleList}>
              SİSTEM KULLANICILARI ({appUsers.length})
            </Text>

            {appUsers.map((user) => (
              <View key={user.id || user._id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.username.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.usernameText}>{user.username}</Text>
                    <Text style={styles.userRoleText}>
                      {user.role === "admin"
                        ? "Superadmin"
                        : "Standart Kullanıcı"}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedUserForPassword(user);
                      setPasswordModalVisible(true);
                    }}
                    style={styles.editUserBtn}
                  >
                    <Key size={20} color="#4f46e5" />
                  </TouchableOpacity>

                  {String(user.id || user._id) !==
                    String(currentUser.id || currentUser._id) && (
                    <TouchableOpacity
                      onPress={() => handleDeleteUser(user.id || user._id)}
                      style={styles.deleteUserBtn}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: KATEGORİ DÜZENLEME MODALI */}
      <Modal
        visible={editCatModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Edit2 size={24} color="#4f46e5" />
              <Text style={styles.modalTitle}>Kategoriyi Düzenle</Text>
            </View>

            <Text style={styles.inputLabel}>Kategori Adı</Text>
            <TextInput
              style={styles.input}
              value={editCatForm.name}
              onChangeText={(t) => setEditCatForm({ ...editCatForm, name: t })}
              placeholder="Örn: MARKET"
              autoCapitalize="characters"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Tür Seçimi</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  editCatForm.type === "GİDER" && styles.typeBtnExpenseActive,
                ]}
                onPress={() =>
                  setEditCatForm({ ...editCatForm, type: "GİDER" })
                }
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    editCatForm.type === "GİDER" && styles.textExpense,
                  ]}
                >
                  Gider
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  editCatForm.type === "GELİR" && styles.typeBtnIncomeActive,
                ]}
                onPress={() =>
                  setEditCatForm({ ...editCatForm, type: "GELİR" })
                }
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    editCatForm.type === "GELİR" && styles.textIncome,
                  ]}
                >
                  Gelir
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditCatModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleUpdateCategory}
                disabled={isUpdatingCat}
              >
                {isUpdatingCat ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ŞİFRE DEĞİŞTİRME MODALI */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Key size={24} color="#4f46e5" />
              <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              <Text style={{ fontWeight: "bold" }}>
                {selectedUserForPassword?.username}
              </Text>{" "}
              kullanıcısı için yeni bir şifre belirleyin.
            </Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Yeni Şifre"
              secureTextEntry
              autoFocus
              placeholderTextColor="#94a3b8"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setNewPassword("");
                }}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "bold", color: "#64748b" },
  tabTextActive: { color: "#4f46e5" },

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
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
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },

  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 4,
    borderRadius: 16,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  typeBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typeBtnExpenseActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typeBtnIncomeActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typeBtnText: { fontWeight: "bold", color: "#64748b" },
  textExpense: { color: "#dc2626" },
  textIncome: { color: "#16a34a" },

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

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
  },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipGlobal: { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" },
  chipExpense: { backgroundColor: "#ffffff", borderColor: "#e2e8f0" },
  chipIncome: { backgroundColor: "#ffffff", borderColor: "#e2e8f0" },
  chipText: { fontSize: 13, fontWeight: "bold", color: "#475569" },
  chipTextGlobal: { color: "#0369a1" }, // Sistem kategorilerindeki yazı rengini biraz daha koyu mavi yaptık

  chipActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
    gap: 6,
  },
  actionIconBtn: { padding: 2 },
  actionDivider: { width: 1, height: 12, backgroundColor: "#e2e8f0" },
  lockIconContainer: {
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#bae6fd",
  },

  sectionTitleList: {
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
  usernameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    textTransform: "capitalize",
  },
  userRoleText: { fontSize: 12, fontWeight: "600", color: "#64748b" },

  actionButtonsRow: { flexDirection: "row", gap: 8 },
  editUserBtn: { padding: 8, backgroundColor: "#e0e7ff", borderRadius: 12 },
  deleteUserBtn: { padding: 8, backgroundColor: "#fef2f2", borderRadius: 12 },

  // Ortak Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: { color: "#64748b", fontWeight: "bold", fontSize: 16 },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    alignItems: "center",
  },
  modalSubmitText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
});
