import { findUser } from "@/repositories/user";
import { validate } from "uuid";


export const validateHandle = async (handle: string) => {
  if (handle.length < 3) {
    return { title: "Handle too short", subtitle: "Handle must be at least 3 characters" };
  }
  if (!/^[a-zA-Z0-9-]+$/.test(handle)) {
    return { title: "Invalid Handle", subtitle: "Handle must only contain letters, numbers, and hyphens" };
  }
  if (validate(handle)) {
    return { title: "Invalid Handle", subtitle: "Handle must not be a UUID" };
  }
  const user = await findUser(handle);
  if (user) {
    return { title: "Handle already taken", subtitle: "Please choose a different handle" };
  }
  return null;
};
