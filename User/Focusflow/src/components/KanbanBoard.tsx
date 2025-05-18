"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Board, Task, Column as ColumnType } from "../types";
import TaskCard from "./TaskCard";
import { Plus } from "lucide-react";
import axios from "axios";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Initial board with 5 columns
const initialBoard: Board = {
  columns: [
    { id: uuidv4(), title: "Backlog", tasks: [] },
    { id: uuidv4(), title: "To Do", tasks: [] },
    { id: uuidv4(), title: "Doing", tasks: [] },
    { id: uuidv4(), title: "Blocked", tasks: [] },
    { id: uuidv4(), title: "Done", tasks: [] },
  ],
};

const KanbanBoard: React.FC = () => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [draggedTaskBackup, setDraggedTaskBackup] = useState<{
    task: Task;
    columnId: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
      options: {
        ignoreFrom: ".bg-red-500, button",
      },
    })
  );

  // Fetch board from backend on mount
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Create axios instance with default config
        const api = axios.create({
          baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Get kanban board
        const response = await api.get("/user/kanban");
        const data = response.data;

        if (data.kanbanBoard && Array.isArray(data.kanbanBoard.columns)) {
          setBoard(data.kanbanBoard);
        } else {
          console.warn("Kanban board data is invalid, using initial board");
          setBoard(initialBoard);
        }
      } catch (error) {
        console.error("Error fetching Kanban board:", error);
        setBoard(initialBoard);
      }
    };
    fetchBoard();
  }, []);

  // Save board to backend
  const saveBoard = async (updatedBoard: Board) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("Saving board with data:", JSON.stringify(updatedBoard));

      // Create axios instance with default config
      const api = axios.create({
        baseURL: "http://localhost:5000/api",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Update kanban board
      await api.put("/user/kanban", updatedBoard);

      console.log("Board saved successfully");
    } catch (error) {
      console.error("Error saving Kanban board:", error);
      setNotification({
        message: "Error saving board",
        type: "error",
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { task, columnId } = active.data.current || {};
    if (task) {
      setDraggedTaskBackup({ task, columnId });
      setActiveTask(task);
      setActiveColumnId(columnId);
    }
  };

  // Handle drag end (reorder tasks within the same column or move to a new column)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // If there's no over target, restore the task to its original position
    if (!over) {
      if (draggedTaskBackup) {
        setBoard((prevBoard) => {
          const taskExists = prevBoard.columns.some((col) =>
            col.tasks.some((task) => task._id === draggedTaskBackup.task._id)
          );

          if (taskExists) return prevBoard;

          const updatedColumns = prevBoard.columns.map((col) => {
            if (col.id === draggedTaskBackup.columnId) {
              return {
                ...col,
                tasks: [...col.tasks, draggedTaskBackup.task],
              };
            }
            return col;
          });

          const updatedBoard = { ...prevBoard, columns: updatedColumns };
          saveBoard(updatedBoard); // Ensure the board is saved even if the drag is canceled
          return updatedBoard;
        });
      }

      setActiveTask(null);
      setActiveColumnId(null);
      setDraggedTaskBackup(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      setActiveTask(null);
      setActiveColumnId(null);
      setDraggedTaskBackup(null);
      return;
    }

    const isActiveATask = active.data.current?.task;
    if (isActiveATask) {
      const activeColumnId = active.data.current?.columnId;
      const overColumnId = over.data.current?.columnId || over.id; // Handle case where over is a column

      setBoard((prevBoard) => {
        const activeColumn = prevBoard.columns.find(
          (col) => col.id === activeColumnId
        );
        const overColumn = prevBoard.columns.find(
          (col) => col.id === overColumnId
        );

        if (!activeColumn || !overColumn) return prevBoard;

        const activeTaskIndex = activeColumn.tasks.findIndex(
          (task) => task._id === activeId
        );
        if (activeTaskIndex === -1) return prevBoard;

        const updatedColumns = [...prevBoard.columns];

        if (activeColumnId === overColumnId) {
          // Reorder within the same column
          const overTaskIndex = overColumn.tasks.findIndex(
            (task) => task._id === overId
          );
          if (overTaskIndex === -1) return prevBoard;

          const activeColumnIndex = prevBoard.columns.findIndex(
            (col) => col.id === activeColumnId
          );
          const newTasks = [...activeColumn.tasks];
          const [movedTask] = newTasks.splice(activeTaskIndex, 1);
          newTasks.splice(overTaskIndex, 0, movedTask);
          updatedColumns[activeColumnIndex] = {
            ...activeColumn,
            tasks: newTasks,
          };
        } else {
          // Move to a different column
          const activeColumnIndex = prevBoard.columns.findIndex(
            (col) => col.id === activeColumnId
          );
          const overColumnIndex = prevBoard.columns.findIndex(
            (col) => col.id === overColumnId
          );

          const newSourceTasks = [...activeColumn.tasks];
          const [movedTask] = newSourceTasks.splice(activeTaskIndex, 1);
          const newDestTasks = [...overColumn.tasks];

          // If over is a task, insert at the task's position; if over is a column, append
          if (over.data.current?.task) {
            const overTaskIndex = newDestTasks.findIndex(
              (task) => task._id === overId
            );
            newDestTasks.splice(overTaskIndex, 0, movedTask);
          } else {
            newDestTasks.push(movedTask); // Append to the end if dropping on a column
          }

          updatedColumns[activeColumnIndex] = {
            ...activeColumn,
            tasks: newSourceTasks,
          };
          updatedColumns[overColumnIndex] = {
            ...overColumn,
            tasks: newDestTasks,
          };
        }

        const updatedBoard = { ...prevBoard, columns: updatedColumns };
        saveBoard(updatedBoard); // Ensure saveBoard is called after the state update
        return updatedBoard;
      });
    }

    setActiveTask(null);
    setActiveColumnId(null);
    setDraggedTaskBackup(null);
  };

  const handleAddTask = (columnId: string, task: Task) => {
    console.log(`Adding task to column: ${columnId}`, task);
    setBoard((prevBoard) => {
      const updatedColumns = prevBoard.columns.map((col) =>
        col.id === columnId
          ? { ...col, tasks: [...(col.tasks || []), task] }
          : col
      );
      const updatedBoard = { ...prevBoard, columns: updatedColumns };

      console.log("Updated board:", updatedBoard);
      saveBoard(updatedBoard);

      return updatedBoard;
    });
  };

  const handleDeleteTask = (taskId: string, columnId: string) => {
    setBoard((prevBoard) => {
      const updatedColumns = prevBoard.columns.map((col) =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((task) => task._id !== taskId) }
          : col
      );
      const updatedBoard = { ...prevBoard, columns: updatedColumns };
      saveBoard(updatedBoard);
      return updatedBoard;
    });
  };

  const Column: React.FC<{
    column: ColumnType;
    onAddTask: (columnId: string, task: Task) => void;
    onDeleteTask: (taskId: string, columnId: string) => void;
  }> = ({ column, onAddTask, onDeleteTask }) => {
    const [showForm, setShowForm] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>({
      title: "",
      priority: "Medium",
      icon: "📝",
    });

    const { setNodeRef } = useDroppable({
      id: column.id,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newTask.title) {
        const task: Task = {
          _id: Date.now().toString(),
          title: newTask.title,
          priority: newTask.priority as "Low" | "Medium" | "High",

          icon: newTask.icon,
        };

        onAddTask(column.id, task);
        setNewTask({
          title: "",
          priority: "Medium",
          icon: "📝",
        });
        setShowForm(false);
      }
    };

    return (
      <div
        ref={setNodeRef}
        className="bg-[#1E1E1E] rounded-xl shadow-lg flex flex-col max-h-[calc(100vh-150px)] border border-gray-700"
      >
        {/* Column Header */}
        <div
          className="flex items-center justify-between p-4 bg-red-500 rounded-t-xl"
          data-no-dnd="true"
        >
          <div className="flex items-center">
            <h3 className="font-semibold text-white text-lg">{column.title}</h3>
            <span className="ml-3 bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded-full">
              {column.tasks.length}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              className="p-1 text-white hover:text-gray-300 transition"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-3">
          <SortableContext
            items={column.tasks.map((task) => task._id)}
            strategy={verticalListSortingStrategy}
          >
            {column.tasks.length > 0 ? (
              column.tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  columnId={column.id}
                  onDelete={onDeleteTask}
                  data-draggable="true"
                />
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No tasks yet</div>
            )}
          </SortableContext>
        </div>

        {/* Add Task Form */}
        {showForm ? (
          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 p-3 rounded-b-xl border-t border-gray-700"
          >
            <input
              type="text"
              placeholder="Task title"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              autoFocus
            />

            <div className="flex gap-3 mt-3">
              <select
                className="p-3 bg-gray-700 border border-gray-600 rounded-lg flex-1 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    priority: e.target.value as "Low" | "Medium" | "High",
                  })
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <select
                className="p-3 bg-gray-700 border border-gray-600 rounded-lg flex-1 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                value={newTask.icon}
                onChange={(e) =>
                  setNewTask({ ...newTask, icon: e.target.value })
                }
              >
                <option value="📝">📝 Note</option>
                <option value="🐛">🐛 Bug</option>
                <option value="✨">✨ Feature</option>
                <option value="🔄">🔄 Refactor</option>
                <option value="📱">📱 Mobile</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg transition"
              >
                Add Task
              </button>
            </div>
          </form>
        ) : (
          column.tasks.length === 0 && (
            <button
              className="w-full py-3 flex items-center justify-center text-gray-400 hover:bg-gray-700 rounded-b-xl border-t border-gray-700 transition"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} className="mr-2" />
              <span className="text-sm font-medium">Add Task</span>
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#121212] text-white flex flex-col">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1E1E1E] border-b border-gray-700 p-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
          Kanban Board
        </h1>
        <p className="text-gray-400 mt-2">
          Organize your tasks using this personal Kanban board.
        </p>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
            }}
          >
            {board.columns.map((column) => (
              <div key={column.id} className="flex flex-col">
                <Column
                  column={column}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                />
              </div>
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                columnId={activeColumnId || ""}
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
