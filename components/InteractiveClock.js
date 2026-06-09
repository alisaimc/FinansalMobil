import { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export default function InteractiveClock() {
  const [time, setTime] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  // Animasyon değerleri
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timeoutId;
    const cycle = () => {
      timeoutId = setTimeout(() => {
        toggleClock(true);
        timeoutId = setTimeout(() => {
          toggleClock(false);
          cycle();
        }, 5000);
      }, 15000);
    };
    cycle();
    return () => clearTimeout(timeoutId);
  }, []);

  const toggleClock = (forceState = null) => {
    const toValue =
      forceState !== null ? (forceState ? 1 : 0) : isExpanded ? 0 : 1;
    setIsExpanded(forceState !== null ? forceState : !isExpanded);

    Animated.spring(expandAnim, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");

  const months = [
    "OCA",
    "ŞUB",
    "MAR",
    "NİS",
    "MAY",
    "HAZ",
    "TEM",
    "AĞU",
    "EYL",
    "EKİ",
    "KAS",
    "ARA",
  ];
  const monthStr = months[time.getMonth()];
  const dayNum = time.getDate();

  // Animasyon interpolasyonları (Dönüşler)
  const redRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-6deg", "0deg"],
  });
  const yellowRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["6deg", "0deg"],
  });

  // SOLA AÇILMA MANTIĞI: (Sağdan Sola -> Saniye, Dakika, Saat)
  // Saat (Kırmızı) en sola kayar (-96)
  // Dakika (Mavi) ortaya kayar (-48)
  // Saniye (Sarı) sağda sabit kalır (0)
  const redTranslateX = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -96],
  });
  const blueTranslateX = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -48],
  });

  const fadeOut = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const fadeIn = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <TouchableWithoutFeedback onPress={() => toggleClock()}>
      <View style={styles.container}>
        {/* KIRMIZI KUTU (SAAT) - En Sola Gider */}
        <Animated.View
          style={[
            styles.box,
            styles.bgRed,
            {
              transform: [{ translateX: redTranslateX }, { rotate: redRotate }],
            },
          ]}
        >
          <Text style={styles.timeText}>{hours}</Text>
        </Animated.View>

        {/* SARI KUTU (SANİYE) - Sağda Sabit Kalır */}
        <Animated.View
          style={[
            styles.box,
            styles.bgYellow,
            { transform: [{ rotate: yellowRotate }] },
          ]}
        >
          <Animated.Text style={[styles.timeText, { opacity: fadeIn }]}>
            {seconds}
          </Animated.Text>
        </Animated.View>

        {/* MAVİ KUTU (TARİH / DAKİKA) - Ortaya Gider */}
        <Animated.View
          style={[
            styles.box,
            styles.bgBlue,
            { transform: [{ translateX: blueTranslateX }] },
          ]}
        >
          {/* Kapalıyken Tarih */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.center,
              { opacity: fadeOut },
            ]}
          >
            <Text style={styles.tinyText}>{monthStr}</Text>
            <Text style={styles.dateText}>{dayNum}</Text>
          </Animated.View>
          {/* Açıkken Dakika */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.center,
              { opacity: fadeIn },
            ]}
          >
            <Text style={styles.timeText}>{minutes}</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { width: 44, height: 44, position: "relative", zIndex: 50 },
  box: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  center: { justifyContent: "center", alignItems: "center" },
  bgRed: { backgroundColor: "#ef4444", zIndex: 1 },
  bgYellow: { backgroundColor: "#fbbf24", zIndex: 2 },
  bgBlue: { backgroundColor: "#3b82f6", zIndex: 3 },
  timeText: { color: "white", fontSize: 18, fontWeight: "900" },
  dateText: { color: "white", fontSize: 16, fontWeight: "900", lineHeight: 18 },
  tinyText: { color: "rgba(255,255,255,0.9)", fontSize: 9, fontWeight: "bold" },
});
