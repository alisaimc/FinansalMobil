import { LayoutDashboard, ListOrdered, Settings } from "lucide-react-native";
import { useContext, useState } from "react";
import {
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Gerçek Ekran Bileşenleri
import { AuthContext } from "../context/AuthContext";
import DashboardScreen from "./DashboardScreen";
import ListScreen from "./ListScreen";
import SettingsScreen from "./SettingsScreen";

export default function MainScreen() {
  const { currentUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardScreen />;
      case "list":
        return <ListScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* AKTİF EKRAN İÇERİĞİ */}
        <View style={styles.content}>{renderContent()}</View>

        {/* ALT NAVİGASYON BARI */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard
              size={24}
              color={activeTab === "dashboard" ? "#4f46e5" : "#94a3b8"}
            />
            <Text
              style={[
                styles.navText,
                activeTab === "dashboard" && styles.navTextActive,
              ]}
            >
              Özet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab("list")}
          >
            <ListOrdered
              size={24}
              color={activeTab === "list" ? "#4f46e5" : "#94a3b8"}
            />
            <Text
              style={[
                styles.navText,
                activeTab === "list" && styles.navTextActive,
              ]}
            >
              Kayıtlar
            </Text>
          </TouchableOpacity>

          {/* Sadece Adminlere Görünür */}
          {currentUser?.role === "admin" && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab("settings")}
            >
              <Settings
                size={24}
                color={activeTab === "settings" ? "#4f46e5" : "#94a3b8"}
              />
              <Text
                style={[
                  styles.navText,
                  activeTab === "settings" && styles.navTextActive,
                ]}
              >
                Ayarlar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 85 : 70, // iOS'ta çentik alanı için biraz daha uzun
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  navText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 4,
  },
  navTextActive: {
    color: "#4f46e5",
    fontWeight: "800",
  },
});
