"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, type Theme } from "./ThemeProvider";
import { addCategory, addTopic, addTodo, toggleTodo, logoutUser, deleteTodo, deleteTopic, deleteCategory, renameTodo, renameTopic, renameCategory, importCsvData, reorderTopic, reorderTodo } from "../actions";
import { ThemeSelect } from "./ThemeSelect";
import { Modal, ConfirmModal } from "./Modal";
import { CheckCircle2, Circle, Trash2, Plus, LogOut, ChevronRight, Upload, Download, GripVertical, GripHorizontal } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

type Category = { id: number, name: string };
type Topic = { id: number, category_id: number, name: string, position: number };
type Todo = { id: number, topic_id: number, text: string, is_completed: boolean, position: number, created_at: string, completed_at: string | null };

const TOPIC_COLORS = [
  { accent: '#0A84FF', bg: 'rgba(10, 132, 255, 0.08)', border: 'rgba(10, 132, 255, 0.25)' },
  { accent: '#30D158', bg: 'rgba(48, 209, 88, 0.08)', border: 'rgba(48, 209, 88, 0.25)' },
  { accent: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.08)', border: 'rgba(255, 159, 10, 0.25)' },
  { accent: '#BF5AF2', bg: 'rgba(191, 90, 242, 0.08)', border: 'rgba(191, 90, 242, 0.25)' },
  { accent: '#FF375F', bg: 'rgba(255, 55, 95, 0.08)', border: 'rgba(255, 55, 95, 0.25)' },
  { accent: '#64D2FF', bg: 'rgba(100, 210, 255, 0.08)', border: 'rgba(100, 210, 255, 0.25)' },
  { accent: '#FFD60A', bg: 'rgba(255, 214, 10, 0.08)', border: 'rgba(255, 214, 10, 0.25)' },
  { accent: '#AC8E68', bg: 'rgba(172, 142, 104, 0.08)', border: 'rgba(172, 142, 104, 0.25)' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const minuteStr = minutes.toString().padStart(2, '0');
  return `${month} ${day}, ${year}, ${hour12}:${minuteStr} ${ampm}`;
}

function TodoTooltip({ createdAt, completedAt }: { createdAt: string, completedAt: string | null }) {
  return (
    <div className="todo-tooltip-wrapper">
      <div className="todo-tooltip-content">
        <div className="todo-tooltip-row">
          <span className="todo-tooltip-label">Created:</span>
          <span className="todo-tooltip-value">{formatDate(createdAt)}</span>
        </div>
        {completedAt && (
          <div className="todo-tooltip-row">
            <span className="todo-tooltip-label">Completed:</span>
            <span className="todo-tooltip-value">{formatDate(completedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function InlineEdit({ value, onSave, className, style }: { value: string, onSave: (val: string) => void, className?: string, style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setText(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => {
    setEditing(false);
    if (text.trim() !== '' && text !== value) onSave(text);
    else setText(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="inline-edit-input"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setText(value); setEditing(false); } }}
        style={style}
      />
    );
  }

  return (
    <span
      className={`inline-edit-text ${className || ''}`}
      onClick={() => setEditing(true)}
      style={{ ...style, cursor: 'text' }}
    >
      {value}
    </span>
  );
}

export default function Dashboard({ username, initialCategories, initialTopics, initialTodos }: any) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (args[0]?.includes?.('nested scroll container')) return;
      originalWarn.apply(console, args);
    };
    return () => { console.warn = originalWarn; };
  }, []);

  const positionTooltip = (wrapper: HTMLElement) => {
    const textWrapper = wrapper.parentElement as HTMLElement;
    if (!textWrapper) return;
    const rect = textWrapper.getBoundingClientRect();
    const tooltipContent = wrapper.querySelector('.todo-tooltip-content') as HTMLElement;
    if (!tooltipContent) return;
    const tooltipWidth = tooltipContent.offsetWidth;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    
    let top: number;
    if (spaceBelow < 80) {
      top = rect.top - 8;
    } else {
      top = rect.bottom + 8;
    }
    
    wrapper.style.left = `${left}px`;
    wrapper.style.top = `${top}px`;
  };

  useEffect(() => {
    const wrappers = document.querySelectorAll('.todo-tooltip-wrapper') as NodeListOf<HTMLElement>;
    wrappers.forEach((wrapper) => {
      positionTooltip(wrapper);
    });

    const handleMouseEnter = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const textWrapper = e.target.closest('.todo-text-wrapper') as HTMLElement;
      if (!textWrapper) return;
      const tooltip = textWrapper.querySelector('.todo-tooltip-wrapper') as HTMLElement;
      if (tooltip) {
        positionTooltip(tooltip);
        tooltip.classList.add('visible');
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const textWrapper = e.target.closest('.todo-text-wrapper') as HTMLElement;
      if (!textWrapper) return;
      const tooltip = textWrapper.querySelector('.todo-tooltip-wrapper') as HTMLElement;
      if (tooltip) {
        tooltip.classList.remove('visible');
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    window.addEventListener('resize', () => {
      wrappers.forEach(positionTooltip);
    });
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      window.removeEventListener('resize', () => {
        wrappers.forEach(positionTooltip);
      });
    };
  }, []);

  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  useEffect(() => { setTopics(initialTopics); }, [initialTopics]);
  useEffect(() => { setTodos(initialTodos); }, [initialTodos]);

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(initialCategories.length > 0 ? initialCategories[0].id : null);
  const [newTodoValue, setNewTodoValue] = useState<Record<number, string>>({});
  const [addingTodoTo, setAddingTodoTo] = useState<number | null>(null);
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, onSubmit: (v: string) => void }>({ isOpen: false, title: "", onSubmit: () => { } });
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleAddTodo = async (topicId: number) => {
    if (!newTodoValue[topicId] || newTodoValue[topicId].trim() === "") return;
    setAddingTodoTo(topicId);
    await addTodo(topicId, newTodoValue[topicId]);
    setNewTodoValue(prev => ({ ...prev, [topicId]: "" }));
    setAddingTodoTo(null);
  };

  const handleToggleTodo = async (todoId: number, is_completed: boolean) => {
    const newCompletedAt = is_completed ? new Date().toISOString() : null;
    setTodos(todos.map(t => t.id === todoId ? { ...t, is_completed, completed_at: newCompletedAt } : t));
    await toggleTodo(todoId, is_completed);
  };

  const handleDeleteTodo = async (todoId: number) => {
    setTodos(todos.filter(t => t.id !== todoId));
    await deleteTodo(todoId);
  };

  const handleRenameTodo = async (todoId: number, text: string) => {
    setTodos(todos.map(t => t.id === todoId ? { ...t, text } : t));
    await renameTodo(todoId, text);
  };

  const handleDeleteTopic = async (topicId: number) => {
    setTopics(topics.filter(t => t.id !== topicId));
    await deleteTopic(topicId);
  };

  const handleRenameTopic = async (topicId: number, name: string) => {
    setTopics(topics.map(t => t.id === topicId ? { ...t, name } : t));
    await renameTopic(topicId, name);
  };

  const handleAddTopic = async (catId: number, name: string) => {
    setIsAddingTopic(true);
    await addTopic(catId, name);
    setIsAddingTopic(false);
  };

  const openDeleteConfirm = (title: string, message: string, action: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm: action });
  };

  const handleExportCSV = () => {
    let csvContent = "Category,Topic,Todo,Status\n";
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    const exportRows: string[] = [];

    initialCategories.forEach((cat: Category) => {
      const catTopics = topics.filter((t: Topic) => t.category_id === cat.id);

      if (catTopics.length === 0) {
        exportRows.push([escape(cat.name), "", "", ""].join(","));
      } else {
        catTopics.forEach((topic: Topic) => {
          const topicTodos = todos.filter((td: Todo) => td.topic_id === topic.id);
          if (topicTodos.length === 0) {
            exportRows.push([escape(cat.name), escape(topic.name), "", ""].join(","));
          } else {
            topicTodos.forEach((todo: Todo) => {
              exportRows.push([
                escape(cat.name),
                escape(topic.name),
                escape(todo.text),
                todo.is_completed ? "completed" : "pending"
              ].join(","));
            });
          }
        });
      }
    });

    csvContent += exportRows.join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "compleme_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const res = await importCsvData(text);
      if (res?.error) {
        alert("Import failed: " + res.error);
      }
    } catch (err: any) {
      alert("Error reading file");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === "topic") {
      const activeTopicsList = topics
        .filter(t => t.category_id === activeCategoryId)
        .sort((a, b) => (a.position - b.position) || (a.id - b.id));

      const movingTopic = { ...activeTopicsList[source.index] };
      
      // Create a new array for position calculation
      const reorderedList = [...activeTopicsList];
      reorderedList.splice(source.index, 1);
      reorderedList.splice(destination.index, 0, movingTopic);

      let newPosition: number;
      if (reorderedList.length === 1) {
        newPosition = 1000;
      } else if (destination.index === 0) {
        newPosition = reorderedList[1].position - 1000;
      } else if (destination.index === reorderedList.length - 1) {
        newPosition = reorderedList[reorderedList.length - 2].position + 1000;
      } else {
        const prevPos = reorderedList[destination.index - 1].position;
        const nextPos = reorderedList[destination.index + 1].position;
        if (prevPos === nextPos) {
          newPosition = prevPos + (destination.index * 10);
        } else {
          newPosition = (prevPos + nextPos) / 2.0;
        }
      }

      movingTopic.position = newPosition;

      setTopics(prev => {
        const others = prev.filter(t => t.id !== movingTopic.id);
        return [...others, movingTopic].sort((a, b) => (a.position - b.position) || (a.id - b.id));
      });

      await reorderTopic(movingTopic.id, newPosition);
      return;
    }

    if (type === "todo") {
      const sourceTopicId = parseInt(source.droppableId.split('-')[1]);
      const destTopicId = parseInt(destination.droppableId.split('-')[1]);
      const todoId = parseInt(draggableId.split('-')[1]);

      const destTodosList = todos
        .filter(t => t.topic_id === destTopicId)
        .sort((a, b) => (a.position - b.position) || (a.id - b.id));

      const originalTodo = todos.find(t => t.id === todoId)!;
      const movingTodo = { ...originalTodo };

      // Create a new array for position calculation
      let listForCalc = [...destTodosList];
      if (sourceTopicId === destTopicId) {
        // Adjust destination index if moving down in the same list
        const adjustedDestIndex = destination.index > source.index ? destination.index - 1 : destination.index;
        listForCalc.splice(source.index, 1);
        listForCalc.splice(adjustedDestIndex, 0, movingTodo);
      } else {
        listForCalc.splice(destination.index, 0, movingTodo);
      }

      let newPosition: number;
      if (listForCalc.length === 1) {
        newPosition = 1000;
      } else if (destination.index === 0) {
        newPosition = listForCalc[1].position - 1000;
      } else if (destination.index === listForCalc.length - 1) {
        newPosition = listForCalc[listForCalc.length - 2].position + 1000;
      } else {
        const prevPos = listForCalc[destination.index - 1].position;
        const nextPos = listForCalc[destination.index + 1].position;
        if (prevPos === nextPos) {
          newPosition = prevPos + (destination.index * 10);
        } else {
          newPosition = (prevPos + nextPos) / 2.0;
        }
      }

      movingTodo.position = newPosition;
      movingTodo.topic_id = destTopicId;

      setTodos(prev => {
        // Remove from old topic and update
        let others = prev.filter(t => t.id !== movingTodo.id);
        // If moving to different topic, also filter out from dest topic's current todos
        if (sourceTopicId !== destTopicId) {
          // Add the moved todo with new position
          return [...others, movingTodo];
        }
        return [...others, movingTodo].sort((a, b) => (a.position - b.position) || (a.id - b.id));
      });

      await reorderTodo(movingTodo.id, destTopicId, newPosition);
    }
  };

  const activeTopics = topics.filter((t: Topic) => t.category_id === activeCategoryId).sort((a, b) => a.position - b.position);

  // Analytics
  const topicStats = activeTopics.map((topic: Topic, idx: number) => {
    const topicTodos = todos.filter((td: Todo) => td.topic_id === topic.id);
    const total = topicTodos.length;
    const completed = topicTodos.filter((td: Todo) => td.is_completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: topic.name, percentage, fill: TOPIC_COLORS[idx % TOPIC_COLORS.length].accent };
  });

  const allActiveTodos = todos.filter((td: Todo) => activeTopics.some((t: Topic) => t.id === td.topic_id));
  const totalActive = allActiveTodos.length;
  const totalActiveCompleted = allActiveTodos.filter((td: Todo) => td.is_completed).length;
  const pieData = totalActive > 0
    ? [{ name: 'Completed', value: totalActiveCompleted }, { name: 'Incomplete', value: totalActive - totalActiveCompleted }]
    : [{ name: 'No Data', value: 1 }];

  return (
    <>
      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onSubmit={modalConfig.onSubmit}
      />
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
      />

      <header className="header">
        <div className="header-title">compleme</div>
        <div className="header-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '500', color: 'var(--fg-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>{username}</span>
            <ThemeSelect theme={theme} setTheme={setTheme} />

            <button className="btn btn-icon" onClick={handleExportCSV} title="Export to CSV">
              <Download size={16} />
            </button>

            <input
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleImportCSV}
            />
            <button
              className="btn btn-icon"
              onClick={() => fileInputRef.current?.click()}
              title="Import from CSV"
              disabled={isImporting}
              style={{ opacity: isImporting ? 0.5 : 1 }}
            >
              <Upload size={16} />
            </button>

            <button className="btn btn-icon" onClick={() => logoutUser()} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="tabs">
        {initialCategories.map((cat: Category) => (
          <div key={cat.id} className="tab-wrapper">
            <button
              className={`tab ${activeCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategoryId(cat.id)}
              onDoubleClick={() => {
                setModalConfig({ isOpen: true, title: `Rename "${cat.name}"`, onSubmit: async (name) => { await renameCategory(cat.id, name); } });
              }}
            >
              {cat.name}
            </button>
            <button
              className="tab-delete"
              onClick={() => openDeleteConfirm("Delete Category", `Are you sure you want to delete "${cat.name}" and all its topics and todos?`, () => { deleteCategory(cat.id); if (activeCategoryId === cat.id) setActiveCategoryId(null); })}
              title="Delete Category"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          className="tab tab-add hover-add-target"
          onClick={() => {
            setModalConfig({ isOpen: true, title: "New Category Name", onSubmit: async (name) => { await addCategory(name); } });
          }}
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="topic" direction="horizontal">
          {(provided) => (
            <div className="board-container" ref={provided.innerRef} {...provided.droppableProps}>
              {activeTopics.map((topic: Topic, idx: number) => {
                const color = TOPIC_COLORS[idx % TOPIC_COLORS.length];
                const topicTodos = todos.filter((td: Todo) => td.topic_id === topic.id).sort((a, b) => a.position - b.position);
                return (
                  <Draggable key={topic.id.toString()} draggableId={`topic-${topic.id}`} index={idx}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="topic-column"
                        style={{ borderColor: color.border, '--topic-accent': color.accent, '--topic-bg': color.bg, ...provided.draggableProps.style } as any}
                      >
                        <div className="topic-header" style={{ borderBottomColor: color.border }}>
                          <div {...provided.dragHandleProps} className="topic-drag-handle" style={{ cursor: "grab", display: "flex", alignItems: "center", paddingRight: "8px", opacity: 0.4 }}>
                            <GripHorizontal size={16} className="text-muted" />
                          </div>
                          <InlineEdit
                            value={topic.name}
                            onSave={(name) => handleRenameTopic(topic.id, name)}
                            className="topic-title"
                            style={{ color: color.accent, flex: 1 }}
                          />
                          <button className="topic-delete hover-child" onClick={() => openDeleteConfirm("Delete Topic", `Delete "${topic.name}" and all its todos?`, () => handleDeleteTopic(topic.id))} title="Delete Topic">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <Droppable droppableId={`topic-${topic.id}`} type="todo">
                          {(provided) => (
                            <div className="todo-list" ref={provided.innerRef} {...provided.droppableProps}>
                              {topicTodos.map((todo: Todo, tIdx: number) => (
                                <Draggable key={todo.id.toString()} draggableId={`todo-${todo.id}`} index={tIdx}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`todo-item ${todo.is_completed ? 'completed' : ''}`}
                                      style={{ ...provided.draggableProps.style }}
                                    >
                                      <div {...provided.dragHandleProps} className="drag-handle" style={{ cursor: "grab", display: "flex", alignItems: "center", paddingRight: "4px", opacity: 0.4 }}>
                                        <GripVertical size={14} className="text-muted" />
                                      </div>
                                      <button className="todo-check" onClick={() => handleToggleTodo(todo.id, !todo.is_completed)}>
                                        {todo.is_completed
                                          ? <CheckCircle2 size={18} style={{ color: color.accent }} />
                                          : <Circle size={18} className="text-muted" />
                                        }
                                      </button>
                                        <div className="todo-text-wrapper">
                                        <InlineEdit
                                          value={todo.text}
                                          onSave={(text) => handleRenameTodo(todo.id, text)}
                                          className="todo-text"
                                        />
                                        <TodoTooltip createdAt={todo.created_at} completedAt={todo.completed_at} />
                                      </div>
                                      <button className="todo-delete hover-child" onClick={() => openDeleteConfirm("Delete Todo", `Delete "${todo.text}"?`, () => handleDeleteTodo(todo.id))} title="Delete Todo">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <div className="add-todo-form hover-add-target">
                          <input
                            type="text"
                            value={newTodoValue[topic.id] || ""}
                            onChange={(e) => setNewTodoValue(prev => ({ ...prev, [topic.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo(topic.id)}
                            placeholder="New item..."
                            className="add-todo-input"
                          />
                          <button className="btn btn-primary btn-icon" style={{ backgroundColor: color.accent, borderColor: color.accent }} onClick={() => handleAddTodo(topic.id)} disabled={addingTodoTo === topic.id}>
                            {addingTodoTo === topic.id ? <div className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--bg-main)', borderWidth: 2 }} /> : <Plus size={16} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
              {activeCategoryId && (
                <div className="topic-column new-topic-column hover-add-target">
                  <button className="btn btn-ghost" onClick={() => setModalConfig({ isOpen: true, title: "New Topic Name", onSubmit: handleAddTopic.bind(null, activeCategoryId) })} disabled={isAddingTopic}>
                    {isAddingTopic ? <div className="spinner" style={{ width: 16, height: 16, marginRight: 6, borderWidth: 2 }} /> : <Plus size={18} style={{ marginRight: '6px' }} />}
                    {isAddingTopic ? "Adding..." : "Add Topic"}
                  </button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="analytics-container">
        <div className="analytics-header-section">
          <div>
            <h2 className="analytics-title">Project Overview</h2>
            <p className="analytics-subtitle">{totalActiveCompleted} of {totalActive} tasks completed</p>
          </div>
          <div className="global-progress-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path className="circle"
                strokeDasharray={`${totalActive > 0 ? (totalActiveCompleted / totalActive) * 100 : 0}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{totalActive > 0 ? Math.round((totalActiveCompleted / totalActive) * 100) : 0}%</text>
            </svg>
          </div>
        </div>

        <div className="topics-progress-list">
          {topicStats.length === 0 && (
            <div className="empty-state" style={{ padding: '2rem 0' }}>No topic data available.</div>
          )}
          {topicStats.map((stat: any, idx: number) => (
            <div key={idx} className="topic-progress-row">
              <div className="topic-progress-label">
                <ChevronRight size={14} style={{ color: stat.fill, marginRight: '4px' }} />
                <span>{stat.name}</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${stat.percentage}%`, backgroundColor: stat.fill }}
                  />
                </div>
                <div className="progress-bar-text">{stat.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
