/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Page = 'groups' | 'upload' | 'share';

export interface Group {
  id: string;
  name: string;
  markdownCount: number;
  imageCount: number;
  meetingTime: string;
  updatedAt: string;
  color: string;
  thumbnail?: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'markdown' | 'image';
  size: string;
  status: 'uploaded' | 'uploading';
  progress?: number;
  url?: string;
  date: string;
  sortOrder?: number;
}
