import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

export const checkGrammar = async (text) => {
  try {
    const res = await API.post("/grammar", { text });
    return res.data;
  } catch (error) {
    console.error("Error checking grammar:", error);
    return { feedback: "Something went wrong!" };
  }
};

export const sendAudio = async (blob) => {
  const formData = new FormData();
  formData.append("file", blob, "audio.wav");

  try {
    const res = await API.post("/speech", formData);
    return res.data;
  } catch (error) {
    console.error("Speech API error:", error);
    return { transcript: "Could not transcribe audio." };
  }
};
