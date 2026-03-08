/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { LayoutGrid, CloudUpload, Share2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import type { Page, Group } from '../types';
import { getGroups, createGroup, deleteGroup, updateGroup } from '../app/actions/group';
import Header from './Header';
import GroupManagement from '../views/GroupManagement';
import ContentUpload from '../views/ContentUpload';
import ContentShare from '../views/ContentShare';

export default function MainApp() {
  const [page, setPage] = React.useState<Page>('groups');
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [selectedGroupName, setSelectedGroupName] = React.useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  const fetchGroups = React.useCallback(async () => {
    setLoading(true);
    const res = await getGroups();
    if (res.success && res.data) {
      setGroups(res.data);
      if (res.data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(res.data[0].id);
        setSelectedGroupName(res.data[0].name);
      }
    }
    setLoading(false);
  }, [selectedGroupId]);

  React.useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSelectGroup = (group: Group) => {
    setSelectedGroupId(group.id);
    setSelectedGroupName(group.name);
    setPage('upload');
  };

  const handlePlayGroup = (group: Group) => {
    setSelectedGroupId(group.id);
    setSelectedGroupName(group.name);
    setPage('share');
  };

  const addGroup = async (name: string, meetingTime?: string) => {
    const res = await createGroup({ name, meetingTime });
    if (res.success) {
      fetchGroups();
    } else {
      alert(res.error || "创建失败");
    }
  };

  const removeGroup = async (id: string) => {
    if (!confirm("确定要删除该分组及其所有文件吗？")) return;
    const res = await deleteGroup(id);
    if (res.success) {
      fetchGroups();
    } else {
      alert(res.error || "删除失败");
    }
  };

  const editGroup = async (id: string, name: string, meetingTime?: string) => {
    const res = await updateGroup({ id, name, meetingTime });
    if (res.success) {
      if (selectedGroupId === id) {
        setSelectedGroupName(name);
      }
      fetchGroups();
    } else {
      alert(res.error || "编辑失败");
    }
  };

  const pageTitles: Record<Page, string> = {
    groups: '分组管理',
    upload: '内容上传',
    share: '内容分享'
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={pageTitles[page]}
        subTitle={page === 'share' ? selectedGroupName : undefined}
        currentPage={page}
        setPage={setPage}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {page === 'groups' && (
                <GroupManagement
                  groups={groups}
                  loading={loading}
                  onAddGroup={addGroup}
                  onEditGroup={editGroup}
                  onDeleteGroup={removeGroup}
                  onSelectGroup={handleSelectGroup}
                  onPlayGroup={handlePlayGroup}
                />
              )}
              {page === 'upload' && (
                <ContentUpload
                  groups={groups}
                  selectedGroupId={selectedGroupId}
                  setSelectedGroupId={setSelectedGroupId}
                  setPage={setPage}
                />
              )}
              {page === 'share' && <ContentShare groupId={selectedGroupId} groupName={selectedGroupName} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/30 px-6 py-3 flex justify-around items-center z-50">
        <button onClick={() => setPage('groups')} className={`p-2 rounded-xl ${page === 'groups' ? 'text-[#258cf4] bg-blue-50' : 'text-gray-400'}`}>
          <LayoutGrid className="w-6 h-6" />
        </button>
        <button onClick={() => setPage('upload')} className={`p-2 rounded-xl ${page === 'upload' ? 'text-[#258cf4] bg-blue-50' : 'text-gray-400'}`}>
          <CloudUpload className="w-6 h-6" />
        </button>
        <button onClick={() => setPage('share')} className={`p-2 rounded-xl ${page === 'share' ? 'text-[#258cf4] bg-blue-50' : 'text-gray-400'}`}>
          <Share2 className="w-6 h-6" />
        </button>
      </nav>
    </div>
  );
}
