"use client";

import { cn } from "@/lib/cn";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

type DraggableLayoutProps = {
  items: string[];
  onChange: (items: string[]) => void;
  children: ReactNode;
  className?: string;
};

export function DraggableLayout({
  items,
  onChange,
  children,
  className,
}: DraggableLayoutProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;

        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1) {
          onChange(arrayMove(items, oldIndex, newIndex));
        }
      }}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className={cn("grid gap-4 min-h-0", className)}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

type SortablePanelProps = {
  id: string;
  children: (dragHandleProps: { attributes: any; listeners: any }) => ReactNode;
  className?: string;
};

export function SortablePanel({ id, children, className }: SortablePanelProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("h-full", className)}>
      {/* children یک فانکشن است که props هندل را می‌گیرد */}
      {children({ attributes, listeners })}
    </div>
  );
}
