let express = require("express");
let app = express();
let path = require("path");
app.use(express());
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let bcrypt = require("bcrypt");
let dbpath = app.path(__dirname, "userData.db");
let db = null;

let initializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server initializing at localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeServerAndDb();

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;

  let hashedPassword = await bcrypt.hash(password, 10);

  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  let userData = await db.get(checkTheUsername);
  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newUserDetails = await db.run(postNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//api2

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let que = `SELECT * FROM user WHERE username = '${username}';`;
  let res = await db.get(que);
  if (res === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let pass = await bcrypt.compare(password, res.password);
    if (pass === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//api3

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, password } = request.body;
  let que = `SELECT * FROM user WHERE username = '${username}';`;
  let res = await db.get(que);
  if (res !== undefined) {
    let pass = await bcrypt.compare(oldPassword, res.password);
    if (pass === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      if (password.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        let newpass = await bcrypt.hash(password, 10);
        let que = `UPDATE user
                        SET
                            password = '${newpass}'
                            WHERE username = '${username}';`;
        await db.run(que);
        response.status(200);
        response.send("Password updated");
      }
    }
  }
});

module.exports = app;
