import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Board, Task } from "../types";
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
        // If kanbanBoard is null or missing columns, fall back to initialBoard
        if (data.kanbanBoard && Array.isArray(data.kanbanBoard.columns)) {
          setBoard(data.kanbanBoard);
        } else {
          console.warn("Kanban board data is invalid, using initial board");
          setBoard(initialBoard);
        }
      } catch (error) {
        console.error("Error fetching Kanban board:", error);
        setBoard(initialBoard); // Fallback to initialBoard on error
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
          (col) => col?.id === active.data.current?.columnId
        );
        const overColumn = board.columns.find((col) => col?.id === over.id);

        if (!activeColumn || !overColumn) return board;

        const activeTaskIndex = activeColumn.tasks.findIndex(
          (task) => task.id === activeId
        );

        const updatedColumns = board.columns.map((col) => {
          if (col?.id === activeColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter((task) => task.id !== activeId),
            };
          }
          if (col?.id === overColumn.id) {
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
          (col) => col?.id === activeColumnId
        );
        const overColumnIndex = board.columns.findIndex(
          (col) => col?.id === overColumnId
        );

        if (activeColumnIndex === -1 || overColumnIndex === -1) return board;

        const activeColumn = board.columns[activeColumnIndex];
        const overColumn = board.columns[overColumnIndex];

        if (!activeColumn || !overColumn) return board;

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
        col?.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col
      );
      const updatedBoard = { ...prevBoard, columns: newColumns };
      saveBoard(updatedBoard);
      return updatedBoard;
    });
  };

  const handleDeleteTask = (taskId: string, columnId: string) => {
    setBoard((prevBoard) => {
      const newColumns = prevBoard.columns.map((col) =>
        col?.id === columnId
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
        col?.id === columnId ? { ...col, title } : col
      );
      const updatedBoard = { ...prevBoard, columns: newColumns };
      saveBoard(updatedBoard);
      return updatedBoard;
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#121212]">
      {/* Sidebar Space - Responsive, hidden on very small screens */}
      <div className="hidden sm:block w-14 sm:w-16 md:w-20 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Integrated Header */}
        <div className="bg-[#1E1E1E] border-b border-gray-800 h-40 w-full">
          <div className="p-6">
            <div className="flex items-center justify-center mb-2">
              <div className="text-3xl mr-3">🎒</div>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                Tasks
              </h1>
            </div>
          </div>
        </div>

        {/* Kanban Board Content */}
        <div className="flex-1 overflow-x-auto p-2 sm:p-4 md:p-6">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 md:gap-4 min-w-full">
              {board.columns && Array.isArray(board.columns) ? (
                board.columns.map((column) =>
                  column ? (
                    <div
                      key={column.id}
                      className="w-full xs:w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px] flex-shrink-0"
                    >
                      <Column
                        column={column}
                        onAddTask={handleAddTask}
                        onDeleteTask={handleDeleteTask}
                        onUpdateColumn={handleUpdateColumn}
                      />
                    </div>
                  ) : null
                )
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No columns available
                </div>
              )}
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
    </div>
  );
};

export default KanbanBoard;
