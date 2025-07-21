import axios from "axios";

export const askGPTutor = async (question) => {
  const response = await axios.post(
    import.meta.env.VITE_BACKEND_URL + "/query",
    { query: question }, // ✅ this is the fix
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};
