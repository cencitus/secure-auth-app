import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthForm from './components/AuthForm';
import './App.css';

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null); // - token заменён на user
  const [data, setData] = useState(''); // - protectedData заменён на data
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light'); // + Тема

  // + Проверка сессии при загрузке и смене темы
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
    checkSession();
  }, [theme]);

  // + Функция проверки сессии
  const checkSession = async () => {
    try {
      const response = await axios.get('http://localhost:3000/profile', { withCredentials: true }); // + withCredentials для cookies
      setUser(response.data.user);
    } catch (err) {
      setUser(null);
    }
  };

  // Изменён handleSubmit: убрана работа с токеном
  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/register' : '/login';
    try {
      const response = await axios.post(`http://localhost:3000${endpoint}`, { username, password }, { withCredentials: true }); // + withCredentials
      setMessage(response.data.message);
      setError(false);
      if (!isRegister) checkSession(); // + Проверка сессии после входа
      setUsername('');
      setPassword('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Ошибка');
      setError(true);
    }
  };

  // Изменён getProtected → getData: запрос к /data
  const getData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/data', { withCredentials: true }); // + withCredentials
      setData(JSON.stringify(response.data, null, 2));
    } catch (err) {
      setData('Ошибка при получении данных');
    }
  };

  // Изменён handleLogout: запрос к /logout
  const handleLogout = async () => {
    await axios.post('http://localhost:3000/logout', {}, { withCredentials: true }); // + withCredentials
    setUser(null);
    setData('');
  };

  // + Переключение темы
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // + Условный рендеринг: редирект на форму при отсутствии сессии
  if (!user) {
    return (
      <div className="app-container">
        <h1>Аутентификация</h1> 
        <AuthForm
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          isRegister={isRegister}
          handleSubmit={handleSubmit}
        />
        <button onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
        {message && <p style={{ color: error ? 'red' : 'green' }}>{message}</p>}
      </div>
    );
  }

  // Изменён рендеринг для авторизованных пользователей
  return (
    <div className="app-container">
      <h1>Личный кабинет</h1> 
      <p>Добро пожаловать, {user.username}!</p> 
      <button onClick={toggleTheme}>Сменить тему ({theme === 'light' ? 'Тёмная' : 'Светлая'})</button> 
      <button onClick={getData}>Обновить данные</button> 
      <button onClick={handleLogout}>Выйти</button>
      {data && <pre>{data}</pre>}
    </div>
  );
};

export default App;