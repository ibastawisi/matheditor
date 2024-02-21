import { findUserDocument } from "@/repositories/document";
import { validate } from "uuid";

export const validateHandle = async (handle: string) => {
  if (handle.length < 3) {
    return { title: "Handle is too short", subtitle: "Handle must be at least 3 characters long" };
  }
  if (!/^[a-zA-Z0-9-]+$/.test(handle)) {
    return { title: "Invalid Handle", subtitle: "Handle must only contain letters, numbers, and hyphens" };
  }
  if (validate(handle)) {
    return { title: "Invalid Handle", subtitle: "Handle must not be a UUID" };
  }
  const userDocument = await findUserDocument(handle);
  if (userDocument) {
    return { title: "Handle already in use", subtitle: "Please choose a different handle" };
  }
  return null;
}