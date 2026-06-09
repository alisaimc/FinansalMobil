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
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default apiClient;
