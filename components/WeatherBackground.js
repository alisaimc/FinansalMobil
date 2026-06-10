import { LinearGradient } from "expo-linear-gradient";
import { useContext, useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { AuthContext } from "../src/context/AuthContext";

const { width, height } = Dimensions.get("window");

// 1. YAĞMUR ANİMASYONU
const RainDrop = ({ delay, left }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(translateY, {
        toValue: height + 50,
        duration: 800 + Math.random() * 400, // Hızlı düşüş
        delay: delay,
        useNativeDriver: true,
      }),
    ).start();
  }, []);
  return (
    <Animated.View
      style={[styles.rainDrop, { left, transform: [{ translateY }] }]}
    />
  );
};

// 2. KAR ANİMASYONU
const SnowFlake = ({ delay, left, size }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(translateY, {
        toValue: height + 50,
        duration: 3000 + Math.random() * 2000, // Yavaş süzülüş
        delay: delay,
        useNativeDriver: true,
      }),
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.snowFlake,
        {
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateY }],
        },
      ]}
    />
  );
};

// 3. GÜNEŞ IŞIĞI (PARLAMA) ANİMASYONU
const SunGlow = () => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return <Animated.View style={[styles.sunGlow, { transform: [{ scale }] }]} />;
};

// --- ANA BİLEŞEN ---
export default function WeatherBackground() {
  const { currentUser } = useContext(AuthContext);

  // Veritabanındaki ayarı okuma (JSON formatında saklayacağız)
  let config = { color: "grad-ocean", weather: "clear" };
  try {
    if (currentUser?.backgroundImage?.startsWith("{")) {
      config = JSON.parse(currentUser.backgroundImage);
    }
  } catch (e) {}

  // Arka Plan Renkleri
  const bgGradients = {
    "grad-ocean": ["#0ea5e9", "#3b82f6", "#2563eb"],
    "grad-sunset": ["#f59e0b", "#ef4444", "#b91c1c"],
    "grad-forest": ["#10b981", "#059669", "#047857"],
    "grad-dark": ["#1e293b", "#0f172a", "#000000"],
    "solid-purple": ["#8b5cf6", "#8b5cf6", "#8b5cf6"],
    "solid-blue": ["#3b82f6", "#3b82f6", "#3b82f6"],
    "solid-red": ["#ef4444", "#ef4444", "#ef4444"],
  };

  const colors = bgGradients[config.color] || bgGradients["grad-ocean"];

  // Ekrana rastgele dağılacak parçacık sayıları
  const particles = Array.from({ length: 30 });

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* 1. KATMAN: SABİT RENK GEÇİŞİ */}
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* 2. KATMAN: ANİMASYONLAR (Seçime Göre) */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {config.weather === "rain" &&
          particles.map((_, i) => (
            <RainDrop
              key={i}
              delay={Math.random() * 1000}
              left={Math.random() * width}
            />
          ))}

        {config.weather === "snow" &&
          particles.map((_, i) => (
            <SnowFlake
              key={i}
              delay={Math.random() * 3000}
              left={Math.random() * width}
              size={4 + Math.random() * 6}
            />
          ))}

        {config.weather === "clear" && <SunGlow />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rainDrop: {
    position: "absolute",
    top: -50,
    width: 2,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
  },
  snowFlake: {
    position: "absolute",
    top: -50,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  sunGlow: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
});
