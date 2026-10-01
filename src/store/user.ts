import type { StateCreator } from 'zustand';
import NProgress from "nprogress";
import type { GetSessionResponse, PatchUserResponse, User } from '@/types';
import type { AppStore } from './store';
import { failure, announceFailure, type Result } from './result';

export interface UserSlice {
  user?: User;
  loadSession: () => Promise<Result<User | undefined>>;
  updateUser: (input: { id: string, partial: Partial<User> }) => Promise<Result<User>>;
}

export const createUserSlice: StateCreator<AppStore, [], [], UserSlice> = (set) => ({
  user: undefined,
  loadSession: async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json() as GetSessionResponse;
      if (!data) return { error: { title: "Something went wrong", subtitle: "session not found" } };
      const user = data.user ? {
        id: data.user.id,
        handle: data.user.handle,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image
      } : undefined;
      set({ user });
      return { data: user };
    } catch (error) {
      return failure(error);
    }
  },
  updateUser: async ({ id, partial }) => {
    try {
      NProgress.start();
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      const { data, error } = await response.json() as PatchUserResponse;
      if (error || !data) return announceFailure({ error: error ?? { title: "Something went wrong", subtitle: "failed to update user" } });
      set({ user: data });
      return { data };
    } catch (error) {
      return announceFailure(failure(error));
    } finally {
      NProgress.done();
    }
  },
});
