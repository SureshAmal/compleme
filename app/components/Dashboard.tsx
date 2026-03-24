"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, type Theme } from "./ThemeProvider";
import { addCategory, addTopic, addTodo, toggleTodo, logoutUser, deleteTodo, deleteTopic, deleteCategory, renameTodo, renameTopic, renameCategory, importCsvData } from "../actions";
import { ThemeSelect } from "./ThemeSelect";
import { Modal, ConfirmModal } from "./Modal";
import { CheckCircle2, Circle, Trash2, Plus, LogOut, ChevronRight, Upload, Download } from "lucide-react";

type Category = { id: number, name: string };
type Topic = { id: number, category_id: number, name: string };
type Todo = { id: number, topic_id: number, text: string, is_completed: boolean };

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

// Inline editable text component
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
      title="Click to rename"
      style={{ ...style, cursor: 'text' }}
    >
      {value}
    </span>
  );
}

export default function Dashboard({ username, initialCategories, initialTopics, initialTodos }: any) {
  const { theme, setTheme } = useTheme();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(initialCategories.length > 0 ? initialCategories[0].id : null);
  const [newTodoValue, setNewTodoValue] = useState<Record<number, string>>({});

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, onSubmit: (v: string) => void }>({ isOpen: false, title: "", onSubmit: () => { } });
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleAddTodo = async (topicId: number) => {
    if (!newTodoValue[topicId] || newTodoValue[topicId].trim() === "") return;
    await addTodo(topicId, newTodoValue[topicId]);
    setNewTodoValue(prev => ({ ...prev, [topicId]: "" }));
  };

  const openDeleteConfirm = (title: string, message: string, action: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm: action });
  };

  const handleExportCSV = () => {
    let csvContent = "Category,Topic,Todo,Status\n";
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    const exportRows: string[] = [];

    initialCategories.forEach((cat: Category) => {
      const catTopics = initialTopics.filter((t: Topic) => t.category_id === cat.id);
      
      if (catTopics.length === 0) {
        // Empty category
        exportRows.push([escape(cat.name), "", "", ""].join(","));
      } else {
        catTopics.forEach((topic: Topic) => {
          const topicTodos = initialTodos.filter((td: Todo) => td.topic_id === topic.id);
          
          if (topicTodos.length === 0) {
            // Empty topic
            exportRows.push([escape(cat.name), escape(topic.name), "", ""].join(","));
          } else {
            topicTodos.forEach((todo: Todo) => {
              // Full structure
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

  const activeTopics = initialTopics.filter((t: Topic) => t.category_id === activeCategoryId);

  // Analytics
  const topicStats = activeTopics.map((topic: Topic, idx: number) => {
    const topicTodos = initialTodos.filter((td: Todo) => td.topic_id === topic.id);
    const total = topicTodos.length;
    const completed = topicTodos.filter((td: Todo) => td.is_completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: topic.name, percentage, fill: TOPIC_COLORS[idx % TOPIC_COLORS.length].accent };
  });

  const allActiveTodos = initialTodos.filter((td: Todo) => activeTopics.some((t: Topic) => t.id === td.topic_id));
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

      <div className="board-container">
        {activeTopics.length === 0 && (
          <div className="empty-state">
            <p>No topics yet. Create one to get started!</p>
          </div>
        )}
        {activeTopics.map((topic: Topic, idx: number) => {
          const color = TOPIC_COLORS[idx % TOPIC_COLORS.length];
          const topicTodos = initialTodos.filter((td: Todo) => td.topic_id === topic.id);
          return (
            <div
              key={topic.id}
              className="topic-column"
              style={{ borderColor: color.border, '--topic-accent': color.accent, '--topic-bg': color.bg } as React.CSSProperties}
            >
              <div className="topic-header" style={{ borderBottomColor: color.border }}>
                <InlineEdit
                  value={topic.name}
                  onSave={(name) => renameTopic(topic.id, name)}
                  className="topic-title"
                  style={{ color: color.accent }}
                />
                <button className="topic-delete hover-child" onClick={() => openDeleteConfirm("Delete Topic", `Delete "${topic.name}" and all its todos?`, () => deleteTopic(topic.id))} title="Delete Topic">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="todo-list">
                {topicTodos.map((todo: Todo) => (
                  <div key={todo.id} className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
                    <button className="todo-check" onClick={() => toggleTodo(todo.id, !todo.is_completed)}>
                      {todo.is_completed
                        ? <CheckCircle2 size={18} style={{ color: color.accent }} />
                        : <Circle size={18} className="text-muted" />
                      }
                    </button>
                    <InlineEdit
                      value={todo.text}
                      onSave={(text) => renameTodo(todo.id, text)}
                      className="todo-text"
                    />
                    <button className="todo-delete hover-child" onClick={() => openDeleteConfirm("Delete Todo", `Delete "${todo.text}"?`, () => deleteTodo(todo.id))} title="Delete Todo">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="add-todo-form hover-add-target">
                <input
                  type="text"
                  value={newTodoValue[topic.id] || ""}
                  onChange={(e) => setNewTodoValue(prev => ({ ...prev, [topic.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodo(topic.id)}
                  placeholder="New item..."
                  className="add-todo-input"
                />
                <button className="btn btn-primary btn-icon" style={{ backgroundColor: color.accent, borderColor: color.accent }} onClick={() => handleAddTodo(topic.id)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )
        })}
        {activeCategoryId && (
          <div className="topic-column new-topic-column hover-add-target">
            <button className="btn btn-ghost" onClick={() => setModalConfig({ isOpen: true, title: "New Topic Name", onSubmit: async (name) => { await addTopic(activeCategoryId, name); } })}>
              <Plus size={18} style={{ marginRight: '6px' }} /> Add Topic
            </button>
          </div>
        )}
      </div>

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

