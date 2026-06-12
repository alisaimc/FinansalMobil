import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
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
import { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as XLSX from "xlsx";
import apiClient from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

// YENİ EKLENDİ: Tarih Seçici
import { Picker } from "@react-native-picker/picker";

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

// Sadece bu yılı ve geçmiş 4 yılı (toplam 5 yıl) listeler. Gelecek yılları filtreye dahil etmez.
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - 4 + i));

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

  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // YENİ: Takvim State'leri
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const currentMonthTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (!t.date) return false;
        const [tYear, tMonth] = t.date.split("-");
        return tMonth === selectedMonth && tYear === selectedYear;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth, selectedYear]);

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
                  date: `${selectedYear}-${selectedMonth}-${String(
                    adjustedDay,
                  ).padStart(2, "0")}`,
                };
              });

              const response = await apiClient.post(
                "/api/transaction",
                newTransactions,
              );
              const savedData =
                response.data && Array.isArray(response.data)
                  ? response.data
                  : newTransactions;
              setTransactions((prev) => [...savedData, ...prev]);

              Alert.alert(
                "Başarılı",
                `${newTransactions.length} kayıt başarıyla aktarıldı!`,
              );
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

  const formatMoneyForInput = (numStr) => {
    if (!numStr) return "";
    let stringVal = String(numStr).replace(".", ",");
    const parts = stringVal.split(",");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decPart = parts.length > 1 ? `,${parts[1].slice(0, 2)}` : "";
    return intPart + decPart;
  };

  const openForm = (t = null) => {
    let initialDate = new Date();
    let displayDate = `${String(initialDate.getDate()).padStart(
      2,
      "0",
    )}.${String(initialDate.getMonth() + 1).padStart(
      2,
      "0",
    )}.${initialDate.getFullYear()}`;

    if (t && t.date) {
      displayDate = t.date.split("-").reverse().join(".");
    } else {
      displayDate = `01.${selectedMonth}.${selectedYear}`;
    }

    setFormData(
      t
        ? {
            id: t._id || t.id,
            type: t.type,
            categoryId: t.categoryId,
            date: displayDate,
            amount: formatMoneyForInput(t.amount),
            description: t.description || "",
          }
        : {
            id: null,
            type: "GİDER",
            categoryId: "",
            date: displayDate,
            amount: "",
            description: "",
          },
    );

    setIsFormOpen(true);
  };

  const handleAmountChange = (text) => {
    let cleaned = text.replace(/[^0-9,]/g, "");

    const commaCount = (cleaned.match(/,/g) || []).length;
    if (commaCount > 1) {
      cleaned = cleaned.substring(0, cleaned.lastIndexOf(","));
    }

    const rawNumber = parseFloat(cleaned.replace(",", "."));
    if (rawNumber > 999999.99) return;

    let formatted = cleaned;
    if (cleaned.includes(",")) {
      const parts = cleaned.split(",");
      const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const decPart = parts[1].slice(0, 2);
      formatted = `${intPart},${decPart}`;
    } else {
      formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    setFormData({ ...formData, amount: formatted });
  };

  const handleTransactionSubmit = async () => {
    if (!formData.categoryId)
      return Alert.alert("Uyarı", "Lütfen bir kategori seçin.");
    if (!formData.amount)
      return Alert.alert("Uyarı", "Lütfen bir tutar girin.");

    setIsSubmitting(true);
    try {
      const [day, month, year] = formData.date.split(".");
      const dbDate = `${year}-${month}-${day}`;

      const parsedAmount = parseFloat(
        formData.amount.replace(/\./g, "").replace(",", "."),
      );

      const selectedCat = categories.find(
        (c) => String(c._id || c.id) === String(formData.categoryId),
      );
      const payload = {
        ...formData,
        date: dbDate,
        amount: parsedAmount,
        categoryName: selectedCat ? selectedCat.name : formData.categoryId,
      };

      const response = await apiClient.post("/api/transaction", payload);

      const savedTransaction = response.data || payload;
      if (formData.id) {
        setTransactions((prev) =>
          prev.map((t) =>
            String(t._id || t.id) === String(formData.id)
              ? savedTransaction
              : t,
          ),
        );
      } else {
        setTransactions((prev) => [savedTransaction, ...prev]);
      }

      Alert.alert(
        "Başarılı",
        formData.id ? "Kayıt güncellendi!" : "Kayıt eklendi!",
      );
      setIsFormOpen(false);
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

  const handleExportExcel = async () => {
    try {
      const headers = ["Tür", "Kategori", "Tarih", "Tutar (TL)", "Açıklama"];
      const rows = currentMonthTransactions.map((t) => {
        const cat = categories.find(
          (c) => String(c._id || c.id) === String(t.categoryId),
        );
        return [
          t.type,
          cat ? cat.name : t.categoryName || "Bilinmeyen",
          t.date.split("-").reverse().join("."),
          t.amount,
          t.description || "",
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Kayitlar");
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      const uri =
        FileSystem.cacheDirectory +
        `Finans_${selectedMonth}_${selectedYear}.xlsx`;
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: "base64" });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Hata", "Excel oluşturulurken bir sorun oluştu.");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = [
        ["KATEGORI_ID", "TARIH(YYYY-MM-DD)", "TUTAR", "ACIKLAMA"],
        [
          "Örnek_ID_Buraya_Kopyalayin",
          "2026-06-15",
          1500.5,
          "İsteğe Bağlı Açıklama",
        ],
      ];
      const referenceData = [["KATEGORI_ADI", "KATEGORI_ID", "TUR"]];
      categories.forEach((c) =>
        referenceData.push([c.name, c._id || c.id, c.type]),
      );

      const wb = XLSX.utils.book_new();
      const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
      const wsReference = XLSX.utils.aoa_to_sheet(referenceData);
      wsTemplate["!cols"] = [
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 40 },
      ];
      wsReference["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsTemplate, "Veri Girişi");
      XLSX.utils.book_append_sheet(wb, wsReference, "Kategori ID Listesi");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const uri = FileSystem.cacheDirectory + "Iceri_Aktarma_Sablonu.xlsx";
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: "base64" });
      await Sharing.shareAsync(uri, { dialogTitle: "Şablonu İndir" });
    } catch (error) {
      Alert.alert("Hata", "Şablon oluşturulurken bir sorun meydana geldi.");
    }
  };

  const handleImportExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.type === "cancel") return;

      let fileUri = result.assets ? result.assets[0].uri : result.uri;
      if (!fileUri) return Alert.alert("Hata", "Dosya yolu okunamadı.");
      if (
        !fileUri.toLowerCase().endsWith(".xlsx") &&
        !fileUri.toLowerCase().endsWith(".xls")
      ) {
        return Alert.alert("Geçersiz Dosya", "Lütfen Excel dosyası seçin.");
      }

      let fileData;
      try {
        fileData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: "base64",
        });
      } catch (e) {
        fileData = await FileSystem.readAsStringAsync(decodeURI(fileUri), {
          encoding: "base64",
        });
      }

      const wb = XLSX.read(fileData, { type: "base64" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const parsedData = [];
      const localDuplicates = new Set();
      let errorMsg = "";

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const catId = row["KATEGORI_ID"]?.toString().trim();
        const date = row["TARIH(YYYY-MM-DD)"]?.toString().trim();
        const amount = row["TUTAR"];
        const desc = row["ACIKLAMA"]?.toString().trim();

        if (catId === "Örnek_ID_Buraya_Kopyalayin") continue;
        if (!catId && !date && !amount) continue;

        if (!catId || !date || amount === "" || amount === undefined) {
          errorMsg = `Satır ${i + 2}: ID, Tarih ve Tutar zorunludur!`;
          break;
        }

        const category = categories.find(
          (c) => String(c._id || c.id) === String(catId),
        );
        if (!category) {
          errorMsg = `Satır ${i + 2}: Geçersiz Kategori ID'si!`;
          break;
        }

        const yearMonth = date.substring(0, 7);
        const uniqueKey = `${catId}-${yearMonth}`;
        if (localDuplicates.has(uniqueKey)) {
          errorMsg = `Satır ${i + 2}: Aynı ay ve kategoride mükerrer kayıt var.`;
          break;
        }
        localDuplicates.add(uniqueKey);

        const existsInDb = transactions.some((t) => {
          const tYearMonth = t.date ? t.date.substring(0, 7) : "";
          return (
            String(t.categoryId) === String(catId) && tYearMonth === yearMonth
          );
        });

        if (existsInDb) {
          errorMsg = `Satır ${i + 2}: Bu kayıt sistemde zaten mevcut!`;
          break;
        }

        parsedData.push({
          categoryId: catId,
          categoryName: category.name,
          date: date,
          amount: parseFloat(amount.toString().replace(",", ".")),
          description: desc || "",
          type: category.type,
        });
      }

      if (errorMsg) return Alert.alert("Hatalı Veri", errorMsg);
      if (parsedData.length === 0)
        return Alert.alert("Boş Dosya", "Yüklenecek veri bulunamadı.");

      const response = await apiClient.post("/api/transaction", parsedData);

      if (response.status === 200 || response.status === 201) {
        const savedArray =
          response.data && Array.isArray(response.data)
            ? response.data
            : parsedData;
        setTransactions((prev) => [...savedArray, ...prev]);
        Alert.alert(
          "Başarılı!",
          `${parsedData.length} adet kayıt listeye eklendi.`,
        );
      } else {
        throw new Error("Kayıt başarısız.");
      }
    } catch (error) {
      Alert.alert("Sistem Hatası", "Dosya işlenirken sorun oluştu.");
    }
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

      {currentUser?.role === "admin" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExportExcel}
          >
            <Text style={styles.actionBtnText}>Dışa Aktar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.templateBtn}
            onPress={handleDownloadTemplate}
          >
            <Text style={styles.actionBtnText}>Şablon</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.importBtn}
            onPress={handleImportExcel}
          >
            <Text style={[styles.actionBtnText, { color: "#475569" }]}>
              Yükle
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterCard}>
        <View style={styles.filterRow}>
          <Calendar size={20} color="#64748b" />
          <TouchableOpacity
            onPress={() => setIsYearModalOpen(true)}
            style={styles.yearDropdown}
          >
            <Text style={styles.yearDropdownText}>{selectedYear}</Text>
            <ChevronDown size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
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

      {currentUser?.role === "admin" && (
        <TouchableOpacity style={styles.fab} onPress={() => openForm()}>
          <Plus size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

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

      <Modal visible={isFormOpen} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.formModalContent,
              { maxHeight: Platform.OS === "ios" ? "90%" : "95%" },
            ]}
          >
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
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }} // EKLENDİ: Klavye açıldığında en alttaki input rahat görünsün diye boşluk
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

              <Text style={styles.inputLabel}>Tarih</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={{ color: "#1e293b", fontSize: 16, fontWeight: "bold" }}
                >
                  {formData.date}
                </Text>
              </TouchableOpacity>

              {/* YENİ ÖZELLEŞTİRİLMİŞ DİNAMİK TEKERLEK SEÇİCİ */}
              {showDatePicker && (
                <View
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 16,
                    padding: 8,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                  }}
                >
                  {/* Gün, Ay, Yıl başlık satırı */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-around",
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      GÜN
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      AY
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      YIL
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* 1. SÜTUN: GÜN SEÇİCİ */}
                    <Picker
                      selectedValue={
                        formData.date ? formData.date.split(".")[0] : "01"
                      }
                      style={{ flex: 1 }}
                      itemStyle={{
                        fontSize: 16,
                        color: "#1e293b",
                        fontWeight: "bold",
                      }}
                      onValueChange={(itemValue) => {
                        const [_, currentM, currentY] =
                          formData.date.split(".");
                        setFormData({
                          ...formData,
                          date: `${itemValue}.${currentM}.${currentY}`,
                        });
                      }}
                    >
                      {Array.from(
                        {
                          length: new Date(
                            parseInt(
                              formData.date
                                ? formData.date.split(".")[2]
                                : currentYear,
                            ),
                            parseInt(
                              formData.date
                                ? formData.date.split(".")[1]
                                : "01",
                            ),
                            0,
                          ).getDate(),
                        },
                        (_, i) => String(i + 1).padStart(2, "0"),
                      ).map((d) => (
                        <Picker.Item key={d} label={d} value={d} />
                      ))}
                    </Picker>

                    {/* 2. SÜTUN: AY SEÇİCİ */}
                    <Picker
                      selectedValue={
                        formData.date ? formData.date.split(".")[1] : "01"
                      }
                      style={{ flex: 1 }}
                      itemStyle={{
                        fontSize: 16,
                        color: "#1e293b",
                        fontWeight: "bold",
                      }}
                      onValueChange={(itemValue) => {
                        const [currentD, _, currentY] =
                          formData.date.split(".");
                        const maxDays = new Date(
                          parseInt(currentY),
                          parseInt(itemValue),
                          0,
                        ).getDate();
                        const adjustedDay = Math.min(
                          parseInt(currentD),
                          maxDays,
                        );
                        const adjustedDayStr = String(adjustedDay).padStart(
                          2,
                          "0",
                        );

                        setFormData({
                          ...formData,
                          date: `${adjustedDayStr}.${itemValue}.${currentY}`,
                        });
                      }}
                    >
                      {MONTHS.map((m) => (
                        <Picker.Item
                          key={m.value}
                          label={m.label}
                          value={m.value}
                        />
                      ))}
                    </Picker>

                    {/* 3. SÜTUN: YIL SEÇİCİ (Sadece filtrenizdeki yıllar listelenir) */}
                    <Picker
                      selectedValue={
                        formData.date
                          ? formData.date.split(".")[2]
                          : String(currentYear)
                      }
                      style={{ flex: 1 }}
                      itemStyle={{
                        fontSize: 16,
                        color: "#1e293b",
                        fontWeight: "bold",
                      }}
                      onValueChange={(itemValue) => {
                        const [currentD, currentM, _] =
                          formData.date.split(".");
                        const maxDays = new Date(
                          parseInt(itemValue),
                          parseInt(currentM),
                          0,
                        ).getDate();
                        const adjustedDay = Math.min(
                          parseInt(currentD),
                          maxDays,
                        );
                        const adjustedDayStr = String(adjustedDay).padStart(
                          2,
                          "0",
                        );

                        setFormData({
                          ...formData,
                          date: `${adjustedDayStr}.${currentM}.${itemValue}`,
                        });
                      }}
                    >
                      {YEARS.map((y) => (
                        <Picker.Item key={y} label={y} value={y} />
                      ))}
                    </Picker>
                  </View>

                  {/* Seçimi Onaylama Butonu */}
                  <TouchableOpacity
                    onPress={() => {
                      const [d, m, y] = formData.date.split(".");
                      const selectedDateObj = new Date(
                        parseInt(y),
                        parseInt(m) - 1,
                        parseInt(d),
                      );
                      if (selectedDateObj > new Date()) {
                        const today = new Date();
                        const todayStr = `${String(today.getDate()).padStart(
                          2,
                          "0",
                        )}.${String(today.getMonth() + 1).padStart(
                          2,
                          "0",
                        )}.${today.getFullYear()}`;
                        setFormData({ ...formData, date: todayStr });
                        Alert.alert(
                          "Uyarı",
                          "Gelecek bir tarihe kayıt giremezsiniz. Tarih bugüne ayarlandı.",
                        );
                      }
                      setShowDatePicker(false);
                    }}
                    style={{
                      backgroundColor: "#e0e7ff",
                      padding: 12,
                      borderRadius: 12,
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ color: "#4f46e5", fontWeight: "bold" }}>
                      Tarihi Onayla ve Kapat
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.inputLabel}>Tutar (₺)</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={handleAmountChange}
                placeholder="Örn: 1.500,50"
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
            </ScrollView>
            {/* DEĞİŞİKLİK BURADA: Kaydet butonu ScrollView dışına çıkarıldı! */}
            <View
              style={{
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: "#f1f5f9",
                marginTop: 8,
              }}
            >
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
            </View>
          </View>
        </KeyboardAvoidingView>
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

  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateBtn: {
    flex: 1,
    backgroundColor: "#f59e0b",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  importBtn: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  actionBtnText: { fontWeight: "bold", color: "#ffffff", fontSize: 13 },

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

  listContainer: { paddingHorizontal: 20, paddingBottom: 80 },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 20,
  },

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
    marginBottom: Platform.OS === "ios" ? 20 : 0,
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
