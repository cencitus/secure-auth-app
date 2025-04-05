import React from 'react';

const AuthForm = ({ username, setUsername, password, setPassword, isRegister, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Имя пользователя"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">{isRegister ? 'Зарегистрироваться' : 'Войти'}</button>
    </form>
  );
};

export default AuthForm;