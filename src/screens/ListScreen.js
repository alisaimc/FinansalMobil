import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import apiClient from "../api/apiClient";

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export default function ListScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  // Tarih State'leri
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Form State'leri
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    type: "GİDER",
    categoryId: "",
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    amount: "",
    description: "",
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [transRes, catRes] = await Promise.all([
        apiClient.get("/api/transaction"),
        apiClient.get("/api/category"),
      ]);
      setTransactions(transRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const currentMonthStr = String(selectedMonth + 1).padStart(2, "0");
  const targetYearMonth = `${selectedYear}-${currentMonthStr}`;

  const currentMonthTransactions = transactions
    .filter((t) => t.date && t.date.substring(0, 7) === targetYearMonth)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleDelete = (id) => {
    Alert.alert("Emin misiniz?", "Bu kaydı silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/api/transaction?id=${id}`);
            setTransactions(transactions.filter((t) => (t._id || t.id) !== id));
          } catch (error) {
            Alert.alert("Hata", "Kayıt silinemedi.");
          }
        },
      },
    ]);
  };

  // --- FORM İŞLEMLERİ ---
  const openForm = (item = null) => {
    if (item) {
      setFormData({
        id: item._id || item.id,
        type: item.type,
        categoryId: item.categoryId,
        date: item.date,
        amount: String(item.amount),
        description: item.description || "",
      });
    } else {
      setFormData({
        id: null,
        type: "GİDER",
        categoryId: "",
        date: `${targetYearMonth}-01`,
        amount: "",
        description: "",
      });
    }
    setIsModalVisible(true);
  };

  const handleSaveTransaction = async () => {
    if (!formData.categoryId || !formData.amount || !formData.date) {
      Alert.alert(
        "Uyarı",
        "Lütfen Kategori, Tarih ve Tutar alanlarını doldurun.",
      );
      return;
    }

    const selectedCat = categories.find(
      (c) => String(c._id || c.id) === String(formData.categoryId),
    );
    const payload = {
      ...formData,
      categoryName: selectedCat ? selectedCat.name : formData.categoryId,
      amount: parseFloat(formData.amount.replace(",", ".")),
    };

    try {
      const response = await apiClient.post("/api/transaction", payload);
      const savedTransaction = response.data;
      savedTransaction.categoryName = payload.categoryName;

      if (formData.id) {
        setTransactions(
          transactions.map((t) =>
            String(t._id || t.id) === String(formData.id)
              ? savedTransaction
              : t,
          ),
        );
      } else {
        setTransactions([...transactions, savedTransaction]);
      }
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert("Hata", "Kayıt kaydedilemedi.");
    }
  };

  const currentTypeCategories = categories.filter(
    (c) => c.type === formData.type,
  );

  // --- RENDER SATIRI ---
  const renderTransactionItem = ({ item }) => {
    const isIncome = item.type === "GELİR";
    const category = categories.find(
      (c) => String(c._id || c.id) === String(item.categoryId),
    );
    const displayCategoryName = category
      ? category.name
      : item.categoryName || "SİLİNMİŞ";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.badge,
              isIncome ? styles.badgeIncome : styles.badgeExpense,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isIncome ? styles.textIncome : styles.textExpense,
              ]}
            >
              {displayCategoryName}
            </Text>
          </View>
          <Text
            style={[
              styles.amount,
              isIncome ? styles.textIncome : styles.textExpense,
            ]}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(item.amount)}
          </Text>
        </View>
        <View>
          <Text style={styles.dateText}>
            {item.date.split("-").reverse().join(".")}
          </Text>
          {item.description ? (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionButtons}>
          {" "}
          {/* <--- ÇİFT << İŞARETİ TEKE DÜŞTÜ */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => openForm(item)}
          >
            <Edit2 size={18} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDelete(item._id || item.id)}
          >
            <Trash2 size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {MONTHS[selectedMonth]} {selectedYear}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <ChevronRight size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {currentMonthTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Bu döneme ait kayıt bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={currentMonthTransactions}
          keyExtractor={(item) => String(item._id || item.id || Math.random())}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB BUTONU EKLENDİ */}
      <TouchableOpacity style={styles.fab} onPress={() => openForm()}>
        <Plus size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* MODAL (FORM) EKRANI */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formData.id ? "Kaydı Düzenle" : "Yeni Kayıt Ekle"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Gelir / Gider Butonları */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    formData.type === "GİDER" && styles.typeBtnExpenseActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, type: "GİDER", categoryId: "" })
                  }
                >
                  <ArrowDownCircle
                    size={18}
                    color={formData.type === "GİDER" ? "#dc2626" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      formData.type === "GİDER" && styles.textExpense,
                    ]}
                  >
                    Gider
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    formData.type === "GELİR" && styles.typeBtnIncomeActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, type: "GELİR", categoryId: "" })
                  }
                >
                  <ArrowUpCircle
                    size={18}
                    color={formData.type === "GELİR" ? "#16a34a" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      formData.type === "GELİR" && styles.textIncome,
                    ]}
                  >
                    Gelir
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Kategoriler (Yatay Scroll) */}
              <Text style={styles.inputLabel}>Kategori</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {currentTypeCategories.map((c) => {
                  const isSelected =
                    String(formData.categoryId) === String(c._id || c.id);
                  return (
                    <TouchableOpacity
                      key={c._id || c.id}
                      style={[
                        styles.catChip,
                        isSelected &&
                          (formData.type === "GELİR"
                            ? styles.catChipIncome
                            : styles.catChipExpense),
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, categoryId: c._id || c.id })
                      }
                    >
                      {isSelected && (
                        <Check
                          size={14}
                          color={
                            formData.type === "GELİR" ? "#15803d" : "#b91c1c"
                          }
                        />
                      )}
                      <Text
                        style={[
                          styles.catChipText,
                          isSelected &&
                            (formData.type === "GELİR"
                              ? { color: "#15803d" }
                              : { color: "#b91c1c" }),
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Tarih, Tutar, Açıklama */}
              <Text style={styles.inputLabel}>Tarih (YYYY-AA-GG)</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(t) => setFormData({ ...formData, date: t })}
                placeholder="2026-06-01"
              />

              <Text style={styles.inputLabel}>Tutar (₺)</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(t) => setFormData({ ...formData, amount: t })}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />

              <Text style={styles.inputLabel}>Açıklama</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={formData.description}
                onChangeText={(t) =>
                  setFormData({ ...formData, description: t })
                }
                multiline
                placeholder="İsteğe bağlı..."
              />

              {/* Kaydet Butonu */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveTransaction}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  navButton: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 12 },
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeIncome: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  badgeExpense: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  badgeText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  textIncome: { color: "#16a34a" },
  textExpense: { color: "#dc2626" },
  amount: { fontSize: 18, fontWeight: "900" },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "bold",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
    maxWidth: 200,
  },
  actionButtons: { flexDirection: "row", gap: 8 },
  iconButton: { padding: 6, backgroundColor: "#f8fafc", borderRadius: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 24,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  closeButton: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 20 },
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
  inputLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 8,
    marginTop: 12,
  },
  categoryScroll: { flexDirection: "row", marginBottom: 8 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
  },
  catChipExpense: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  catChipIncome: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  catChipText: { fontSize: 13, fontWeight: "bold", color: "#64748b" },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  saveButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});
