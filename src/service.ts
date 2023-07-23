"use client"
import axios from 'axios'
import { DocumentWithAuthorId, EditorDocument, User } from '@/types';
import { BACKEND_URL } from '@/config';

const createDocument = async (data: EditorDocument) => {
  try {
    const response = await axios.post(BACKEND_URL + '/documents', data, { withCredentials: true })
    return response.data;
  } catch (error) { console.error(error) }
}

const updateDocument = async (id: string, data: Partial<EditorDocument>) => {
  try {
    const response = await axios.put(BACKEND_URL + `/documents/${id}`, data, { withCredentials: true })
    return response.data;
  } catch (error) { console.error(error) }
}

const deleteDocument = async (id: string) => {
  try {
    const response = await axios.delete(BACKEND_URL + `/documents/${id}`, { withCredentials: true })
    return response.data;
  } catch (error) { console.error(error) }
}

const getDocument = async (id: string) => {
  try {
    const response = await axios.get<EditorDocument>(`${BACKEND_URL}/documents/${id}`, { withCredentials: true })
    return response.data;
  } catch (error) { console.error(error) }
}

const getAuthenticatedUser = async () => {
  try {
    const response = await axios.get<User>(BACKEND_URL + '/users/me', { withCredentials: true })
    return response.data;
  } catch (error) { console.error(error) }
}

const logout = async () => {
  try {
    const response = await axios.get(BACKEND_URL + '/auth/logout', { withCredentials: true })
    return response.data;
  } catch (error) { console.error(error) }
}

const getAllUsers = async () => {
  try {
    const response = await axios.get<User[]>(BACKEND_URL + '/users', { withCredentials: true })
    return response.data;
  } catch (error) { console.error(error) }
}

const getAllDocuments = async () => {
  try {
    const response = await axios.get<DocumentWithAuthorId[]>(BACKEND_URL + '/documents', { withCredentials: true })
    return response.data;
  } catch (error) { console.error(error) }
}

const getUser = async (id: string) => {
  try {
    const response = await axios.get<User>(BACKEND_URL + `/users/${id}`, { withCredentials: true })
    return response.data;
  } catch (error) { console.error(error) }
}

export { getDocument, createDocument, updateDocument, deleteDocument, getAuthenticatedUser, logout, getAllUsers, getAllDocuments, getUser }