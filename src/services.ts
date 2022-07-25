import axios from 'axios'
import { EditorDocument } from './slices/app';

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const createDocument = async (data: EditorDocument) => {
  const response = await axios.post(backendURL + '/api/documents', data, { withCredentials: true })
  return response.data;
}

const updateDocument = async (data: EditorDocument) => {
  const response = await axios.put(backendURL + `/api/documents/${data.id}`, data, { withCredentials: true })
  return response.data;
}

const deleteDocument = async (id: string) => {
  const response = await axios.delete(backendURL + `/api/documents/${id}`, { withCredentials: true })
  return response.data;
}

const getDocument = async (id: string) => {
  const response = await axios.get(`${backendURL}/api/documents/${id}`, { withCredentials: true })
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

export { getDocument, createDocument, updateDocument, deleteDocument, getAuthenticatedUser, getLogout }