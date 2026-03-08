/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Maximize,
  MoreVertical,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { getFilesByGroup } from '../app/actions/file';
import type { FileItem } from '../types';

interface ContentShareProps {
  groupId?: string;
  groupName?: string;
}

const ContentShare: React.FC<ContentShareProps> = ({ groupId, groupName }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [slides, setSlides] = useState<FileItem[]>([]);
  const [markdownFiles, setMarkdownFiles] = useState<FileItem[]>([]);
  const [summaryText, setSummaryText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!groupId) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [imgRes, mdRes] = await Promise.all([
          getFilesByGroup(groupId, 'image'),
          getFilesByGroup(groupId, 'markdown')
        ]);
        
        if (isMounted) {
          if (imgRes.success && imgRes.data) {
            setSlides(imgRes.data);
            setActiveSlide(0); // reset active slide
          } else {
            setSlides([]);
          }

          if (mdRes.success && mdRes.data) {
            setMarkdownFiles(mdRes.data);
          } else {
            setMarkdownFiles([]);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchMarkdownText = async () => {
      if (slides.length === 0 && markdownFiles.length === 0) {
        if (isMounted) setSummaryText('');
        return;
      }

      const currentSlide = slides[activeSlide];
      let currentMd: FileItem | undefined;

      if (currentSlide && currentSlide.sortOrder !== undefined) {
        currentMd = markdownFiles.find(md => md.sortOrder === currentSlide.sortOrder);
      } else {
        // Fallback to activeSlide index if sortOrder is missing
        currentMd = markdownFiles[activeSlide];
      }

      if (!currentMd || !currentMd.url) {
        if (isMounted) setSummaryText('');
        return;
      }

      try {
        const res = await fetch(currentMd.url + '?t=' + Date.now()); // cache busting
        if (res.ok) {
          const text = await res.text();
          if (isMounted) setSummaryText(text);
        } else {
          if (isMounted) setSummaryText('');
        }
      } catch (err) {
        if (isMounted) setSummaryText('');
      }
    };

    fetchMarkdownText();
    return () => { isMounted = false; }
  }, [activeSlide, slides, markdownFiles]);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] relative">
      <div className="flex flex-1 overflow-hidden">
        <main className={`transition-all duration-500 ease-in-out p-2 sm:p-3 flex flex-col gap-3 overflow-hidden border-r border-white/30 flex-1 relative`}>
          {/* Toggle Summary Button */}
          {isSummaryCollapsed && (
            <button
              onClick={() => setIsSummaryCollapsed(false)}
              className="absolute right-4 top-4 z-30 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-xl text-white transition-all shadow-lg"
            >
              <Sparkles className="w-6 h-6" />
            </button>
          )}

          {/* Player Section */}
          <div className="relative flex-1 min-h-0 w-full group flex justify-center items-center z-10">
            {/* Image Frame - This tightly bounds the image and its internal controls */}
            <div className="relative h-full aspect-video rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 bg-gray-100/5">
              {slides.length > 0 ? (
                <Image
                  src={slides[activeSlide]?.url || ''}
                  alt={slides[activeSlide]?.name || "Main Player"}
                  fill
                  className="object-contain transition-opacity duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  {loading ? '加载中...' : '当前分组没有上传图片'}
                </div>
              )}

              {/* Left Navigation Area */}
              <div
                className={`absolute top-0 bottom-0 left-0 w-[15%] max-w-24 sm:max-w-32 flex items-center justify-start p-4 group/left transition-colors duration-300 ${activeSlide === 0 ? '' : 'cursor-pointer hover:bg-gradient-to-r hover:from-black/30 hover:to-transparent'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSlide > 0) setActiveSlide(prev => prev - 1);
                }}
              >
                <button
                  disabled={activeSlide === 0}
                  className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all shadow-lg opacity-0 group-hover/left:opacity-100 disabled:opacity-0 disabled:group-hover/left:opacity-0"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Right Navigation Area */}
              <div
                className={`absolute top-0 bottom-0 right-0 w-[15%] max-w-24 sm:max-w-32 flex items-center justify-end p-4 group/right transition-colors duration-300 ${activeSlide === slides.length - 1 ? '' : 'cursor-pointer hover:bg-gradient-to-l hover:from-black/30 hover:to-transparent'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSlide < slides.length - 1) setActiveSlide(prev => prev + 1);
                }}
              >
                <button
                  disabled={activeSlide === slides.length - 1}
                  className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all shadow-lg opacity-0 group-hover/right:opacity-100 disabled:opacity-0 disabled:group-hover/right:opacity-0"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMaximized(!isMaximized);
                    setIsSummaryCollapsed(!isSummaryCollapsed);
                  }}
                  className={`p-2 bg-black/40 hover:bg-black/60 rounded-xl text-white backdrop-blur-md transition-all shadow-lg ${isMaximized ? 'text-[#258cf4]' : ''}`}
                  title="全屏/退出全屏"
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <div className="px-3 py-1.5 bg-black/40 hover:bg-black/60 rounded-xl text-white backdrop-blur-md transition-all shadow-lg text-sm font-medium flex items-center gap-1 select-none">
                  <span className="text-white">{activeSlide + 1}</span>
                  <span className="text-white/40">/</span>
                  <span className="text-white/60">{slides.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Segments Section (Mac Dock Style Carousel) */}
          <div className="max-w-full self-center rounded-[2rem] flex items-center justify-center relative shrink-0 z-50">
            <div className="flex overflow-x-auto gap-3 pt-6 pb-0 snap-x hide-scrollbar items-end px-4">
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlide(i)}
                  className="cursor-pointer group shrink-0 snap-center flex flex-col items-center justify-end"
                >
                  {/* Thumbnail Preview */}
                  <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ease-out origin-bottom w-12 sm:w-16 lg:w-20 aspect-video ${
                    activeSlide === i 
                      ? 'ring-2 ring-[#258cf4] ring-offset-2 ring-offset-white/80 shadow-[0_8px_20px_rgba(37,140,244,0.3)] scale-110 z-20 -translate-y-1' 
                      : 'shadow-sm hover:shadow-2xl group-hover:scale-125 group-hover:-translate-y-2 group-hover:mx-2 z-10 group-hover:z-30'
                  }`}>
                    <Image src={slide.url || ''} alt={slide.name || ''} fill className="object-cover" sizes="(max-width: 768px) 100px, 140px" />
                    <div className={`absolute inset-0 transition-colors duration-300 ${activeSlide === i ? 'bg-black/0' : 'bg-black/40 group-hover:bg-black/10'}`} />

                    {/* Check icon for active slide */}
                    {activeSlide === i && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 bg-[#258cf4] rounded-full flex items-center justify-center text-white shadow-lg z-20">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}

                    {/* Centered Page Number */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <span className={`font-black tracking-tighter transition-all duration-300 ${
                        activeSlide === i
                          ? 'text-xl sm:text-2xl scale-110 drop-shadow-[0_2px_10px_rgba(37,140,244,0.8)]'
                          : 'text-lg sm:text-xl group-hover:text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]'
                      }`}>
                        {i + 1}
                      </span>
                    </div>
                  </div>

                  {/* Active Indicator Dot (Mac Style) */}
                  <div className={`h-1 w-1 rounded-full mt-1.5 transition-all duration-300 ${activeSlide === i ? 'bg-[#258cf4]' : 'bg-transparent'}`} />
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* Right: AI Summary (Primary Large Area or Sidebar) */}
        <motion.aside
          initial={false}
          animate={{ width: isSummaryCollapsed ? 0 : '100%', maxWidth: isSummaryCollapsed ? 0 : 400, opacity: isSummaryCollapsed ? 0 : 1 }}
          className="transition-all duration-500 ease-in-out flex flex-col bg-white/60 backdrop-blur-xl border border-white/40 overflow-hidden my-2 sm:my-3 mr-2 sm:mr-3 rounded-3xl shadow-xl relative"
        >
          {/* Header - Fixed at top */}
          <div className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200/50 shrink-0 bg-white/40 backdrop-blur-md z-10 sticky top-0">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-800 break-all">
              {groupName || '未命名分组'}
            </h2>
            <button
              onClick={() => setIsSummaryCollapsed(true)}
              className="p-1.5 hover:bg-white/80 rounded-xl text-gray-500 transition-colors shadow-sm"
              title="收起"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {/* Content - Scrollable Markdown */}
          <div className="flex-1 overflow-y-auto p-4 sm:px-5 sm:py-4 custom-scrollbar">
            <div className="text-gray-700 leading-relaxed font-sans max-w-none break-words">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>加载中...</span>
                </div>
              ) : summaryText ? (
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p className="mb-4 whitespace-pre-wrap text-[15px] leading-7" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-3 text-gray-900 border-b pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-6 mb-3 text-[#7B61FF]" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2 text-gray-800" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5 marker:text-[#7B61FF]" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5 marker:text-[#7B61FF]" {...props} />,
                    li: ({node, ...props}) => <li className="text-[15px] pl-1 leading-7" {...props} />,
                    a: ({node, ...props}) => <a className="text-[#258cf4] hover:underline hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#7B61FF]/40 pl-4 py-1 mb-4 text-gray-600 italic bg-gray-50/50 rounded-r-lg" {...props} />,
                    code: ({node, inline, className, children, ...props}: any) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline ? (
                        <div className="relative mb-4 rounded-xl overflow-hidden bg-[#1e1e1e] shadow-lg">
                          {match && match[1] && (
                            <div className="absolute top-0 w-full px-4 py-1.5 bg-[#2d2d2d] text-xs text-gray-400 font-mono border-b border-white/10 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                              <span className="ml-2 uppercase">{match[1]}</span>
                            </div>
                          )}
                          <pre className={`p-4 overflow-x-auto text-[13px] text-gray-100 font-mono leading-relaxed ${match ? 'pt-10' : ''}`}>
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code className="bg-[#7B61FF]/10 text-[#7B61FF] px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-[#7B61FF]/20" {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {summaryText}
                </ReactMarkdown>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
                  <Sparkles className="w-8 h-8 opacity-20" />
                  <p>没有找到相关内容</p>
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default ContentShare;
