import { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// DİKKAT: SafeAreaView'i artık buradan çekiyoruz (Uyarıyı çözen kısım)
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Settings,
  Trash2,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiClient from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

export default function SettingsScreen() {
  const { currentUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "GİDER" });

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/category");
      setCategories(response.data);
    } catch (error) {
      console.error("Kategoriler çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      Alert.alert("Uyarı", "Lütfen bir kategori adı girin.");
      return;
    }

    const payload = {
      name: categoryForm.name.toLocaleUpperCase("tr-TR"),
      type: categoryForm.type,
    };

    try {
      const response = await apiClient.post("/api/category", payload);
      setCategories([...categories, response.data]);
      setCategoryForm({ name: "", type: "GİDER" });
    } catch (error) {
      Alert.alert("Hata", "Kategori eklenirken bir sorun oluştu.");
    }
  };

  const handleDeleteCategory = (id) => {
    Alert.alert(
      "Kategoriyi Sil",
      "Bu kategoriyi tamamen silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/api/category?id=${id}`);
              setCategories(
                categories.filter((c) => String(c._id || c.id) !== String(id)),
              );
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

  const incomeCategories = categories.filter((c) => c.type === "GELİR");
  const expenseCategories = categories.filter((c) => c.type === "GİDER");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Settings size={28} color="#4f46e5" />
          <Text style={styles.headerTitle}>Kategori Yönetimi</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Kategori Adı</Text>
          <TextInput
            style={styles.input}
            value={categoryForm.name}
            onChangeText={(t) => setCategoryForm({ ...categoryForm, name: t })}
            placeholder="Örn: AKARYAKIT"
            autoCapitalize="characters"
          />

          <Text style={styles.inputLabel}>Tür Seçimi</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                categoryForm.type === "GİDER" && styles.typeBtnExpenseActive,
              ]}
              onPress={() =>
                setCategoryForm({ ...categoryForm, type: "GİDER" })
              }
            >
              <ArrowDownCircle
                size={18}
                color={categoryForm.type === "GİDER" ? "#dc2626" : "#64748b"}
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
                color={categoryForm.type === "GELİR" ? "#16a34a" : "#64748b"}
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
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>Kategori Ekle</Text>
          </TouchableOpacity>
        </View>

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
                <Text style={styles.chipText}>{c.name}</Text>
                {!c.isGlobal && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(c._id || c.id)}
                    style={styles.deleteIcon}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

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
                <Text style={styles.chipText}>{c.name}</Text>
                {!c.isGlobal && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(c._id || c.id)}
                    style={styles.deleteIcon}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
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
  formCard: {
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
  deleteIcon: {
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },
});
