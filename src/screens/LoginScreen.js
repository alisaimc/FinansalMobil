import { useContext, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!username || !password) {
      alert("Lütfen kullanıcı adı ve şifre girin.");
      return;
    }
    login(username, password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finans Takip</Text>
      <Text style={styles.subtitle}>Devam etmek için giriş yapın</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Kullanıcı Adı"
          placeholderTextColor="#94a3b8"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  title: { fontSize: 32, fontWeight: "900", color: "#1e293b", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 32,
    fontWeight: "500",
  },
  form: { width: "100%", gap: 16 },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  button: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});
