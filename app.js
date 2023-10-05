// loads several packages
const express = require("express");
const { engine } = require('express-handlebars');
const sqlite3 = require('sqlite3');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const connectSqlite3 = require('connect-sqlite3');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');


const app = express();
const http = require('http');
const fs = require('fs');
const exp = require("constants");
const port = 1234;
const db = new sqlite3.Database('/database/database.db'); //define database file

/*
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync(password, 10);

const payload = { username: 'your-username'};
var token = jwt.sign('YOUR_SECRET_KEY');
const tokenData = jwt.verify(token, 'YOUR_SECRET_KEY');
console.log(tokenData.username);
*/

//login route
app.get('/login', (req, res) => {
  const model={}
  res.render('login.handlebars', model);
});

//---------------
// MIDDLEWARES
//---------------

//define static directory "public"
app.use(express.static('public'))


app.use((req, res, next) => {
  console.log('Middleware called');
  next();
});

//---------------
// POST Forms
//---------------
app.use(bodyParser.urlencoded({ extended: false}))
app.use(bodyParser.json())

//check the login and password of a user
app.post('/login', (req, res) => {
  const un = req.body.un
  const pw = req.body.pw

  console.log("LOGIN: ", un)
  console.log("PASSWORD: ", pw)

  if (un=="Kimberly" && pw=="1234"){
    console.log("Kimberly is logged in!")
    req.session.isAdmin = true
    req.session.isLoggedIn = true
    req.session.name = "Kimberly"
    res.redirect('/')
  } else{
    console.log("Bad user and/or bad password")
    req.session.isAdmin = false
    req.session.isLoggedIn = false
    req.session.name = ""
    res.redirect('/login')
  }
})

//---------------
// SESSION
//---------------

//store sessions in the database
const SQLiteStore = connectSqlite3(session)

//define the session
app.use(session({
  store: new SQLiteStore({db: "session-db.db"}),
  "saveUninitialized": false,
  "resave": false,
  "secret": "Top Secret"
}));

app.get('/', (req, res) => {
  console.log("SESSION: ", req.session)
  const model={
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin
  }
  res.render('home.handlebars', model);
});

//renders the /about route view
app.get('/about', (req, res) => {
  console.log("SESSION: ", req.session)
  const model={
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin
  }
  res.render('about.handlebars', model);
});

//renders the /contact route view
app.get('/contact', (req, res) => {
  console.log("SESSION: ", req.session)
  const model={
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin
  }
  res.render('contact.handlebars', model);
});

//renders the login page
app.get('/login', (req, res) => {
  console.log("SESSION: ", req.session)
  const model={
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin
  }
  res.render('login.handlebars', model);
});

//renders the /projects route view
app.get('/projects', (req, res) => {
  db.all("SELECT * FROM projects", function (error, theProjects) {
    if (error) {
      const model = {
        dbError: true,
        theError: error,
        projects: [],
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      }
      //renders the page with the model
      res.render("projects.handlebars", model)
    }
    else {
      const model = {
        dbError: false,
        theError: "",
        projects: theProjects,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
    }
    //renders the page with the model
    res.render("projects.handlebars", model)
  }
  })
});

//deletes a project
app.get('/projects/delete/:id', (req, res) => {
  const id = req.params.id
  if (req.session.isLoggedIn==true && req.session.isAdmin==true){
    db.run("DELETE from projects WHERE pid=?", [id], function(error, theProjects) {
      if (error) {
        const model = { dbError: true, theError: error,
          isLoggedIn: req.session.isLoggedIn,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
        }
        res.render("home.handlebars", model)
      }else{
        const model = { dbError: false, theError: "",
          isLoggedIn: req.session.isLoggedIn,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
        }
        res.render("home.handlebars", model)
      }
      })
  }else{
    res.redirect('/login')
  }
});

//sends the form for a new project
app.get('/projects/new', (req, res) => {
  if(req.session.isLoggedIn==true && req.session.isAdmin==true) {
    const model = {
      isLoggedIn: req.session.isLoggedIn,
      name: req.session.name,
      isAdmin: req.session.isAdmin, 
    }
    res.render('newproject.handlebars', model)
  }else{
  res.redirect("/login")
  }
});

//creates a new project
app.post('/projects/new', (req, res) => {
  const newp = [
    req.body.projname, req.body.projyear, req.body.projdesc, req.body.projtype, req.body.projimg,
  ]
  if (req.session.isLoggedIn==true && req.session.isAdmin==true) {
    db.run("INSERT INTO projects (pname, pyear, pdesc, ptype, pimgURL) VALUES (?,?,?,?,?)", newp, (error) => {
      if (error) {
        console.log("ERROR: ", error)
      }else{
        console.log("Line added into the projects table!")
      }
      res.redirect('/projects')
    })
  }else{
    res.redirect('/login')
  }
});
  
//sends the form to modify a project
app.get('/projects/update/:id', (req, res) => {
  const id = req.params.id
  db.get("SELECT * FROM projects WHERE pid=?", [id], function (error, theProjects) {
    if(error){
      console.log("ERROR: ", error)
      const model = { dbError: true, theError: error,
        project: {},
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin, 
      }
      //renders the page with the model
      res.render('modifyproject.handlebars', model)
    }else{
      const model = { dbError: false, theError: "",
        project: theProjects,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
        helpers: {
          theTypeS(value) { return value == "Short film"; },
          theTypeT(value) { return value == "Trailer"; },
          theTypeA(value) { return value == "Assignment"; },
        }
      }
      res.render("modifyproject.handlebars", model)
    }
  })
});

// modifies an existing project, to update the table
app.post('/projects/update/:id', (req, res) => {
  const id = req.params.id //gets the id from a dynamic parameter in the route
  const newp = [
    req.body.projname, req.body.projyear, req.body.projdesc, req.body.projtype, req.body.projimg, id
  ]
  if (req.session.isLoggedIn==true && req.session.isAdmin==true) {
    db.run("UPDATE projects SET pname=?, pyear=?, pdesc=?, ptype=?, pimgURL=? WHERE pid=?", newp, (error) => {
      if(error) {
        console.log("ERROR: ", error)
      }else{
        console.log("Project updatet!")
      }
      res.redirect('/projects')
    })
  }else{
    res.redirect('/login')
  }
});

//define the /logout route
app.get('/logout', (req, res) => {
  req.session.destroy( (err) => {
    console.log("Error while destroying the session: ", err)
  })
  console.log('Logged out...')
  res.redirect('/')
});



/*
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
*/

app.listen(port, () => {
    console.log(`Express server is running and listening on port ${port}`);
})
