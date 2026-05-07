import { useEffect, useState } from 'react';
import { Todo } from '../types/Todo';
import { createTodo, deleteTodo, updateTodo, USER_ID } from '../api/todos';
import { client } from '../utils/fetchClient';
import { ErrorMessage } from '../types/types';

export const useTodos = (onError: (message: string) => void) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [deletingId, setDeletingId] = useState<number[]>([]);
  const [loadingId, setLoadingId] = useState<number[]>([]);

  useEffect(() => {
    client
      .get<Todo[]>(`/todos?userId=${USER_ID}`)
      .then(setTodos)
      .catch(() => onError(ErrorMessage.LoadTodo));
  }, [onError]);

  const addTodo = async (title: string) => {
    const trimmedTitle = title.trim();

    setTempTodo({
      id: 0,
      title: trimmedTitle,
      completed: false,
      userId: USER_ID,
    });

    try {
      const newTodo = await createTodo({
        title: trimmedTitle,
        completed: false,
        userId: USER_ID,
      });

      setTodos(prev => [...prev, newTodo]);
    } catch {
      onError(ErrorMessage.AddTodo);
      throw new Error();
    } finally {
      setTempTodo(null);
    }
  };

  const removeTodo = async (todoId: number) => {
    setDeletingId(prev => [...prev, todoId]);

    try {
      await deleteTodo(todoId);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch {
      onError(ErrorMessage.DeleteTodo);
    } finally {
      setDeletingId(prev => prev.filter(id => id !== todoId));
    }
  };

  const clearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed);

    await Promise.all(completedTodos.map(todo => removeTodo(todo.id)));
  };

  const isAllCompleted =
    todos.length > 0 && todos.every(todo => todo.completed);

  const toggleAll = async () => {
    const areAllCompleted = todos.every(todo => todo.completed);
    const targetStatus = !areAllCompleted;
    const todosToUpdate = todos.filter(todo => todo.completed !== targetStatus);

    const idToUpdate = todosToUpdate.map(todo => todo.id);

    setLoadingId(prev => [...prev, ...idToUpdate]);

    try {
      await Promise.all(
        todosToUpdate.map(todo =>
          updateTodo(todo.id, { completed: targetStatus }),
        ),
      );
      setTodos(prev =>
        prev.map(todo =>
          idToUpdate.includes(todo.id)
            ? { ...todo, completed: targetStatus }
            : todo,
        ),
      );
    } catch {
      onError(ErrorMessage.UpdateTodo);
    } finally {
      setLoadingId(prev => prev.filter(id => !idToUpdate.includes(id)));
    }
  };

  return {
    todos,
    tempTodo,
    deletingId,
    isAllCompleted,
    loadingId,
    addTodo,
    removeTodo,
    clearCompleted,
    toggleAll,
    setTodos,
  };
};
