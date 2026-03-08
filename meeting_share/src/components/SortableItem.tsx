/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  as?: React.ElementType;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children, disabled, as: Component = 'div' }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  };

  // Use <td> for the drag handle when rendering inside a <tr> to avoid invalid HTML nesting
  const HandleWrapper = Component === 'tr' ? 'td' : 'div';

  return (
    <Component ref={setNodeRef} style={style} className="group">
      <HandleWrapper className={Component === 'tr' ? 'w-10 px-2' : ''}>
        {!disabled && (
          <div 
            {...attributes} 
            {...listeners} 
            className="flex items-center justify-center p-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-opacity bg-white/50 backdrop-blur-sm rounded-lg"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}
      </HandleWrapper>
      {children}
    </Component>
  );
};

export default SortableItem;
