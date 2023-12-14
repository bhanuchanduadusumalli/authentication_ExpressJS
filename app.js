const express = require("express");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbpath = path.join(__dirname, "userData.db");
let db = null;

const intializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("server running at http://localhost/3001");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(1);
  }
};

intializeDBandServer();

//post request
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getUser = `select * from user where username='${username}'`;
  const dbUser = await db.get(getUser);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertUser = `insert into user(username,name,password,gender,location)
            values('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
      await db.run(insertUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Post request
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `select * from user where username='${username}'`;
  const dbUser = await db.get(getUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//put request
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUser = `select * from user where username='${username}'`;
  const dbUser = await db.get(getUser);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatched == true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePassQuery = `update user
            set password='${hashedPassword}'
            where
            username='${username}'`;
      await db.run(updatePassQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
