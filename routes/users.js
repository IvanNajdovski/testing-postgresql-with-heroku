const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();

//jsonSchema validate tutorials
const { validate } = require("jsonschema");
const bookSchema = require("./bookSchema.json");

const db = require("../db");

const jwt = require("jsonwebtoken");

const SECRET = "SECRET";



router.get("/", async (req, res, next) => {
    try {
        const result = await db.query("SELECT * FROM users");
return res.json(result.rows);
} catch (e) {
    return next(e);
}
});

router.post("/", async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
const result = await db.query(
    "INSERT INTO users (username, password, is_admin) VALUES ($1,$2,$3) RETURNING *",
    [req.body.username, hashedPassword , req.body.is_admin]
);
if(req.body.is_admin === undefined){
    const notAdmin = await db.query(
        "UPDATE users SET is_admin=false WHERE username=$1 RETURNING *",
        [req.body.username]
    );
    return res.json(notAdmin.rows[0]);
}else{return res.json(result.rows[0])};
} catch (e) {
    return next(e);
}
});

router.post("/login", async (req,res,next) =>{
    try{
        const foundUser = await db.query(
    "SELECT * FROM users WHERE username=$1 LIMIT 1",
    [req.body.username]
    );
        if (foundUser.rows.length===0) {
            return res.json({message: "Invalid User"});
        }
        const hashedPassword = await bcrypt.compare(
            req.body.password,
            foundUser.rows[0].password
);
        if(hashedPassword === false){
            return res.json({message: "Inavalid Password"})
        }
        const token = jwt.sign(
    {username: foundUser.rows[0].username},
    SECRET,
        {
            expiresIn: 60*60
        }
);
        return res.json({token})
}catch(e){
        return next(e);
}

});
function ensureLoggedIn(req,res,next) {
    try{

        const authHeaderValue = req.headers.authorization;
        const token = jwt.verify(authHeaderValue,"SECRET");
        return res.json(token)
        return next();
    }catch(e){
        return res.status(401).json({message:"Unauthorized"})
    }
}


router.get("/secret", ensureLoggedIn, async(req,res,next) =>{
    try{
       return res.json({message:"You've made it !"});
}catch(e){
    return res.json(e);
}
});

function ensureCorrectUser(req,res,next) {
    try{

        const authHeaderValue = req.headers.authorization;
        const token = jwt.verify(authHeaderValue,"SECRET");
        if (token.username === req.params.username){
            return next();
        }else{
            return res.status(401).json({message:"Unauthorized"});
        }
    }catch(e){
        return res.status(401).json({message:"Unauthorized"});
    }
}
router.get("/:username", ensureCorrectUser,async(req,res,next) =>{
    try{
        return res.json({message: "Its Comming home"});
    }catch(e){
        return res.json(e)
}
});

router.route("/books").post((req,res,next) =>{
    const result = validate(req.body, bookSchema);
    if(!result.valid){
        return next(result.errors)
    }
    const book = req.body.data;
    return res.status(201).json(book)
});


module.exports = router;