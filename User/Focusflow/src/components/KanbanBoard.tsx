import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Board, Task, Column as ColumnType } from "../types";
import Column from "./Column";
import { Plus, Trash2 } from "lucide-react";
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

const initialBoard: Board = {
  columns: [
    { id: uuidv4(), title: "To Do", tasks: [] },
    { id: uuidv4(), title: "In Progress", tasks: [] },
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
        const response = await fetch("http://localhost:5000/api/user/kanban", {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      const response = await fetch("http://localhost:5000/api/user/kanban", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedBoard),
      });
      const data = await response.json();
      console.log("Save response:", data);
      if (!response.ok) throw new Error("Failed to save board");
    } catch (error) {
      console.error("Error saving Kanban board:", error);
    }
  };

  // Original drag handlers with saveBoard added
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
        saveBoard(updatedBoard); // Save after update
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
        saveBoard(updatedBoard); // Save after update
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

  const handleAddColumn = () => {
    const newColumn: ColumnType = {
      id: uuidv4(),
      title: "New Column",
      tasks: [],
    };
    setBoard((prevBoard) => {
      const updatedBoard = {
        ...prevBoard,
        columns: [...prevBoard.columns, newColumn],
      };
      saveBoard(updatedBoard);
      return updatedBoard;
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    setBoard((prevBoard) => {
      const newColumns = prevBoard.columns.filter((col) => col.id !== columnId);
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

  // Original CSS preserved
  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <div className="flex justify-between items-center mb-4 px-4 ml-50">
        <button
          onClick={handleAddColumn}
          className="mt-4 w-60 h-15 bg-[#1E1E1E] space-x-2 border-2 border-red-600 bg-clip-padding border-gradient-to-r from-[#830E13] to-[#6B1E07] text-white text-2xl px-6 py-2 rounded-2xl shadow-xl hover:scale-105 transition flex items-center"
        >
          <Plus size={20} />
          <span> Add Column</span>
        </button>
      </div>
      <div className="flex overflow-x-auto pb-4 flex-1 ml-50">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-wrap gap-6">
            {board.columns.map((column) => (
              <div key={column.id} className="w-[400px]">
                <div className="relative">
                  <Column
                    column={column}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onUpdateColumn={handleUpdateColumn}
                  />
                  <button
                    onClick={() => handleDeleteColumn(column.id)}
                    className="absolute top-0 right-0 mt-2 mr-2 p-1 text-white rounded-full hover:bg-red-600 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
