var express = require('express')
var bodyParser = require('body-parser')
var session = require('express-session')
var app = express()
app.use(express.json())
const TWO_HOURS = 1000* 60 * 60 *2 ;
const pool = require('./db');
/*
const createUser = async (name,email,pass)=>{
  return await pool.query(
        "insert into userlist (name,email,password) values($1,$2,$3) returning *",
        [name,email,pass]
      );
}

const findUser=async(email,password)=>{
  const data = await pool.query("select user_id from userlist where email = $1 and password = $2",
  [email,password]
  );
  //console.log(data.rows[0].user_id);
  if (data ==null || data == undefined || data.rowCount == 0)
    return null;
  else
    return data.rows[0].user_id;
}

const emailExists=async(email)=>{
  const data = await pool.query("select email from userlist where email = $1",
  [email]
  );
  if (data ==null || data == undefined || data.rowCount == 0)
    return false;
  else
    return true;
};

const getNameEmail=async(id)=>{
  const data = await pool.query("select name,email from userlist where user_id = $1",
  [id]
  );
  if (data ==null || data == undefined || data.rowCount == 0)
    return null;
  else
    return data.rows[0];
};*/

var users = [
  {id:1 ,name:'shash' , email:'shash@gmail.com' ,password:'lmaoxd'},
  {id:2 ,name:'max' , email:'max@gmail.com' ,password:'lmaoxd'},
  {id:3 ,name:'alex' , email:'alex@gmail.com' ,password:'lmaoxd'}
]

const{
  PORT =3000,
  SESS_SECRET = 'SSH!QUITE.IT\\BO',
  IN_PROD = false,
  SESSION_NAME = 'sid' ,
  SESSION_LIFETIME = TWO_HOURS
} = process.env

const redirectLogin = (req,res,next)=>{
  if(!req.session.userId){
    res.redirect('/login')
  }else{
    next()
  }
}

const redirectHome = (req,res,next)=>{
  if(req.session.userId){
    res.redirect('/home')
  }else{
    next()
  }
}

app.use(bodyParser.urlencoded({
  extended:true
}))

app.use(session({
  name: SESSION_NAME,
  resave: false,
  saveUninitialized: false,
  secret:SESS_SECRET,
  cookie:{
    maxAge : SESSION_LIFETIME,
    sameSite: true,
    secure: IN_PROD
  }
}))

app.get('/', redirectHome,(req,res)=>{

  const {userId} = req.session

  res.send(`
    <h1>Welcome</h1>
    ${userId?
      `<a href="/home">Home</a>
      <form method="post" action="/logout">
        <button>Logout</button>
      </form>`
      :
      `<a href="/login">Login</a>
      <a href="/register">Register</a>`
    }
    `)
})

app.get('/login',redirectHome,(req,res)=>{
  res.send(`
    <h1>Login</h1>
    <form method="post" action="/login">
    <input type="text" placeholder="email" name="email" required"/>
    <input type="text" placeholder="password" name="password" required"/>
    <input type="submit" />
    </form>
    <a href="/register" >Register</a>
    `)
})

app.get('/register', redirectHome,(req,res)=>{
  res.send(`
    <h1>Register</h1>
    <form method="post" action="/register">
    <input type="text" placeholder="name" name="name" required"/>
    <input type="text" placeholder="email" name="email" required"/>
    <input type="text" placeholder="password" name="password" required"/>
    <input type="submit" />
    </form>
    <a href="/login" >Login</a>
    `)
})

app.get('/home',redirectLogin ,async(req,res)=>{
  //const user = users.find(user => user.id === req.session.userId)
  var user;
  if(req.session.userId){
      const data = await pool.query("select name,email from userlist where user_id = $1",
      [req.session.userId]
      );
      if (data ==null || data == undefined || data.rowCount == 0)
        user =null;
      else
        user =data.rows[0];
  }
  res.send(`
    <h1></h1>
    <a href="/" >main</a>
    <ul>
      <li>name:${user.name}</li>
      <li>email:${user.email}</li>
    </ul>
    <form method="post" action="/logout">
      <button>Logout</button>
    </form>
    `)
})

app.post('/login',redirectHome , async(req,res)=>{
  const {email , password} = req.body
  if(email && password){
        var uid;
        const data = await pool.query("select user_id from userlist where email = $1 and password = $2",
        [email,password]
        );
        //console.log(data.rows[0].user_id);
        if (data ==null || data == undefined || data.rowCount == 0)
          uid = null;
        else
          uid= data.rows[0].user_id;
    console.log(uid);
    if(uid){
      req.session.userId = uid;
      return res.redirect('/home')
    }
    res.redirect('/login')
    return;
    //above db code
    /*
    const user = users.find(user => user.email === email && user.password === password)
    if(user){
      req.session.userId = user.id;
      return res.redirect('/home')
    }*/
  }
  res.redirect('/login')
})

app.post('/register', redirectHome,async(req,res)=>{
  const { name, email , password} = req.body
  if(name && email && password){
    //const exists = users.some(user => users.email === email)
    var exists;
    const data = await pool.query("select email from userlist where email = $1",
    [email]
    );
    if (data ==null || data == undefined || data.rowCount == 0)
      exists= false;
    else
      exists= true;
    if(exists){
      return res.redirect('/login')
    }else{
      await pool.query(
            "insert into userlist (name,email,password) values($1,$2,$3)",
            [name,email,password]
          );
      var uid;
      const data2 = await pool.query("select user_id from userlist where email = $1 and password = $2",
      [email,password]
      );
      //console.log(data.rows[0].user_id);
      if (data2 ==null || data2 == undefined || data2.rowCount == 0)
        uid = null;
      else
        uid= data2.rows[0].user_id;
      req.session.userId = uid;
      return res.redirect('/home')
      //above db code
      /*const user = {
        id:users.length+1,
        name:name,
        email:email,
        password:password
      }
      users.push(user)
      req.session.userId = user.id;
      res.redirect('/home')*/
    }
  }else{
    res.redirect('/register')
  }
})

app.post('/logout',redirectLogin,(req,res,next)=>{
  req.session.destroy(err =>{
    if(err){
      res.redirect('/home')
    }else{
      res.clearCookie(SESSION_NAME)
      res.redirect('/login')
    }
  })
})

app.listen(PORT , ()=>console.log('working gg'))
