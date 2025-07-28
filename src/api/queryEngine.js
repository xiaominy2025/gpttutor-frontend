import axios from "axios";

export const askGPTutor = async (requestData) => {
  // Handle both string (legacy) and object (new) formats
  const payload = typeof requestData === 'string' 
    ? { query: requestData }
    : requestData;

  const response = await axios.post(
    import.meta.env.VITE_BACKEND_URL + "/query",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response; // Return the full response object, not just response.data
};
