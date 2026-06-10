import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Edit2,
  ListOrdered,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import apiClient from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

const MONTHS = [
  { value: "01", label: "Ocak" },
  { value: "02", label: "Şubat" },
  { value: "03", label: "Mart" },
  { value: "04", label: "Nisan" },
  { value: "05", label: "Mayıs" },
  { value: "06", label: "Haziran" },
  { value: "07", label: "Temmuz" },
  { value: "08", label: "Ağustos" },
  { value: "09", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - 3 + i));

export default function ListScreen({ navigation }) {
  const { currentUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  // Modallar
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    type: "GİDER",
    categoryId: "",
    date: "",
    amount: "",
    description: "",
  });

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

  // --- FİLTRELEME VE HESAPLAMA ---
  const currentMonthTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (!t.date) return false;
        const [tYear, tMonth] = t.date.split("-");
        return tMonth === selectedMonth && tYear === selectedYear;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth, selectedYear]);

  // --- GEÇEN AYDAN AKTARMA MANTIĞI ---
  const { prevMonthStr, prevYearStr } = useMemo(() => {
    let m = parseInt(selectedMonth) - 1;
    let y = parseInt(selectedYear);
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    return { prevMonthStr: String(m).padStart(2, "0"), prevYearStr: String(y) };
  }, [selectedMonth, selectedYear]);

  const previousMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.date) return false;
      const [tYear, tMonth] = t.date.split("-");
      return tMonth === prevMonthStr && tYear === prevYearStr;
    });
  }, [transactions, prevMonthStr, prevYearStr]);

  const canCopyFromPreviousMonth =
    currentMonthTransactions.length === 0 &&
    previousMonthTransactions.length > 0;

  const handleCopyFromPreviousMonth = () => {
    const currentMonthLabel = MONTHS.find(
      (m) => m.value === selectedMonth,
    )?.label;
    Alert.alert(
      "Kayıtları Aktar",
      `Önceki aya ait ${previousMonthTransactions.length} adet kayıt bu aya (${currentMonthLabel} ${selectedYear}) kopyalanacak. Onaylıyor musunuz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Aktar",
          style: "default",
          onPress: async () => {
            setIsCopying(true);
            try {
              const newTransactions = previousMonthTransactions.map((t) => {
                const parts = t.date.split("-");
                let dayStr = parts[2] || "01";
                const maxDaysInTargetMonth = new Date(
                  parseInt(selectedYear),
                  parseInt(selectedMonth),
                  0,
                ).getDate();
                const adjustedDay = Math.min(
                  parseInt(dayStr, 10),
                  maxDaysInTargetMonth,
                );
                return {
                  categoryId: t.categoryId,
                  categoryName: t.categoryName,
                  amount: t.amount,
                  description: t.description,
                  type: t.type,
                  date: `${selectedYear}-${selectedMonth}-${String(adjustedDay).padStart(2, "0")}`,
                };
              });
              await apiClient.post("/api/transaction", newTransactions);
              Alert.alert(
                "Başarılı",
                `${newTransactions.length} kayıt başarıyla aktarıldı!`,
              );
              fetchData();
            } catch (error) {
              Alert.alert("Hata", "Kayıtlar kopyalanırken hata oluştu.");
            } finally {
              setIsCopying(false);
            }
          },
        },
      ],
    );
  };

  // --- FORM İŞLEMLERİ (EKLE/DÜZENLE) ---
  const openForm = (t = null) => {
    setFormData(
      t
        ? {
            id: t._id || t.id,
            type: t.type,
            categoryId: t.categoryId,
            date: t.date,
            amount: String(t.amount),
            description: t.description || "",
          }
        : {
            id: null,
            type: "GİDER",
            categoryId: "",
            date: `${selectedYear}-${selectedMonth}-01`,
            amount: "",
            description: "",
          },
    );
    setIsFormOpen(true);
  };

  const handleTransactionSubmit = async () => {
    if (!formData.categoryId)
      return Alert.alert("Uyarı", "Lütfen bir kategori seçin.");
    if (!formData.date || !formData.amount)
      return Alert.alert("Uyarı", "Tarih ve Tutar zorunludur.");

    setIsSubmitting(true);
    try {
      const selectedCat = categories.find(
        (c) => String(c._id || c.id) === String(formData.categoryId),
      );
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount.replace(",", ".")),
        categoryName: selectedCat ? selectedCat.name : formData.categoryId,
      };

      const response = await apiClient.post("/api/transaction", payload);

      Alert.alert(
        "Başarılı",
        formData.id ? "Kayıt güncellendi!" : "Kayıt eklendi!",
      );
      setIsFormOpen(false);
      fetchData(); // Listeyi yenile
    } catch (error) {
      Alert.alert("Hata", "İşlem sırasında bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = (id) => {
    Alert.alert("Kaydı Sil", "Bu işlemi silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const prev = [...transactions];
          setTransactions(
            transactions.filter((t) => String(t._id || t.id) !== String(id)),
          );
          try {
            await apiClient.delete(`/api/transaction?id=${id}`);
          } catch (err) {
            setTransactions(prev);
            Alert.alert("Hata", "Silme işlemi başarısız.");
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  const currentTypeCategories = categories.filter(
    (c) => c.type === formData.type,
  );

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
        <ListOrdered size={28} color="#4f46e5" />
        <Text style={styles.headerTitle}>İşlem Kayıtları</Text>
      </View>

      {/* FİLTRE KARTI (Yıl Combobox ve Ay Seçici) */}
      <View style={styles.filterCard}>
        <View style={styles.filterRow}>
          <Calendar size={20} color="#64748b" />

          {/* Yıl Combobox Butonu */}
          <TouchableOpacity
            onPress={() => setIsYearModalOpen(true)}
            style={styles.yearDropdown}
          >
            <Text style={styles.yearDropdownText}>{selectedYear}</Text>
            <ChevronDown size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Aylar Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.monthsScroll}
        >
          {MONTHS.map((m) => (
            <TouchableOpacity
              key={m.value}
              onPress={() => setSelectedMonth(m.value)}
              style={[
                styles.monthChip,
                selectedMonth === m.value && styles.monthChipActive,
              ]}
            >
              <Text
                style={[
                  styles.monthText,
                  selectedMonth === m.value && styles.monthTextActive,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* GEÇEN AYDAN AKTAR BUTONU */}
      {canCopyFromPreviousMonth && currentUser?.role === "admin" && (
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyFromPreviousMonth}
          disabled={isCopying}
        >
          {isCopying ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Copy size={18} color="#ffffff" />
          )}
          <Text style={styles.copyButtonText}>
            {isCopying ? "Aktarılıyor..." : "Geçen Aydan Kayıtları Aktar"}
          </Text>
        </TouchableOpacity>
      )}

      {/* LİSTE */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentMonthTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <ListOrdered size={32} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>Kayıt Bulunamadı</Text>
            <Text style={styles.emptyDesc}>
              Bu döneme ait henüz bir işlem yapmadınız.
            </Text>
          </View>
        ) : (
          currentMonthTransactions.map((t) => {
            const cat = categories.find(
              (c) => String(c._id || c.id) === String(t.categoryId),
            );
            const categoryName = cat
              ? cat.name
              : t.categoryName || "Bilinmeyen";

            return (
              <View key={t._id || t.id} style={styles.transactionCard}>
                <View style={styles.tHeader}>
                  <View
                    style={[
                      styles.tBadge,
                      t.type === "GELİR"
                        ? styles.bgGreenLight
                        : styles.bgRedLight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tBadgeText,
                        t.type === "GELİR" ? styles.textGreen : styles.textRed,
                      ]}
                    >
                      {categoryName}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.tAmount,
                      t.type === "GELİR" ? styles.textGreen : styles.textRed,
                    ]}
                  >
                    {t.type === "GELİR" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </Text>
                </View>

                <View style={styles.tBody}>
                  <Text style={styles.tDate}>
                    {t.date.split("-").reverse().join(".")}
                  </Text>
                  {t.description ? (
                    <Text style={styles.tDesc} numberOfLines={1}>
                      {t.description}
                    </Text>
                  ) : null}
                </View>

                {currentUser?.role === "admin" && (
                  <View style={styles.tActions}>
                    <TouchableOpacity
                      onPress={() => openForm(t)}
                      style={[
                        styles.actionBtn,
                        { backgroundColor: "#e0e7ff", marginRight: 8 },
                      ]}
                    >
                      <Edit2 size={16} color="#4f46e5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteTransaction(t._id || t.id)}
                      style={styles.actionBtn}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB: YENİ KAYIT EKLE BUTONU (Sağ Alt Köşe) */}
      {currentUser?.role === "admin" && (
        <TouchableOpacity style={styles.fab} onPress={() => openForm()}>
          <Plus size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* MODAL: YIL COMBOBOX */}
      <Modal visible={isYearModalOpen} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsYearModalOpen(false)}
        >
          <View style={styles.yearModalContent}>
            <Text style={styles.modalTitle}>Yıl Seçiniz</Text>
            {YEARS.map((y) => (
              <TouchableOpacity
                key={y}
                style={[
                  styles.yearModalItem,
                  selectedYear === y && styles.yearModalItemActive,
                ]}
                onPress={() => {
                  setSelectedYear(y);
                  setIsYearModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.yearModalText,
                    selectedYear === y && styles.yearModalTextActive,
                  ]}
                >
                  {y}
                </Text>
                {selectedYear === y && <Check size={18} color="#4f46e5" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: YENİ KAYIT / DÜZENLE FORM */}
      <Modal visible={isFormOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {formData.id ? "Kaydı Düzenle" : "Yeni Kayıt"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsFormOpen(false)}
                style={styles.closeBtn}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: "85%" }}
            >
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    formData.type === "GİDER" && styles.typeBtnExpense,
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
                    formData.type === "GELİR" && styles.typeBtnIncome,
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

              <Text style={styles.inputLabel}>Kategori</Text>
              <View style={styles.chipContainer}>
                {currentTypeCategories.map((c) => {
                  const isSelected =
                    String(formData.categoryId) === String(c._id || c.id);
                  return (
                    <TouchableOpacity
                      key={c._id || c.id}
                      onPress={() =>
                        setFormData({ ...formData, categoryId: c._id || c.id })
                      }
                      style={[
                        styles.catChip,
                        isSelected &&
                          (formData.type === "GELİR"
                            ? styles.catChipIncome
                            : styles.catChipExpense),
                      ]}
                    >
                      {isSelected && (
                        <Check
                          size={14}
                          color={
                            formData.type === "GELİR" ? "#16a34a" : "#dc2626"
                          }
                        />
                      )}
                      <Text
                        style={[
                          styles.catChipText,
                          isSelected &&
                            (formData.type === "GELİR"
                              ? styles.textGreen
                              : styles.textRed),
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Tarih (YYYY-AA-GG)</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(t) => setFormData({ ...formData, date: t })}
                placeholder="2026-06-15"
                placeholderTextColor="#94a3b8"
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Tutar (₺)</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(t) => setFormData({ ...formData, amount: t })}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Açıklama (İsteğe bağlı)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                value={formData.description}
                multiline={true}
                onChangeText={(t) =>
                  setFormData({ ...formData, description: t })
                }
                placeholder="Notunuz..."
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleTransactionSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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

  // Yıl ve Ay Seçici
  filterCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 12,
    marginBottom: 12,
  },
  yearDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  yearDropdownText: { fontSize: 16, fontWeight: "900", color: "#1e293b" },
  monthsScroll: { flexGrow: 0 },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginRight: 8,
  },
  monthChipActive: { backgroundColor: "#4f46e5" },
  monthText: { fontSize: 13, fontWeight: "bold", color: "#64748b" },
  monthTextActive: { color: "#ffffff" },

  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1e293b",
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  copyButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },

  listContainer: { paddingHorizontal: 20, paddingBottom: 80 }, // FAB için alttan boşluk

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 8,
  },
  emptyDesc: { fontSize: 14, color: "#94a3b8", textAlign: "center" },

  transactionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  tHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tBadgeText: { fontSize: 11, fontWeight: "900" },
  tAmount: { fontSize: 18, fontWeight: "900" },
  tBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tDate: { fontSize: 13, fontWeight: "bold", color: "#94a3b8" },
  tDesc: {
    fontSize: 13,
    color: "#64748b",
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
  },
  tActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  actionBtn: { padding: 6, backgroundColor: "#fef2f2", borderRadius: 8 },

  bgGreenLight: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  bgRedLight: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  textGreen: { color: "#16a34a" },
  textRed: { color: "#dc2626" },

  // Yüzen (FAB) Ekle Butonu
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
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },

  // Ortak Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Yıl Modal Stilleri
  yearModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  yearModalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  yearModalItemActive: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  yearModalText: { fontSize: 16, fontWeight: "600", color: "#64748b" },
  yearModalTextActive: { color: "#4f46e5", fontWeight: "900" },

  // Form Modal Stilleri
  formModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    maxHeight: "90%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeBtn: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 12 },

  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 4,
    borderRadius: 16,
    marginBottom: 20,
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
  typeBtnExpense: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typeBtnIncome: {
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

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
  },
  catChipExpense: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  catChipIncome: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  catChipText: { fontSize: 13, fontWeight: "bold", color: "#475569" },

  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});
