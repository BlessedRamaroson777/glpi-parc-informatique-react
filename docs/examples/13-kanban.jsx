import React, { useState } from 'react';

const initialTasks = [
  { id: 1, title: "Tâche 1", status: "todo" },
  { id: 2, title: "Tâche 2", status: "inProgress" },
  { id: 3, title: "Tâche 3", status: "done" },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState(initialTasks);

  // Événement déclenché au début du glissement de la carte
  const onDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
  };

  // Permet à la colonne de recevoir un élément déposé
  const onDragOver = (e) => {
    e.preventDefault();
  };

  // Événement déclenché lors du dépôt de la carte dans une colonne
  const onDrop = (e, newStatus) => {
    const id = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, status: newStatus } : task
    );
    setTasks(updatedTasks);
  };

  const renderColumn = (status, label) => {
    return (
      <div 
        onDragOver={onDragOver} 
        onDrop={(e) => onDrop(e, status)}
        style={{ flex: 1, padding: 16, background: '#f4f5f7', borderRadius: 8, minHeight: 400 }}
      >
        <h3>{label}</h3>
        {tasks
          .filter(task => task.status === status)
          .map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onDragStart(e, task.id)}
              style={{ padding: 16, margin: '8px 0', background: 'white', borderRadius: 4, cursor: 'grab', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            >
              {task.title}
            </div>
          ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 16, padding: 24 }}>
      {renderColumn('todo', 'À Faire')}
      {renderColumn('inProgress', 'En Cours')}
      {renderColumn('done', 'Terminé')}
    </div>
  );
}
