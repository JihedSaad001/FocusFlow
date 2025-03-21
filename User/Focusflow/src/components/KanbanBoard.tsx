import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Board, Task, Column as ColumnType } from "../types";
import Column from "./Column";
import TaskCard from "./TaskCard";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import Header from "./Header";

// Define the fixed 5 columns
const initialBoard: Board = {
  columns: [
    { id: uuidv4(), title: "Backlog", tasks: [] },
    { id: uuidv4(), title: "To Do", tasks: [] },
    { id: uuidv4(), title: "Doing", tasks: [] },
    { id: uuidv4(), title: "To Test", tasks: [] },
    { id: uuidv4(), title: "Done", tasks: [] },
  ],
};

const KanbanBoard: React.FC = () => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Fetch board from backend on mount
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(
          "https://focusflow-production.up.railway.app/api/user/kanban",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch board");
        const data = await response.json();
        console.log("Fetched Kanban board:", data);
        if (data.kanbanBoard && data.kanbanBoard.columns.length > 0) {
          setBoard(data.kanbanBoard);
        }
      } catch (error) {
        console.error("Error fetching Kanban board:", error);
      }
    };
    fetchBoard();
  }, []);

  const saveBoard = async (updatedBoard: Board) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(
        "https://focusflow-production.up.railway.app/api/user/kanban",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedBoard),
        }
      );
      const data = await response.json();
      console.log("Save response:", data);
      if (!response.ok) throw new Error("Failed to save board");
    } catch (error) {
      console.error("Error saving Kanban board:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { task, columnId } = active.data.current || {};
    if (task) {
      setActiveTask(task);
      setActiveColumn(columnId);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.task;
    const isOverAColumn = !over.data.current?.task;

    if (isActiveATask && isOverAColumn) {
      setBoard((board) => {
        const activeColumn = board.columns.find(
          (col) => col.id === active.data.current?.columnId
        );
        const overColumn = board.columns.find((col) => col.id === over.id);

        if (!activeColumn || !overColumn) return board;

        const activeTaskIndex = activeColumn.tasks.findIndex(
          (task) => task.id === activeId
        );

        const updatedColumns = board.columns.map((col) => {
          if (col.id === activeColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter((task) => task.id !== activeId),
            };
          }
          if (col.id === overColumn.id) {
            const newTasks = [...col.tasks];
            newTasks.push(activeColumn.tasks[activeTaskIndex]);
            return { ...col, tasks: newTasks };
          }
          return col;
        });

        const updatedBoard = { ...board, columns: updatedColumns };
        saveBoard(updatedBoard);
        return updatedBoard;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      setActiveColumn(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) {
      setActiveTask(null);
      setActiveColumn(null);
      return;
    }

    const isActiveATask = active.data.current?.task;
    if (isActiveATask) {
      const activeColumnId = active.data.current?.columnId;
      const overColumnId = over.data.current?.columnId || over.id;

      setBoard((board) => {
        const activeColumnIndex = board.columns.findIndex(
          (col) => col.id === activeColumnId
        );
        const overColumnIndex = board.columns.findIndex(
          (col) => col.id === overColumnId
        );

        if (activeColumnIndex === -1 || overColumnIndex === -1) return board;

        const activeColumn = board.columns[activeColumnIndex];
        const overColumn = board.columns[overColumnIndex];

        const activeTaskIndex = activeColumn.tasks.findIndex(
          (task) => task.id === activeId
        );
        if (activeTaskIndex === -1) return board;

        const newBoard = { ...board };
        const newColumns = [...newBoard.columns];

        if (activeColumnId === overColumnId) {
          const overTaskIndex = overColumn.tasks.findIndex(
            (task) => task.id === overId
          );
          if (overTaskIndex === -1) return board;

          const newTasks = [...newColumns[activeColumnIndex].tasks];
          newTasks.splice(activeTaskIndex, 1);
          newTasks.splice(
            overTaskIndex,
            0,
            activeColumn.tasks[activeTaskIndex]
          );
          newColumns[activeColumnIndex] = { ...activeColumn, tasks: newTasks };
        } else {
          const newSourceTasks = [...activeColumn.tasks];
          const [movedTask] = newSourceTasks.splice(activeTaskIndex, 1);
          const newDestTasks = [...overColumn.tasks];

          if (over.data.current?.task) {
            const overTaskIndex = newDestTasks.findIndex(
              (task) => task.id === overId
            );
            newDestTasks.splice(overTaskIndex, 0, movedTask);
          } else {
            newDestTasks.push(movedTask);
          }

          newColumns[activeColumnIndex] = {
            ...activeColumn,
            tasks: newSourceTasks,
          };
          newColumns[overColumnIndex] = { ...overColumn, tasks: newDestTasks };
        }

        const updatedBoard = { ...newBoard, columns: newColumns };
        saveBoard(updatedBoard);
        return updatedBoard;
      });
    }
    setActiveTask(null);
    setActiveColumn(null);
  };

  const handleAddTask = (columnId: string, task: Task) => {
    setBoard((prevBoard) => {
      const newColumns = prevBoard.columns.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col
      );
      const updatedBoard = { ...prevBoard, columns: newColumns };
      saveBoard(updatedBoard);
      return updatedBoard;
    });
  };

  const handleDeleteTask = (taskId: string, columnId: string) => {
    setBoard((prevBoard) => {
      const newColumns = prevBoard.columns.map((col) =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((task) => task.id !== taskId) }
          : col
      );
      const updatedBoard = { ...prevBoard, columns: newColumns };
      saveBoard(updatedBoard);
      return updatedBoard;
    });
  };

  const handleUpdateColumn = (columnId: string, title: string) => {
    setBoard((prevBoard) => {
      const newColumns = prevBoard.columns.map((col) =>
        col.id === columnId ? { ...col, title } : col
      );
      const updatedBoard = { ...prevBoard, columns: newColumns };
      saveBoard(updatedBoard);
      return updatedBoard;
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white/[0.08]  ">
      <Header />
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 pl-18">
            {board.columns.map((column) => (
              <div key={column.id} className="w-[350px] flex-shrink-0">
                <Column
                  column={column}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateColumn={handleUpdateColumn}
                />
              </div>
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                columnId={activeColumn || ""}
                onDelete={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default KanbanBoard;
