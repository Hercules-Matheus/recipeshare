const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { admin, db } = require("./firebase-config");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 3000;

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//JWT Secret
const SECRET_KEY = process.env.JWT_SECRET;

//Middleware JWT validate
function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).send({ error: "Token não fornecido" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: "Token inválido" });
  }
}

//Rota de registro/login de usuario
app.post("/auth/token", async (req, res) => {
  const { email, password } = req.body;

  try {
    //Verifica se o usuario existe no firebase
    const userRecord = await admin.auth().getUserByEmail(email);

    //Cria o token JWT
    const token = jwt.sign(
      {
        uid: userRecord.uid,
        email: userRecord.email,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).send({ token });
  } catch (error) {
    res
      .status(401)
      .send({ error: "Credenciais inválidas", details: error.message });
  }
});
