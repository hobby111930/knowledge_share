/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Folder, FileText, Image as ImageIcon, Trash2, Plus, Play, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Group } from '../types';

interface GroupManagementProps {
  groups: Group[];
  loading?: boolean;
  onAddGroup: (name: string, meetingTime?: string) => void;
  onEditGroup: (id: string, name: string, meetingTime?: string) => void;
  onDeleteGroup: (id: string) => void;
  onSelectGroup: (group: Group) => void;
  onPlayGroup: (group: Group) => void;
}

const GroupManagement: React.FC<GroupManagementProps> = ({ groups, loading, onAddGroup, onEditGroup, onDeleteGroup, onSelectGroup, onPlayGroup }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  const handleSave = () => {
    if (newGroupName.trim()) {
      if (isEditMode && editingGroupId) {
        onEditGroup(editingGroupId, newGroupName.trim(), meetingTime ? meetingTime : undefined);
      } else {
        onAddGroup(newGroupName.trim(), meetingTime ? meetingTime : undefined);
      }
      setNewGroupName('');
      setMeetingTime('');
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingGroupId('');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end pb-4">
        <div>
          <h2 className="text-[32px] font-black tracking-[0.1em] text-[#3b82f6] uppercase">
            WORKSPACE
          </h2>
        </div>
        <button 
          onClick={() => {
            setIsEditMode(false);
            setIsModalOpen(true);
            setNewGroupName('');
            setMeetingTime('');
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#258cf4] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>新建分组</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {loading && groups.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
            <p className="font-bold">正在加载会议...</p>
          </div>
        )}
        
        {!loading && groups.length === 0 && (
          <div className="col-span-full glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
              <Folder className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">暂无会议分组</h3>
              <p className="text-sm text-gray-500">点击“新建分组”开始您的第一个会议记录</p>
            </div>
          </div>
        )}

        {groups.map((group) => (
          <motion.div 
            key={group.id}
            whileHover={{ y: -4 }}
            onClick={() => onSelectGroup(group)}
            className="glass-card rounded-3xl overflow-hidden group cursor-pointer"
          >
            <div className={`aspect-[4/3] ${group.thumbnail ? '' : group.color.split(' ')[0]} p-5 flex flex-col justify-between relative overflow-hidden`}>
              {group.thumbnail && (
                <Image 
                  src={group.thumbnail} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-110" 
                  alt={group.name}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                />
              )}
              {group.thumbnail && <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />}
              
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-2.5 ${group.thumbnail ? 'bg-white/40 backdrop-blur-md' : 'bg-white/80'} rounded-2xl shadow-sm`}>
                  <Folder className={`${group.thumbnail ? 'text-white' : group.color.split(' ')[1]} w-5 h-5`} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditMode(true);
                      setEditingGroupId(group.id);
                      setNewGroupName(group.name);
                      
                      try {
                        let parsedTime = '';
                        if (group.meetingTime) {
                          const dateObj = new Date(group.meetingTime);
                          if (!isNaN(dateObj.getTime())) {
                            const tzOffset = dateObj.getTimezoneOffset() * 60000;
                            const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
                            parsedTime = localISOTime;
                          }
                        }
                        setMeetingTime(parsedTime);
                      } catch (e) {
                         setMeetingTime('');
                      }
                      
                      setIsModalOpen(true);
                    }}
                    className={`p-2 ${group.thumbnail ? 'text-white hover:text-blue-300' : 'text-gray-400 hover:text-blue-500'} transition-colors`}
                    title="编辑分组"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGroup(group.id);
                    }}
                    className={`p-2 ${group.thumbnail ? 'text-white hover:text-red-300' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                    title="删除分组"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-2.5">
              <h4 className="text-base font-bold truncate">{group.name}</h4>
              <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>{group.markdownCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>{group.imageCount}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                <p className="text-xs text-gray-400">会议时间：{group.meetingTime}</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayGroup(group);
                  }}
                  className="p-2 bg-blue-50 text-[#258cf4] hover:bg-[#258cf4] hover:text-white rounded-xl transition-all shadow-sm hover:shadow-blue-500/20 group/play"
                  title="立即播放"
                >
                  <Play className="w-4 h-4 fill-current group-hover/play:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        
        <button 
          onClick={() => {
            setIsEditMode(false);
            setIsModalOpen(true);
            setNewGroupName('');
            setMeetingTime('');
          }}
          className="border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center gap-3 p-5 text-gray-400 hover:border-[#258cf4] hover:text-[#258cf4] transition-all group min-h-[180px]"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold">新建分组</span>
        </button>
      </div>

      {/* New Group Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">{isEditMode ? '编辑会议分组' : '新建会议分组'}</h3>
                <p className="text-sm text-gray-500">{isEditMode ? '修改分组名称或会议时间。' : '请输入分组名称，以便更好地管理您的会议素材。'}</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">分组名称</label>
                  <input
                    autoFocus
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="例如：2024年度战略会议"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#258cf4]/20 focus:border-[#258cf4] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">会议召开时间</label>
                  <input
                    type="datetime-local"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#258cf4]/20 focus:border-[#258cf4] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!newGroupName.trim()}
                  className="flex-1 px-4 py-3 bg-[#258cf4] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  {isEditMode ? '保存修改' : '创建分组'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupManagement;
