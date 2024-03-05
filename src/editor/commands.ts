"use client";
import { Announcement } from '@/types';
import { LexicalCommand, createCommand } from 'lexical';

export type SetAnnouncementPayload = Readonly<Announcement>;

export const SET_ANNOUNCEMENT_COMMAND: LexicalCommand<SetAnnouncementPayload> = createCommand();
