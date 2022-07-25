import axios from 'axios'
import { EditorDocument } from './slices/app';
import { BACKEND_URL } from './config';

const createDocument = async (data: EditorDocument) => {
  const response = await axios.post(BACKEND_URL + '/api/documents', data, { withCredentials: true })
  return response.data;
}

const updateDocument = async (data: EditorDocument) => {
  const response = await axios.put(BACKEND_URL + `/api/documents/${data.id}`, data, { withCredentials: true })
  return response.data;
}

const deleteDocument = async (id: string) => {
  const response = await axios.delete(BACKEND_URL + `/api/documents/${id}`, { withCredentials: true })
  return response.data;
}

const getDocument = async (id: string) => {
  const response = await axios.get(`${BACKEND_URL}/api/documents/${id}`, { withCredentials: true })
  return response.data;
}

const getAuthenticatedUser = async () => {
  const response = await axios.get(BACKEND_URL + '/api/users/me', { withCredentials: true })
  return response.data;
}

const getLogout = async () => {
  const response = await axios.get(BACKEND_URL + '/auth/logout', { withCredentials: true })
  return response.data;
}

export { getDocument, createDocument, updateDocument, deleteDocument, getAuthenticatedUser, getLogout }