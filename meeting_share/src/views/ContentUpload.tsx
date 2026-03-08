/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Markdown from 'react-markdown';
import {
  CloudUpload,
  FileText,
  Image as ImageIcon,
  Play,
  X,
  Trash2,
  Clock,
  PieChart,
  ChevronUp,
  ChevronDown,
  Save,
  CheckCircle2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Group, FileItem, Page } from '../types';
import { getFilesByGroup, createFileRecord, deleteFile, updateFileOrders } from '../app/actions/file';
import SortableItem from '../components/SortableItem';

interface UploadProgress {
  id: string;
  name: string;
  type: 'markdown' | 'image';
  progress: number;
}

interface ContentUploadProps {
  groups: Group[];
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  setPage: (p: Page) => void;
}

const ContentUpload: React.FC<ContentUploadProps> = ({ groups, selectedGroupId, setSelectedGroupId, setPage }) => {
  const [markdownFiles, setMarkdownFiles] = useState<(FileItem | null)[]>([]);
  const [imageFiles, setImageFiles] = useState<(FileItem | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [markdownContent, setMarkdownContent] = useState<string>("未选择文档");
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [uploadingFiles, setUploadingFiles] = useState<UploadProgress[]>([]);

  const removeFileById = (type: 'markdown' | 'image', id: string) => {
    if (type === 'markdown') {
      setMarkdownFiles(prev => prev.map(f => (f?.id === id ? null : f)));
    } else {
      setImageFiles(prev => prev.map(f => (f?.id === id ? null : f)));
    }
  };

  const fetchFiles = React.useCallback(async () => {
    if (!selectedGroupId) return;
    setLoading(true);
    const [mdRes, imgRes] = await Promise.all([
      getFilesByGroup(selectedGroupId, 'markdown'),
      getFilesByGroup(selectedGroupId, 'image')
    ]);

    const buildArray = (items?: FileItem[]) => {
      if (!items || items.length === 0) return [];
      const maxSortOrder = Math.max(...items.map(i => i.sortOrder ?? 0), -1);
      const arr = Array(Math.max(0, maxSortOrder + 1)).fill(null);
      items.forEach(item => {
        if (item.sortOrder !== undefined && item.sortOrder >= 0) {
          arr[item.sortOrder] = item;
        } else {
          arr.push(item);
        }
      });
      return arr;
    };

    if (mdRes.success) setMarkdownFiles(buildArray(mdRes.data));
    if (imgRes.success) setImageFiles(buildArray(imgRes.data));
    setLoading(false);
  }, [selectedGroupId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      const selectedMarkdown = markdownFiles[selectedIndex];
      if (!selectedMarkdown || !selectedMarkdown.url) {
        if (isMounted) setMarkdownContent("未选择文档");
        return;
      }
      if (isMounted) setLoadingContent(true);
      try {
        const res = await fetch(selectedMarkdown.url + '?t=' + Date.now());
        if (res.ok) {
          const text = await res.text();
          if (isMounted) setMarkdownContent(text);
        } else {
          if (isMounted) setMarkdownContent("无法加载该文档的内容。");
        }
      } catch (err) {
        if (isMounted) setMarkdownContent("读取文档失败。");
      } finally {
        if (isMounted) setLoadingContent(false);
      }
    };
    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [selectedIndex, markdownFiles]);

  const uploadFile = (file: File, id: string, type: 'markdown' | 'image') => {
    setUploadingFiles(prev => [...prev, { id, name: file.name, type, progress: 0 }]);
    setIsUploadPanelOpen(true);

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    // Assuming the API takes groupId
    formData.append('groupId', selectedGroupId); 

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadingFiles(prev => prev.map(f => f.id === id ? { ...f, progress: percent } : f));
      }
    };

    xhr.onload = async () => {
      setUploadingFiles(prev => prev.filter(f => f.id !== id));
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            // Create database record
            const dbRes = await createFileRecord({
              groupId: selectedGroupId,
              name: file.name,
              type,
              size: file.size,
              url: response.url || `/uploads/${selectedGroupId}/${type}/${file.name}`
            });

            if (dbRes.success) {
                fetchFiles();
            } else {
                alert(`落库失败: ${dbRes.error}`);
                removeFileById(type, id);
            }
          } else {
            alert(`上传失败: ${response.error}`);
            removeFileById(type, id);
          }
        } catch (e) {
          alert('服务器响应格式错误');
          removeFileById(type, id);
        }
      } else {
        alert('服务器错误');
        removeFileById(type, id);
      }
    };

    xhr.onerror = () => {
      setUploadingFiles(prev => prev.filter(f => f.id !== id));
      alert('网络错误');
      removeFileById(type, id);
    };

    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const mdUpdates = markdownFiles
      .map((f, i) => f ? { id: f.id, sortOrder: i } : null)
      .filter((update): update is { id: string, sortOrder: number } => update !== null);
      
    const imgUpdates = imageFiles
      .map((f, i) => f ? { id: f.id, sortOrder: i } : null)
      .filter((update): update is { id: string, sortOrder: number } => update !== null);
    
    const res = await updateFileOrders([...mdUpdates, ...imgUpdates]);
    if (res.success) {
      setHasUnsavedChanges(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      fetchFiles();
    } else {
      alert(`保存失败: ${res.error}`);
    }
    setIsSaving(false);
  };

  // Ensure both lists have the same length by padding with nulls
  useEffect(() => {
    const maxLength = Math.max(markdownFiles.length, imageFiles.length);
    
    if (markdownFiles.length < maxLength) {
      setMarkdownFiles(prev => [...prev, ...Array(maxLength - prev.length).fill(null)]);
    }
    if (imageFiles.length < maxLength) {
      setImageFiles(prev => [...prev, ...Array(maxLength - prev.length).fill(null)]);
    }
  }, [markdownFiles.length, imageFiles.length]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    if (!selectedGroupId) {
      alert("请先在左侧菜单选择一个分组即可上传（例如：默认分组）。");
      return;
    }
    
    const newFiles = Array.from(files);
    newFiles.forEach(file => {
      const isMarkdown = file.name.toLowerCase().endsWith('.md');
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
      
      if (!isMarkdown && !isImage) {
        alert(`不支持的文件格式: ${file.name}`);
        return;
      }

      const newItem: FileItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: isMarkdown ? 'markdown' : 'image',
        size: (file.size / 1024).toFixed(1) + ' KB',
        status: 'uploading',
        date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
      };

      if (isMarkdown) {
        setMarkdownFiles(prev => {
          const firstNull = prev.indexOf(null);
          if (firstNull !== -1) {
            const next = [...prev];
            next[firstNull] = newItem;
            return next;
          }
          return [...prev, newItem];
        });
      } else {
        setImageFiles(prev => {
          const firstNull = prev.indexOf(null);
          if (firstNull !== -1) {
            const next = [...prev];
            next[firstNull] = newItem;
            return next;
          }
          return [...prev, newItem];
        });
      }

      uploadFile(file, newItem.id, newItem.type);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragEndMarkdown = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMarkdownFiles((items) => {
        const oldIndex = items.findIndex((item, i) => (item?.id || `empty-md-${i}`) === active.id);
        const newIndex = items.findIndex((item, i) => (item?.id || `empty-md-${i}`) === over.id);
        setHasUnsavedChanges(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragEndImage = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImageFiles((items) => {
        const oldIndex = items.findIndex((item, i) => (item?.id || `empty-img-${i}`) === active.id);
        const newIndex = items.findIndex((item, i) => (item?.id || `empty-img-${i}`) === over.id);
        setHasUnsavedChanges(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeFile = async (type: 'markdown' | 'image', index: number) => {
    const file = type === 'markdown' ? markdownFiles[index] : imageFiles[index];
    if (!file) return;

    if (!confirm(`确定要删除 ${file.name} 吗？`)) return;

    const res = await deleteFile(file.id);
    if (res.success) {
      if (type === 'markdown') {
        const newFiles = [...markdownFiles];
        newFiles[index] = null;
        setMarkdownFiles(newFiles);
      } else {
        const newFiles = [...imageFiles];
        newFiles[index] = null;
        setImageFiles(newFiles);
      }
    } else {
      alert(`删除失败: ${res.error}`);
    }
  };

  const selectedMarkdown = markdownFiles[selectedIndex];
  const selectedImage = imageFiles[selectedIndex];

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Content Preview Zone */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 flex flex-col gap-4 border-2 border-[#258cf4]/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-[#258cf4] uppercase tracking-widest mb-1">Content Preview</h3>
              <h2 className="text-2xl font-black tracking-tight">内容预览 <span className="text-gray-300 font-light">/ 第 {selectedIndex + 1} 组</span></h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[220px]">
            {/* Image Preview */}
            <div className="rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative group">
              {selectedImage ? (
                <div className="absolute inset-0 w-full h-full">
                  <Image 
                    src={selectedImage.url || `https://picsum.photos/seed/${selectedImage.id}/800/600`} 
                    alt="Preview" 
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Centered Play Button - Always Visible */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                    <button 
                      onClick={() => setPage('share')}
                      className="flex items-center gap-2 px-6 py-3 bg-[#258cf4] text-white rounded-2xl text-base font-bold shadow-2xl shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-300 backdrop-blur-md border border-white/20"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>全屏播放</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <ImageIcon className="w-10 h-10 opacity-20" />
                  <span className="text-xs font-medium">暂无图片素材</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white text-[10px] font-bold z-10">
                {selectedImage?.name || "未绑定图片"}
              </div>
            </div>

            {/* Markdown Preview */}
            <div className="rounded-2xl bg-white/50 border border-white/80 p-5 overflow-y-auto max-h-[220px] custom-scrollbar">
              <div className="markdown-body text-sm leading-relaxed text-gray-700 h-full">
                {loadingContent ? (
                  <p className="text-gray-400 italic text-center mt-10">加载中...</p>
                ) : (
                  <Markdown>{markdownContent}</Markdown>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content Upload Zone */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#258cf4] uppercase tracking-widest mb-1">Asset Management</h3>
            <h2 className="text-xl font-black tracking-tight">内容上传</h2>
          </div>

          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-[#258cf4]/30 bg-[#258cf4]/5 rounded-3xl p-4 flex flex-col items-center justify-center text-center space-y-2 hover:bg-[#258cf4]/10 transition-all cursor-pointer group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept=".md,image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#258cf4] group-hover:scale-110 transition-transform">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold">将文件拖拽至此处</h4>
              <p className="text-[10px] text-gray-500 max-w-[150px] mx-auto">支持格式：MD, JPG, PNG。</p>
            </div>
            <button className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold shadow-sm hover:bg-gray-50 transition-all">
              浏览文件
            </button>
          </div>
        </div>
      </div>

      {/* Processing Mask */}
      {isSaving && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 border border-blue-100">
            <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-sm font-bold text-gray-800">正在保存修改...</span>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-green-50 text-green-600 border border-green-200 px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold">序号更新成功</span>
          </div>
        </div>
      )}

        {/* Floating Uploading Status (Realized) */}
        {uploadingFiles.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 w-96 max-w-[calc(100vw-4rem)]">
          <div className="bg-white/60 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/60 space-y-4 transition-all duration-300">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsUploadPanelOpen(!isUploadPanelOpen)}>
              <h3 className="text-base font-bold flex items-center gap-2 text-gray-800">
                <Clock className="w-5 h-5 text-blue-500" />
                正在上传 ({uploadingFiles.length})
              </h3>
              <button className="text-gray-400 hover:text-blue-500 transition-colors p-1 bg-white/50 rounded-full">
                {isUploadPanelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
            
            {isUploadPanelOpen && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 max-h-60 overflow-y-auto custom-scrollbar">
                {uploadingFiles.map(file => (
                  <div key={file.id} className="bg-white/50 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3 border border-white/60 shadow-sm">
                    <div className={`w-8 h-8 rounded-xl ${file.type === 'markdown' ? 'bg-blue-100 text-blue-500' : 'bg-purple-100 text-purple-500'} flex items-center justify-center shrink-0`}>
                      {file.type === 'markdown' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold truncate text-gray-800">{file.name}</p>
                        <span className={`text-[10px] font-bold ${file.type === 'markdown' ? 'text-blue-500' : 'text-purple-500'}`}>{file.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${file.type === 'markdown' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'} rounded-full transition-all duration-300`} 
                          style={{ width: `${file.progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            )}
          </div>
        </div>
        )}

        {/* Floating Save Changes Bar */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white/80 backdrop-blur-xl px-6 py-4 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 flex items-center gap-6 animate-in slide-in-from-bottom-8 fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">排序已修改</h4>
                  <p className="text-xs text-gray-500">您调整了文件顺序，请保存</p>
                </div>
              </div>
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center gap-2 bg-[#258cf4] hover:bg-blue-600 disabled:opacity-70 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
              >
                {isSaving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Markdown List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              文字文档 (Markdown)
            </h3>
            <div className="glass-panel rounded-3xl">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndMarkdown}
              >
                <SortableContext
                  items={markdownFiles.map((f, i) => f?.id || `empty-md-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/30 bg-white/20">
                        <th className="w-10"></th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider pl-4 w-24">页码</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">文件名</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">大小</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20">
                      {markdownFiles.map((file, index) => (
                        <SortableItem key={file?.id || `empty-md-${index}`} id={file?.id || `empty-md-${index}`} disabled={!file} as="tr">
                            <td className="px-6 py-4 pl-4 text-sm font-bold text-gray-500 w-24 cursor-pointer" onClick={() => setSelectedIndex(index)}>
                              {file ? index + 1 : '-'}
                            </td>
                            <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedIndex(index)}>
                              {file ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold">{file.name}</span>
                                  {file.status === 'uploading' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold whitespace-nowrap animate-pulse">上传中...</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-300 italic">空位 (等待上传)</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 cursor-pointer" onClick={() => setSelectedIndex(index)}>{file?.size || '-'}</td>
                            <td className="px-6 py-4 text-right">
                              {file && (
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => removeFile('markdown', index)}
                                    className="p-2 text-gray-400 hover:text-red-500 bg-white/50 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                        </SortableItem>
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Image List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              图片文件
            </h3>
            <div className="glass-panel rounded-3xl">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndImage}
              >
                <SortableContext
                  items={imageFiles.map((f, i) => f?.id || `empty-img-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/30 bg-white/20">
                        <th className="w-10"></th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider pl-4 w-24">页码</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">文件名</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">大小</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20">
                      {imageFiles.map((file, index) => (
                        <SortableItem key={file?.id || `empty-img-${index}`} id={file?.id || `empty-img-${index}`} disabled={!file} as="tr">
                            <td className="px-6 py-4 pl-4 text-sm font-bold text-gray-500 w-24 cursor-pointer" onClick={() => setSelectedIndex(index)}>
                              {file ? index + 1 : '-'}
                            </td>
                            <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedIndex(index)}>
                              {file ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold">{file.name}</span>
                                  {file.status === 'uploading' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-bold whitespace-nowrap animate-pulse">上传中...</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-300 italic">空位 (等待上传)</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 cursor-pointer" onClick={() => setSelectedIndex(index)}>{file?.size || '-'}</td>
                            <td className="px-6 py-4 text-right">
                              {file && (
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => removeFile('image', index)}
                                    className="p-2 text-gray-400 hover:text-red-500 bg-white/50 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                        </SortableItem>
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ContentUpload;
