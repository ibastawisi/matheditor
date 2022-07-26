import axios from 'axios'
import { EditorDocument } from './slices/app';
import { BACKEND_URL } from './config';

const createDocument = async (data: EditorDocument) => {
  const response = await axios.post(BACKEND_URL + '/documents', data, { withCredentials: true })
  return response.data;
}

const updateDocument = async (data: EditorDocument) => {
  const response = await axios.put(BACKEND_URL + `/documents/${data.id}`, data, { withCredentials: true })
  return response.data;
}

const deleteDocument = async (id: string) => {
  const response = await axios.delete(BACKEND_URL + `/documents/${id}`, { withCredentials: true })
  return response.data;
}

const getDocument = async (id: string) => {
  const response = await axios.get(`${BACKEND_URL}/documents/${id}`, { withCredentials: true })
  return response.data;
}

const getAuthenticatedUser = async () => {
  const response = await axios.get(BACKEND_URL + '/users/me', { withCredentials: true })
  return response.data;
}

const logout = async () => {
  const response = await axios.get(BACKEND_URL + '/auth/logout', { withCredentials: true })
  return response.data;
}

export { getDocument, createDocument, updateDocument, deleteDocument, getAuthenticatedUser, logout }