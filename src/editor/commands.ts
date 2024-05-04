"use client";
import { Alert, Announcement } from '@/types';
import { LexicalCommand, createCommand } from 'lexical';

export const ANNOUNCE_COMMAND: LexicalCommand<Readonly<Announcement>> = createCommand();
export const ALERT_COMMAND: LexicalCommand<Readonly<Alert>> = createCommand();
export const UPDATE_DOCUMENT_COMMAND: LexicalCommand<void> = createCommand();