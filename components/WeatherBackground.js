import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function WeatherBackground({ city }) {
  const [weatherData, setWeatherData] = useState({ type: "clear", temp: null });

  // Standart şehir (Bursa) eğer dışarıdan gelmezse
  const defaultCity = { name: "Bursa", lat: 40.1824, lon: 29.0669 };
  const currentCity = city || defaultCity;

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${currentCity.lat}&longitude=${currentCity.lon}&current_weather=true`,
    )
      .then((res) => res.json())
      .then((data) => {
        const code = data.current_weather.weathercode;
        const temp = data.current_weather.temperature;
        let type = "clear";

        if ([71, 73, 75, 77, 85, 86].includes(code)) type = "snow";
        else if (
          [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)
        )
          type = "rain";
        else if ([1, 2, 3, 45, 48].includes(code)) type = "clouds";

        setWeatherData({ type, temp });
      })
      .catch((err) => console.log("Hava durumu çekilemedi", err));
  }, [currentCity]);

  // Hava durumuna göre arka plan geçiş renkleri
  const bgGradients = {
    snow: ["#bae6fd", "#e2e8f0", "#7dd3fc"],
    rain: ["#64748b", "#94a3b8", "#cbd5e1"],
    clouds: ["#cbd5e1", "#e2e8f0", "#f1f5f9"],
    clear: ["#f0fdfa", "#fefce8", "#e0e7ff"],
  };

  const weatherIcons = { snow: "❄️", rain: "🌧️", clouds: "☁️", clear: "☀️" };

  return (
    <>
      {/* ARKA PLAN RENGİ */}
      <LinearGradient
        colors={bgGradients[weatherData.type]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* HAVA DURUMU KARTI (SAĞ ALT KÖŞE) */}
      {weatherData.temp !== null && (
        <View style={styles.weatherCard}>
          <View style={styles.weatherInfo}>
            <Text style={styles.cityText}>
              {currentCity.name.toUpperCase()}
            </Text>
            <Text style={styles.tempText}>{weatherData.temp}°C</Text>
          </View>
          <Text style={styles.iconText}>{weatherIcons[weatherData.type]}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  weatherCard: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
    // iOS Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android Gölge
    elevation: 5,
  },
  weatherInfo: { flexDirection: "col" },
  cityText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
  },
  tempText: { fontSize: 16, fontWeight: "900", color: "#334155" },
  iconText: { fontSize: 24 },
});
