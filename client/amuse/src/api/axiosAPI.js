import axios from "axios";

const axiosAPI = axios.create({
  baseURL: "http://localhost/",
  withCredentials: true
});

export default axiosAPI;