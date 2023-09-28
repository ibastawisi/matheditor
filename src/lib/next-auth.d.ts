import { User } from './prisma';

declare module 'next-auth' {
  interface Session {
    user: User
  }

}