const express = require("express");
const app = express();
const http = require('http');
const fs = require('fs');
const exp = require("constants");
const port = 1234;
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/database/database.db');
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync(password, 10);
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const payload = { username: 'your-username'};
var token = jwt.sign('YOUR_SECRET_KEY');
const tokenData = jwt.verify(token, 'YOUR_SECRET_KEY');
console.log(tokenData.username);

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
  
    try {
      const tokenData = jwt.verify(token, 'YOUR_SECRET_KEY');
      next();
    } catch (err) {
      res.status(401).send({ error: 'Invalid token' });
    }
};

app.get('/api/secret', verifyToken, (req, res) => {
    res.send({ message: 'You are logged in' });
});
  
app.post('/api/auth', (req, res) => {
  const {username, password} = req.body;
  // Verify username and password here
  const payload = { username };
  var token = jwt.sign(payload, 'YOUR_SECRET_KEY');
  res.send({ token });
});

app.get('/api/secret', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  
  try {
    const tokenData = jwt.verify(token, 'YOUR_SECRET_KEY');
    res.send({ message: 'You are logged in' });
  } catch (err) {
    res.status(401).send({ error: 'Invalid token' });
  }
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)');
  db.run('INSERT INTO users (name, age) VALUES (?, ?)', ['John', 25]);
  db.run('INSERT INTO users (name, age) VALUES (?, ?)', ['Alice', 30]);
  db.each('SELECT * FROM users', (err, row) => {
    console.log(row);
  });
});
db.close();

app.engine('handlebars', exphbs.engine({
  extname: '.handlebars'
}));

app.set('view engine', 'handlebars');

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.static("public"));
app.use(express.static("views"));

app.use(session({
  secret: 'mysecret',
  resave: false,
  saveUninitialized: false
}));

app.get('/', (req, res) => {
  res.send(`Hello ${req.session.name}`);
});

app.get('/setname', (req, res) => {
  req.session.name = req.query.name;
  res.send('Session started');
});

app.get('/', (req,res) => {
  res.render('index', { user: req.session?.user });
});

app.use((req, res, next) => {
  console.log('Middleware called');
  next();
});  

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
  res.redirect('/login');
  }
};
  
app.get('/secret', isAuthenticated, (req, res) => {
  res.render('secret');
});

app.get('/secret', (req, res) => {
  if (req.session.user) {
    res.render('secret', { user: req.session.user });
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
  res.send('Session destroyed');
});
  
app.get('/api/users', (req, res) => {
  const id = req.params.id;
  const name = req.query.name;
  const age = req.query.age;
  res.status(200).json(user);
});

app.get('/api/users/:id', (req, res) => {
  // Get user with id req.params.id
  const id = req.params.id;
  const name = req.query.name;
  const age = req.query.age;
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Server error' });
    } else if (row) {
      res.status(200).json(row);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });    
});

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('index', { user: req.session.user });
  } else {
    res.render('index');
  }
});  

app.get('/', (req, res) => {
  if (req.session.user) {
    res.render('index', { user: req.session.user });
  } else {
    res.render('index');
  }
});
  
app.get('/', function(req, res){
    res.sendFile(__dirname + "/" + '/views/layouts/home.handlebars');
  });

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Requires a sqlite3 database
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      res.status(500).send({ error: 'Server error' });
    } else if (!user) {
      res.status(401).send({ error: 'User not found' });
    } else {
      const result = bcrypt.compareSync(password, user.hash);
      
      if (result) {
        req.session.user = user;
        res.redirect('/');
      } else {
        res.status(401).send({ error: 'Wrong password' });
      }
    }
  });
});  

app.post('/api/users', (req, res) => {
  // Create a new user
  const name = req.body.name;
  const age = req.body.age;
  app.use(express.urlencoded( { extendend: false}));
  app.get('/register.handlebars', (req, res)=> {
    res.render('register');
  })
  // Create a new user
  db.run('INSERT INTO users (name, age) VALUES (?, ?)', [name, age], (err) => {
    if (err) {
      res.status(500).json({ error: 'Server error' });
    } else {
      res.redirect('/login');
      res.status(201).json({ message: 'User created' });
    }
  });    
});

app.put('/api/users/:id', (req, res) => {
  // Update user with id req.params.id
  const id = req.params.id;
  const name = req.body.name;
  const age = req.body.age;
  db.run('UPDATE users SET name = ?, age = ? WHERE id = ?', [name, age, id], (err) => {
    if (err) {
      res.status(500).json({ error: 'Server error' });
    } else {
      res.status(200).json({ message: 'User updated' });
    }
  });
});

app.delete('/api/users/:id', (req, res) => {
  // Delete user with id req.params.id
  const id = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: 'Server error' });
    } else {
      res.status(200).json({ message: 'User deleted' });
    }
  });
});

app.listen(port, () => {
    console.log(`Express server is running and listening on port ${port}`);
})