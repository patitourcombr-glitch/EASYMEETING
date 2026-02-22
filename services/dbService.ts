
import { db, storage } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  getDocs,
  orderBy
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { ChatMessage, Meeting } from '../types';

// Funções para Vídeos/Áudios (Firebase Storage)
export const saveVideo = async (id: string, blob: Blob): Promise<string> => {
  const storageRef = ref(storage, `recordings/${id}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

export const getVideo = async (id: string): Promise<string | null> => {
  try {
    const storageRef = ref(storage, `recordings/${id}`);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Erro ao buscar vídeo no Firebase:", error);
    return null;
  }
};

export const deleteVideo = async (id: string): Promise<void> => {
  const storageRef = ref(storage, `recordings/${id}`);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Vídeo não encontrado no Storage ou erro ao excluir:", error);
  }
};

// Funções para Chat History (Firestore)
export const saveChat = async (id: string, messages: ChatMessage[]): Promise<void> => {
  const chatRef = doc(db, 'chats', id);
  await setDoc(chatRef, { messages, updatedAt: new Date() });
};

export const getChat = async (id: string): Promise<ChatMessage[] | null> => {
  const chatRef = doc(db, 'chats', id);
  const docSnap = await getDoc(chatRef);
  if (docSnap.exists()) {
    return docSnap.data().messages as ChatMessage[];
  }
  return null;
};

export const deleteChat = async (id: string): Promise<void> => {
  const chatRef = doc(db, 'chats', id);
  await deleteDoc(chatRef);
};

// Funções para Metadados de Reuniões (Firestore)
export const saveMeetingMetadata = async (meeting: Meeting): Promise<void> => {
  const meetingRef = doc(db, 'meetings', meeting.id);
  await setDoc(meetingRef, { ...meeting, updatedAt: new Date() });
};

export const getAllMeetings = async (): Promise<Meeting[]> => {
  const meetingsCol = collection(db, 'meetings');
  const q = query(meetingsCol, orderBy('id', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Meeting);
};

export const deleteMeetingMetadata = async (id: string): Promise<void> => {
  const meetingRef = doc(db, 'meetings', id);
  await deleteDoc(meetingRef);
};
