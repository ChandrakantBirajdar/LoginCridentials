import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";


const app = express();
const port = 3000;


app.use(
  session({
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db=new pg.Client({

  user:"postgres",
  host:"localhost",
  database:"permalist",
  password:"Birajdar@2072",
  port:5432
});

db.connect();

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});


app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/secrets", (req, res) => {
  
  if (req.isAuthenticated()) {
    res.render("secrets.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {

  const email=req.body.username;
  const password=req.body.password;

  const result= await db.query("SELECT * FROM users WHERE email=$1",[email]);

  if(result.rows.length>0)
  {
    res.send("User Already Exist . Please Try With Login and Password");
  }
  else
  {
    const result = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
      [email, password]
    );
    const user = result.rows[0];
    req.login(user, (err) => {
      console.log("success");
      res.redirect("/secrets");
    });
  }
});

passport.use(
  new Strategy(async function verify(username, password, cb) {

    const result=await db.query("SELECT * FROM users WHERE email=$1 ",[username]);

      if(result.rows.length>0)
      {
        const user = result.rows[0];
        const data=result.rows[0];
        const storedPassword=data.password;
        if(storedPassword === password )
        {
          return cb(null, user);
        }
        else
        {
            return cb(null, false);
        }
      }
      else{
        return cb("User not found");
      }

  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
