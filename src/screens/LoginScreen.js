import { Layers, Lock, User } from "lucide-react-native";
import { useContext, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);

  // --- EKRAN DURUMLARI ---
  const [isLoginView, setIsLoginView] = useState(true);
  const [registerStep, setRegisterStep] = useState(1);

  // --- FORM STATELERİ ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  // --- ANİMASYON DEĞERLERİ ---
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- ANİMASYONLU GEÇİŞ TETİĞİ ---
  const animateTransition = (callback) => {
    // Önce formu gizle ve küçült
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Değişikliği yap
      callback();

      // Aşağıdan yukarıya doğru tekrar göster ve büyüt (Yaylanma efekti)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // --- GİRİŞ YAP FONKSİYONU ---
  const handleLogin = () => {
    if (!username || !password) {
      alert("Lütfen kullanıcı adı ve şifre girin.");
      return;
    }
    login(username, password);
  };

  // --- EKRAN GEÇİŞ FONKSİYONLARI ---
  const toggleView = (toLogin) => {
    animateTransition(() => {
      setIsLoginView(toLogin);
      if (!toLogin) setRegisterStep(1);
    });
  };

  const handleRegisterStep1 = () => {
    if (!username || !password) {
      alert("Lütfen kullanıcı adı ve şifre belirleyin.");
      return;
    }
    animateTransition(() => {
      setRegisterStep(2);
    });
  };

  const handleRegisterSubmit = () => {
    if (!workspaceName) {
      alert("Lütfen çalışma alanı (workspace) adını girin.");
      return;
    }
    alert(`Backend'e gönderilecek: ${username}, Workspace: ${workspaceName}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.headerContainer}>
        <Animated.View
          style={[
            styles.iconWrapper,
            { transform: [{ scale: scaleAnim }, { rotate: "-5deg" }] },
          ]}
        >
          {isLoginView ? (
            <User size={36} color="#ffffff" />
          ) : registerStep === 1 ? (
            <User size={36} color="#ffffff" />
          ) : (
            <Layers size={36} color="#ffffff" />
          )}
        </Animated.View>
        <Text style={styles.title}>
          {isLoginView
            ? "Hoş Geldiniz"
            : registerStep === 1
              ? "Kayıt Ol"
              : "Alanını Kur"}
        </Text>
        <Text style={styles.subtitle}>
          {isLoginView
            ? "Finans Takip sistemine giriş yapın"
            : registerStep === 1
              ? "Sisteme katılmak için bilgilerinizi girin"
              : "Mali verilerinizi tutacağınız alanı oluşturun"}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.form,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* --- GİRİŞ YAP & KAYIT OL (ADIM 1) FORMU --- */}
        {(isLoginView || (!isLoginView && registerStep === 1)) && (
          <>
            <View style={styles.inputContainer}>
              <User size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Kullanıcı Adı"
                placeholderTextColor="#94a3b8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isLoginView ? "Şifre" : "Güvenli Bir Şifre"}
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {isLoginView ? (
              <>
                <TouchableOpacity
                  style={styles.buttonMain}
                  onPress={handleLogin}
                >
                  <Text style={styles.buttonMainText}>Giriş Yap</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonSecondary}
                  onPress={() => toggleView(false)}
                >
                  <Text style={styles.buttonSecondaryText}>
                    Yeni Hesap Oluştur
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.buttonMainRegister}
                  onPress={handleRegisterStep1}
                >
                  <Text style={styles.buttonMainText}>
                    Hesabı Oluştur ve Devam Et
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonSecondary}
                  onPress={() => toggleView(true)}
                >
                  <Text style={styles.buttonSecondaryText}>
                    Giriş Ekranına Dön
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* --- KAYIT OL (ADIM 2 - WORKSPACE) FORMU --- */}
        {!isLoginView && registerStep === 2 && (
          <>
            <View style={styles.inputContainer}>
              <Layers size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Alan Adı (Örn: Merkez Bütçe)"
                placeholderTextColor="#94a3b8"
                value={workspaceName}
                onChangeText={setWorkspaceName}
              />
            </View>
            <TouchableOpacity
              style={styles.buttonMainRegister}
              onPress={handleRegisterSubmit}
            >
              <Text style={styles.buttonMainText}>Alanı Kur ve Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => animateTransition(() => setRegisterStep(1))}
            >
              <Text style={styles.buttonSecondaryText}>Geri Dön</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: 24,
  },
  headerContainer: { alignItems: "center", marginBottom: 32 },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: { fontSize: 32, fontWeight: "900", color: "#1e293b", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },
  form: { width: "100%", gap: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  buttonMain: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonMainRegister: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonMainText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  buttonSecondary: {
    backgroundColor: "#e0e7ff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  buttonSecondaryText: { color: "#4f46e5", fontSize: 16, fontWeight: "bold" },
});
