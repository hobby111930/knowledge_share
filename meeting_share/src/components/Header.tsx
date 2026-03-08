/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { Share2 } from 'lucide-react';
import type { Page } from '../types';

interface HeaderProps {
  title: string;
  subTitle?: string;
  currentPage: Page;
  setPage: (p: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ title, subTitle, currentPage, setPage }) => {
  return (
    <header className="h-12 border-b border-white/30 bg-white/20 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setPage('groups')}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#258cf4] to-[#7B61FF] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">内容分享</h1>
        </div>
        {subTitle && (
          <div className="flex items-center gap-3 text-gray-800">
            <span className="text-xl text-gray-400">/</span>
            <span className="text-lg font-medium">{subTitle}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
