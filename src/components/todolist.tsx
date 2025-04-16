'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };
  const editTask = async (id: string, currentText: string, currentDeadline: string): Promise<void> => {
    const formattedDeadline = new Date(currentDeadline).toISOString().slice(0, 16);
  
    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Nama tugas" value="${currentText}">
        <input id="swal-input2" type="datetime-local" class="swal2-input" value="${formattedDeadline}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const input1 = (document.getElementById('swal-input1') as HTMLInputElement)?.value;
        const input2 = (document.getElementById('swal-input2') as HTMLInputElement)?.value;
        if (!input1 || !input2) {
          Swal.showValidationMessage('Semua bidang wajib diisi');
        }
        return [input1, input2];
      },
    });
  
    if (formValues && formValues[0] && formValues[1]) {
      const [updatedText, updatedDeadline] = formValues;
  
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        text: updatedText,
        deadline: updatedDeadline,
      });
  
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id
            ? { ...task, text: updatedText, deadline: updatedDeadline }
            : task
        )
      );
    }
  };
  

  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl text-emerald-500 font-bold mb-4">To-Do List</h1>
      <div className="flex justify-center mb-4">
        <button
          onClick={addTask}
          className="bg-slate-500 text-white px-4 py-2 rounded"
        >
          Tambah Tugas
        </button>
      </div>
      <ul>
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = calculateTimeRemaining(task.deadline);
            const isExpired = timeLeft === 'Waktu habis!';
            const taskColor = task.completed
              ? 'bg-green-200'
              : isExpired
              ? 'bg-red-200'
              : 'bg-yellow-200';

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col justify-between p-2 border-b rounded-lg ${taskColor}`}
              >
                <div className="flex justify-between items-center">
                  <span
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer transition-500 ${
                      task.completed
                        ? 'line-through text-gray-500'
                        : 'font-semibold text-gray-700'
                    }`}
                  >
                    {task.text}
                  </span> 
                </div>
                <p className="text-sm text-gray-700">
                  Deadline: {new Date(task.deadline).toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-gray-700">
                  ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                </p>
                <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => editTask(task.id, task.text, task.deadline)}
                      className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full shadow"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full shadow"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
