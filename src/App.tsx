import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, CheckCircle, Circle, Calendar, Flag, Tag, LogOut } from 'lucide-react';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  user_id: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('personal');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user]);

  const loadTodos = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading todos:', error);
    } else {
      setTodos(data || []);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !input.trim()) return;

    const newTodo = {
      text: input.trim(),
      completed: false,
      dueDate,
      priority,
      category,
      user_id: user.id,
    };

    const { error } = await supabase
      .from('todos')
      .insert([newTodo]);

    if (error) {
      console.error('Error adding todo:', error);
    } else {
      loadTodos();
      setInput('');
      setDueDate('');
      setPriority('medium');
    }
  };

  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
    } else {
      loadTodos();
    }
  };

  const deleteTodo = async (id: number) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
    } else {
      loadTodos();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      case 'shopping': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTodos = todos.filter(todo => {
    const statusMatch = filter === 'all' || 
      (filter === 'completed' && todo.completed) || 
      (filter === 'active' && !todo.completed);
    const categoryMatch = categoryFilter === 'all' || todo.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            ToDoIt
          </h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <form onSubmit={addTodo} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <PlusCircle className="w-5 h-5" />
              Add
            </button>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-gray-500" />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="shopping">Shopping</option>
              </select>
            </div>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-4 mb-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="shopping">Shopping</option>
              </select>
            </div>
          </div>

          <ul className="divide-y divide-gray-200">
            {filteredTodos.map((todo) => (
              <li key={todo.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="flex-shrink-0"
                  >
                    {todo.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.text}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {todo.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(todo.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 text-xs ${getPriorityColor(todo.priority)}`}>
                        <Flag className="w-3 h-3" />
                        {todo.priority}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(todo.category)}`}>
                        {todo.category}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
            {filteredTodos.length === 0 && (
              <li className="p-8 text-center text-gray-500">
                No todos found. Add some tasks to get started!
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;