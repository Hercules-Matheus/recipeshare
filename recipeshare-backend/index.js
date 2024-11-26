const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const { admin, db } = require("./firebase-config");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 3000;

//Ativar CORS
app.use(cors());

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para JWT do Firebase
async function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(403).send({ error: "Token não fornecido" });
  }
  try {
    //Verifica o token com o Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Erro ao validar token:", error.message);
    res.status(401).send({ error: "Token inválido ou expirado" });
  }
}

//Rota para consultas em conjunto
app.get("/recipes", authenticateJWT, async (req, res) => {
  try {
    const snapshot = await db
      .collection("recipes")
      .where("userId", "==", req.user.uid)
      .get();
    const recipes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.send(recipes);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

//Rota para adicionar receita
app.post("/recipes", authenticateJWT, async (req, res) => {
  try {
    const recipe = { ...req.body, userId: req.user.uid };
    const docRef = await db.collection("recipes").add(recipe);
    res.status(201).send({ id: docRef.id, ...recipe });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

//Rota para atualizar receita
app.put("/recipes/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("recipes").doc(id).update(req.body);
    res.status(200).send({ id, ...req.body });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

//Rota consulta individual por ID
app.get("/recipes/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection("recipes").doc(id).get();
    if (!doc.exists) throw new Error("Receita não encontrada");
    res.send({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Rota para deletar receita
app.delete("/recipes/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params; // ID da receita a ser deletada
  try {
    const recipeDoc = await db.collection("recipes").doc(id).get();
    //Verifica se a receita existe
    if (!recipeDoc.exists) {
      return res.status(404).send({ error: "Receita não encontrada" });
    }
    //Verifica se o usuário é o dono da receita
    if (recipeDoc.data().userId !== req.user.uid) {
      return res.status(403).send({ error: "Permissão negada" });
    }
    await db.collection("recipes").doc(id).delete();
    res.status(200).send({ message: "Receita deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar receita:", error.message);
    res
      .status(400)
      .send({ error: "Erro ao deletar receita", details: error.message });
  }
});

//Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
