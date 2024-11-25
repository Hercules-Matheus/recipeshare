import { auth, signInWithEmailAndPassword } from "./firebase-config.js";

let authToken = ""; // Variável para armazenar o token do usuário

// Função de login
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const token = await userCredential.user.getIdToken(); //Gera o token JWT
    console.log("Login bem-sucedido! Token:", token);

    //Armazena o token para usar nas próximas requisições
    localStorage.setItem("token", token);
    authToken = token;
    alert("Login bem-sucedido!");
    loadRecipes();
    //Redirecione ou atualize a interface se necessário
  } catch (error) {
    console.error("Erro ao realizar login:", error.message);
    alert("Erro ao realizar login: " + error.message);
  }
}

//Vincular a função a um botão de login
document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  login(email, password);
});

// Função para adicionar uma receita
async function addRecipe() {
  const name = document.getElementById("recipe-name").value;
  const description = document.getElementById("recipe-description").value;
  const response = await fetch("http://localhost:3000/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      name,
      description,
    }),
  });

  if (response.ok) {
    alert("Receita adicionada com sucesso!");
    loadRecipes(); // Recarrega a lista de receitas
  } else {
    alert("Erro ao adicionar receita");
  }
}

document.getElementById("createBtn").addEventListener("click", () => {
  addRecipe();
});

// Função para carregar receitas
async function loadRecipes() {
  const response = await fetch("http://localhost:3000/recipes", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (response.ok) {
    const recipes = await response.json();
    displayRecipes(recipes);
  } else {
    alert("Erro ao carregar receitas");
  }
}

// Função para exibir as receitas
function displayRecipes(recipes) {
  const recipeList = document.getElementById("recipe-list");
  recipeList.innerHTML = ""; // Limpa a lista atual

  recipes.forEach((recipe) => {
    const recipeItem = document.createElement("div");
    recipeItem.classList.add("recipe-item");

    recipeItem.innerHTML = `
      <h3>${recipe.name}</h3>
      <p>${recipe.description}</p>
      <button class="deleteBtn" data-id=${recipe.id}>Deletar</button>
      <button class="updateBtn" data-id=${recipe.id}>Editar</button>
    `;

    recipeList.appendChild(recipeItem);
  });

  //Evento de clique para cada botão
  const deleteButtons = document.querySelectorAll(".deleteBtn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const recipeId = event.target.getAttribute("data-id"); // Obtém o ID da receita
      deleteRecipe(recipeId); // Chama a função com o ID correto
    });
  });
}

// Função para deletar uma receita
async function deleteRecipe(recipeId) {
  const response = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (response.ok) {
    alert("Receita deletada com sucesso!");
    loadRecipes(); //Recarrega a lista de receitas
  } else {
    alert("Erro ao deletar receita");
  }
}
