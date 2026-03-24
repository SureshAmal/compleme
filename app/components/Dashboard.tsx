"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, type Theme } from "./ThemeProvider";
import { addCategory, addTopic, addTodo, toggleTodo, logoutUser, deleteTodo, deleteTopic, deleteCategory, renameTodo, renameTopic, renameCategory } from "../actions";
import { ThemeSelect } from "./ThemeSelect";
import { Modal, ConfirmModal } from "./Modal";
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Label, YAxis } from "recharts";
import { CheckCircle2, Circle, Trash2, Plus, LogOut } from "lucide-react";

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

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, onSubmit: (v:string)=>void}>({ isOpen: false, title: "", onSubmit: ()=>{} });
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: ()=>void}>({ isOpen: false, title: "", message: "", onConfirm: ()=>{} });

  const handleAddTodo = async (topicId: number) => {
    if (!newTodoValue[topicId] || newTodoValue[topicId].trim() === "") return;
    await addTodo(topicId, newTodoValue[topicId]);
    setNewTodoValue(prev => ({ ...prev, [topicId]: "" }));
  };

  const openDeleteConfirm = (title: string, message: string, action: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm: action });
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '500', color: 'var(--fg-muted)', fontSize: '0.9rem' }}>@{username}</span>
            <ThemeSelect theme={theme} setTheme={setTheme} />
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
                  onChange={(e) => setNewTodoValue(prev => ({...prev, [topic.id]: e.target.value}))}
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
        <div className="analytics-header">analytics</div>
        <div className="chart-wrapper">
          <div className="chart-title">Topic Completion %</div>
          {topicStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <YAxis hide domain={[0, 100]} />
                <XAxis dataKey="name" stroke="var(--fg-muted)" tick={{ fontSize: 11, fill: 'var(--fg-muted)' }} tickFormatter={(val) => val.length > 8 ? val.substring(0,8)+'…' : val} axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} />
                <RechartsTooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius)', color: 'var(--fg-main)' }} itemStyle={{ color: 'var(--fg-main)' }} />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} barSize={28}>
                  {topicStats.map((entry: any, i: number) => (<Cell key={i} fill={entry.fill} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No topics available</div>
          )}
        </div>
        <div className="chart-wrapper pie-chart-container">
          <div className="chart-title">Completed vs Incomplete</div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} stroke="none" cornerRadius={4} paddingAngle={totalActive > 0 ? 3 : 0}>
                {totalActive > 0 ? (<><Cell fill="var(--accent)" /><Cell fill="var(--border-color)" /></>) : (<Cell fill="var(--border-color)" />)}
                <Label value={`${totalActive > 0 ? Math.round((totalActiveCompleted / totalActive) * 100) : 0}%`} position="center" fill="var(--fg-main)" fontSize={22} fontWeight={600} />
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius)' }} itemStyle={{ color: 'var(--fg-main)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
