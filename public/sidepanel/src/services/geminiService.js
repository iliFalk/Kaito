import { GoogleGenAI } from "@google/genai";

export const fileToGenerativePart = async (file) => {
  const base64EncodedData = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const generateChatStream = async (
  prompt, 
  history,
  modelName,
  apiKey,
  file
) => {
  const ai = new GoogleGenAI({ apiKey });
  const chat = ai.chats.create({ 
    model: modelName,
    history: history 
  });
  
  const messageParts = [];
  if(file){
    const imagePart = await fileToGenerativePart(file);
    messageParts.push(imagePart);
  }
  messageParts.push({ text: prompt });
  
  return chat.sendMessageStream({ message: messageParts });
};