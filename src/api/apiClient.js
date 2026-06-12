import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Vercel üzerindeki canlı uygulamanın linkini buraya yazmalısın
const BASE_URL = "https://finans-takip-lyart.vercel.app";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Her istek gitmeden önce araya girip, hafızadaki (AsyncStorage) bileti (token) ekliyoruz
apiClient.interceptors.request.use(
  async (config) => {
    // HATA BURADAYDI: Token'ı tek başına değil, currentUser objesinin içinden çekiyoruz!
    const storedUser = await AsyncStorage.getItem("currentUser");

    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Hataları daha net görebilmek için küçük bir hata ayıklayıcı (İsteğe bağlı ama hayat kurtarır)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Hatası:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export default apiClient;
