require('dotenv').config();
const express = require('express');
const session = require('express-session'); 
const bcrypt = require('bcrypt'); 
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises; 
const path = require('path'); 
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'], // - Убран 'Authorization', так как JWT не используется
  credentials: true, // + Добавлено для передачи cookies
}));

app.use(bodyParser.json());

// - Убран jwt, SECRET_KEY не нужен
// + Настройка сессий вместо JWT
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // + Новый секрет для сессий
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // + Флаг для защиты cookies
    sameSite: 'lax', // + Флаг для защиты от CSRF
    maxAge: 60 * 60 * 1000, // + 1 час жизни сессии
  },
}));

let users = [];

// Изменён /register: добавлено хэширование пароля
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
  }
  const hashedPassword = await bcrypt.hash(password, 10); // + Хэширование пароля
  const newUser = { id: users.length + 1, username, password: hashedPassword }; // - Пароль теперь хэшированный
  users.push(newUser);
  res.status(201).json({ message: 'Регистрация прошла успешно' });
});

// Изменён /login: убрано создание JWT, добавлена сессия
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) { // + Сравнение хэшей
    return res.status(401).json({ message: 'Неверные имя пользователя или пароль' });
  }
  req.session.user = { id: user.id, username: user.username }; // + Сохранение пользователя в сессии
  res.json({ message: 'Успешный вход' }); // - Убран token
});

// - Убран authenticateJWT, так как JWT не используется
// + Новая middleware для проверки сессии
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Не авторизован' });
  }
  next();
};

// Изменён /protected -> /profile: теперь использует сессию
app.get('/profile', isAuthenticated, (req, res) => {
  res.json({ user: req.session.user }); // - Изменён ответ, данные из сессии
});

// + Новый роут /logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Сессия завершена' });
  });
});

// + Новый роут /data с кэшированием
app.get('/data', async (req, res) => {
  const cachePath = path.join(__dirname, 'cache', 'data.json');
  try {
    const cacheData = await fs.readFile(cachePath, 'utf-8');
    const { data, timestamp } = JSON.parse(cacheData);
    if (Date.now() - timestamp < 60 * 1000) { // + Проверка кэша (1 минута)
      return res.json(data);
    }
  } catch (err) {
    // Кэш отсутствует или устарел
  }
  const newData = { message: 'Это новые данные', timestamp: Date.now() }; // + Генерация новых данных
  await fs.mkdir(path.dirname(cachePath), { recursive: true }); // + Создание директории для кэша
  await fs.writeFile(cachePath, JSON.stringify({ data: newData, timestamp: Date.now() })); // + Сохранение в кэш
  res.json(newData);
});

app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});