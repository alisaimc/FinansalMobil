import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react-native";
import { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import apiClient from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

// Component yolları senin projene göre ayarlandı
import InteractiveClock from "../../components/InteractiveClock";
import WeatherBackground from "../../components/WeatherBackground";

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { currentUser } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ net: 0, income: 0, expense: 0 });
  const [chartData, setChartData] = useState({
    labels: ["Oca", "Şub", "Mar", "Nis", "May", "Haz"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0] }],
  });

  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const currentYear = String(now.getFullYear());
  const currentYearMonth = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const calculateSummaryAndChart = (data) => {
    // 1. Bu ayın özetini hesapla
    const currentMonthData = data.filter(
      (t) => t.date && t.date.substring(0, 7) === currentYearMonth,
    );

    const income = currentMonthData
      .filter((t) => t.type === "GELİR")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const expense = currentMonthData
      .filter((t) => t.type === "GİDER")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    setSummary({ income, expense, net: income - expense });

    // 2. Yıllık grafik verisini hazırla (İlk 6 ay: Oca - Haz)
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"];
    const monthlyNet = [0, 0, 0, 0, 0, 0];

    data.forEach((t) => {
      if (t.date && t.date.startsWith(currentYear)) {
        const monthIndex = parseInt(t.date.substring(5, 7), 10) - 1;
        if (monthIndex < 6) {
          const amount = parseFloat(t.amount || 0);
          if (t.type === "GELİR") monthlyNet[monthIndex] += amount;
          if (t.type === "GİDER") monthlyNet[monthIndex] -= amount;
        }
      }
    });

    setChartData({
      labels: months,
      datasets: [
        {
          // 0 değerlerinde grafiğin çökmemesi için ufak bir hack
          data: monthlyNet.map((val) => (val === 0 ? 0.1 : val)),
        },
      ],
    });
  };

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/transaction");
      const allTransactions = response.data;

      setTransactions(allTransactions);
      calculateSummaryAndChart(allTransactions);
    } catch (error) {
      console.error("Veriler çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions]),
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Veriler güncelleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. KATMAN: HAVA DURUMU ARKA PLANI (En altta durur) */}
      <WeatherBackground />

      {/* 2. KATMAN: SAYFA İÇERİĞİ */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Karşılama Başlığı ve İnteraktif Saat */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.7}
          >
            {currentUser?.profilePhoto ? (
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

            <View>
              <Text style={styles.greeting}>Merhaba,</Text>
              <Text style={styles.username}>
                {currentUser?.username
                  ? currentUser.username.toUpperCase()
                  : "KULLANICI"}
              </Text>
            </View>
          </TouchableOpacity>

          <InteractiveClock />
        </View>

        {/* ANA KART: NET DURUM */}
        <View
          style={[
            styles.mainCard,
            summary.net >= 0 ? styles.bgGreenLight : styles.bgRedLight,
          ]}
        >
          <View style={styles.mainCardHeader}>
            <View
              style={[
                styles.iconWrapper,
                summary.net >= 0 ? styles.iconGreen : styles.iconRed,
              ]}
            >
              <Wallet
                size={32}
                color={summary.net >= 0 ? "#16a34a" : "#dc2626"}
              />
            </View>
            <Text style={styles.mainCardTitle}>Net Durum (Bu Ay)</Text>
          </View>
          <Text
            style={[
              styles.mainCardAmount,
              summary.net >= 0 ? styles.textGreen : styles.textRed,
            ]}
          >
            {summary.net > 0 ? "+" : ""}
            {formatCurrency(summary.net)}
          </Text>
        </View>

        {/* ALT KARTLAR: GELİR VE GİDER */}
        <View style={styles.rowCards}>
          <View style={styles.subCard}>
            <View style={[styles.subIconWrapper, styles.bgGreenLight]}>
              <ArrowUpCircle size={24} color="#16a34a" />
            </View>
            <Text style={styles.subCardTitle}>Toplam Gelir</Text>
            <Text style={[styles.subCardAmount, styles.textGreen]}>
              {formatCurrency(summary.income)}
            </Text>
          </View>

          <View style={styles.subCard}>
            <View style={[styles.subIconWrapper, styles.bgRedLight]}>
              <ArrowDownCircle size={24} color="#dc2626" />
            </View>
            <Text style={styles.subCardTitle}>Toplam Gider</Text>
            <Text style={[styles.subCardAmount, styles.textRed]}>
              {formatCurrency(summary.expense)}
            </Text>
          </View>
        </View>

        {/* GRAFİK BÖLÜMÜ */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {currentYear} Yılı Net Durum (İlk 6 Ay)
          </Text>
          <BarChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel="₺"
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: { borderRadius: 16 },
              barPercentage: 0.6,
            }}
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748b", fontWeight: "bold" },
  safeArea: { flex: 1, backgroundColor: "transparent" }, // Arka planda hava durumu efekti için transparan yapıldı
  container: { flex: 1 },
  content: { padding: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    zIndex: 100,
  },
  profileButton: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  greeting: { fontSize: 16, color: "#64748b", fontWeight: "600" },
  username: {
    fontSize: 24,
    color: "#1e293b",
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bgGreenLight: { backgroundColor: "#dcfce7" },
  bgRedLight: { backgroundColor: "#fee2e2" },
  textGreen: { color: "#16a34a" },
  textRed: { color: "#dc2626" },
  mainCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mainCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginRight: 16,
  },
  mainCardTitle: { fontSize: 16, fontWeight: "bold", color: "#475569" },
  mainCardAmount: { fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  rowCards: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  subCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  subIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  subCardTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 4,
  },
  subCardAmount: { fontSize: 20, fontWeight: "900" },

  chartContainer: {
    marginTop: 24,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
    alignSelf: "flex-start",
  },
});
