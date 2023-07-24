"use client"
import axios from 'axios'
import { EditorDocument } from '@/types';
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


export { getDocument, createDocument, updateDocument, deleteDocument }