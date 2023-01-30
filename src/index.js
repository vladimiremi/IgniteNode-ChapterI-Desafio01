const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

let users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((u) => u.username === username);

  if (!user) {
    throw new Error("User does not exists");
  }

  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userExists = users.find((user) => user.username === username);

  if (userExists) {
    return response.status(400).json({ error: "User already exists" });
  }

  const user = { id: uuidv4(), name, username, todos: [] };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;

  const user = users.find((u) => u.username === username);

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { username } = request.headers;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  const addTodo = users.map((user) => {
    if (user.username === username) {
      user.todos = [...user.todos, todo];
    }

    return user;
  });

  users = addTodo;

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;

  const { username } = request.headers;

  const editTodo = users.map((user) => {
    if (username === user.username) {
      const todoExists = user.todos.find((todo) => todo.id === id);
      if (!todoExists) {
        response.status(404).json({ error: "Todo not exists" });
      }
      user.todos.map((todo) => {
        if (todo.id === id) {
          todo.title = title;
          todo.deadline = deadline;
        }
      });
    }

    return user;
  });

  users = editTodo;

  response.json({ deadline, done: false, title });
});

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  async (request, response) => {
    const { id } = request.params;
    const { username } = request.headers;

    let doneOk;
    const doneTodo = users.map((user) => {
      if (username === user.username) {
        user.todos.map((todo) => {
          const todoExists = user.todos.find((todo) => todo.id === id);
          if (!todoExists) {
            return response.status(404).json({ error: "Todo not exists" });
          }
          if (todoExists.id === id) {
            todo.done = true;
            doneOk = todo;
          }
        });
      }

      return user;
    });

    users = doneTodo;

    response.json(doneOk);
  }
);

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request.headers;
  users.map((user) => {
    if (username === user.username) {
      const todoExists = user.todos.find((todo) => todo.id === id);
      if (!todoExists) {
        response.status(404).json({ error: "Todo not exists" });
      }

      const removeTodo = user.todos.filter((todo) => todo.id !== todoExists.id);

      user.todos = removeTodo;
    }
    return user;
  });

  return response.status(204).send();
});

module.exports = app;
