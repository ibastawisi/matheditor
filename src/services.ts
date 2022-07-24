import axios from 'axios'
import { SerializedEditorState } from 'lexical';
import { EditorDocument } from './slices/app';

const backendURL = process.env.NODE_ENV == 'production' ? "https://math-editor-server.herokuapp.com" : "http://localhost:3001";

const createDocument = async (data: EditorDocument) => {
  const response = await axios.post(backendURL + '/api/documents', data, { withCredentials: true })
  return response.data;
}

const updateDocument = async (id: string, data: SerializedEditorState) => {
  const response = await axios.put(backendURL + `/api/documents/${id}`, data, { withCredentials: true })
  return response.data;
}

const deleteDocument = async (id: string) => {
  const response = await axios.delete(backendURL + `/api/documents/${id}`, { withCredentials: true })
  return response.data;
}

const getAuthenticatedUser = async () => {
  const response = await axios.get(backendURL + '/api/users/me', { withCredentials: true })
  return response.data;
}

const getLogout = async () => {
  const response = await axios.get(backendURL + '/auth/logout', { withCredentials: true })
  return response.data;
}

export { createDocument, updateDocument, deleteDocument, getAuthenticatedUser, getLogout }