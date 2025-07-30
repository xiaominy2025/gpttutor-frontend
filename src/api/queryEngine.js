import axios from "axios";

export const askGPTutor = async (requestData) => {
  // Handle both string (legacy) and object (new) formats
  const payload = typeof requestData === 'string' 
    ? { query: requestData }
    : requestData;

  const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const url = `${API_BASE}/query`;
  
  console.log("🔧 QueryEngine API_BASE:", API_BASE);
  console.log("🔧 QueryEngine URL:", url);
  console.log("🔧 QueryEngine payload:", payload);

  const response = await axios.post(
    url,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response; // Return the full response object, not just response.data
};
