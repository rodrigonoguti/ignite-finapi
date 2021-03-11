const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if (!user) {
    return response.status(400).json({ error: "User not found!" });
  }

  request.user = user;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some(
    user => user.username === username
  );

  if (userAlreadyExists) {
    return response.status(400).json({ error: "User already exists!" });
  }

  const user = {
    username,
    name,
    id: uuidv4(),
    todos: []
  };

  users.push(user);

  response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;
  const { title, deadline } = request.body;

  const updatedTodoData = {
    title,
    deadline,
    done: false
  }

  const todoExists = user.todos.some(todo => todo.id === id);

  if (!todoExists) {
    return response.status(404).json({ error: 'Todo does not exist' });
  }

  user.todos = user.todos.map(todo => {
    if (todo.id === id) {
      return { ...todo, ...updatedTodoData };
    }

    return todo;
  });

  return response.status(200).json(updatedTodoData);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todo = user.todos.find(todo => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: 'Todo does not exist' });
  }

  todo.done = true;

  return response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoExists = user.todos.some(todo => todo.id === id);

  if (!todoExists) {
    return response.status(404).json({ error: "Todo does not exist" });
  }

  user.todos = user.todos.filter(todo => todo.id !== id);

  return response.status(204).send();
});

module.exports = app;