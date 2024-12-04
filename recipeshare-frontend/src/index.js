import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "./firebase-config.js";

import "../style.css";

// Criar o elemento <link> para importar a fonte Poppins
const link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap";

// Adicionar o <link> no <head> do documento
document.head.appendChild(link);

// Aplicar a fonte Poppins globalmente
document.body.style.fontFamily = "Poppins, sans-serif";

document.addEventListener("DOMContentLoaded", function () {
  let authToken = localStorage.getItem("token");

  // Listener de autenticação do Firebase
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      authToken = await validateAndRefreshToken();
    } else {
      console.warn("Nenhum usuário autenticado. auth listener");
      authToken = "";
      localStorage.removeItem("token");
    }

    initializePage(); // Certifique-se de que a página só seja inicializada após verificar o usuário
  });

  async function validateAndRefreshToken() {
    const user = auth.currentUser;
    if (user) {
      try {
        const tokenResult = await user.getIdTokenResult();
        const expirationTime = new Date(tokenResult.expirationTime).getTime();
        const currentTime = Date.now();

        if (currentTime > expirationTime) {
          // Renova o token
          authToken = await user.getIdToken(true);
          localStorage.setItem("token", authToken);
        } else {
          authToken = tokenResult.token;
        }
        return authToken;
      } catch (error) {
        console.error("Erro ao validar/atualizar token:", error);
        authToken = "";
        localStorage.removeItem("token");
        return null;
      }
    } else {
      console.warn("Nenhum usuário autenticado. validate refresh token");
      return null;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);
      window.location.href = "./home_page.html"; // Navegação para a página inicial
    } catch (error) {
      console.error("Erro ao realizar login:", error.message);
      alert("Erro ao realizar login: " + error.message);
    }
  }

  async function signup(username, email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();
      authToken = token;
      localStorage.setItem("token", token);
      const response = await fetch(
        "https://recipeshare-backend.onrender.com/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ username, email }),
        }
      );

      if (response.ok) {
        alert("Usuário cadastrado com sucesso!");
        window.location.href = "./home_page.html"; // Navegação para a página inicial após cadastro
      } else {
        alert("Erro ao cadastrar usuário na API!");
      }
    } catch (error) {
      console.error("Erro ao realizar cadastro:", error);
      alert("Erro ao realizar cadastro. Tente novamente.");
    }
  }

  async function loadAllRecipes() {
    if (!authToken) {
      alert("Você precisa estar logado para acessar esta página.");
      window.location.href = "./index.html"; // Redirecionar para login se não autenticado
      return;
    }

    try {
      const response = await fetch(
        "https://recipeshare-backend.onrender.com/recipes/all",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const recipes = await response.json();
        displayRecipes(recipes);
      } else {
        alert("Erro ao carregar receitas de todos os usuários.");
      }
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
      alert("Erro ao carregar receitas.");
    }
  }

  function displayMyRecipes(recipes) {
    const recipeList = document.getElementById("recipe-list");
    recipeList.innerHTML = "";

    recipes.forEach((recipe) => {
      const recipeItem = document.createElement("div");
      recipeItem.classList.add("recipe-item");

      recipeItem.innerHTML = `
        <h3 class="name">${recipe.name}</h3>
        <p class="description">${recipe.description}</p>
        <p><strong>Criado por:</strong> ${recipe.username}</p>
        <div id="actionBtns" class="actionBtns">
          <button class="deleteBtn" data-id="${recipe.id}">Deletar</button>
          <button class="editBtn" data-id="${recipe.id}">Editar</button>
        </div>
      `;

      recipeList.appendChild(recipeItem);
    });

    document.querySelectorAll(".editBtn").forEach((button) => {
      button.addEventListener("click", (event) => {
        const recipeId = event.target.getAttribute("data-id");
        localStorage.setItem("editRecipeId", recipeId); // Armazena o ID no localStorage
        window.location.href = "./edit_recipe_page.html"; // Redireciona para a página de edição
      });
    });

    document.querySelectorAll(".deleteBtn").forEach((button) => {
      button.addEventListener("click", (event) => {
        const recipeId = event.target.getAttribute("data-id");
        deleteRecipe(recipeId);
      });
    });
  }

  async function updateRecipe(recipeId) {
    const name = document.getElementById("recipe-name").value;
    const description = document.getElementById("recipe-description").value;

    try {
      const response = await fetch(
        `https://recipeshare-backend.onrender.com/recipes/${recipeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ name, description }),
        }
      );

      if (response.ok) {
        alert("Receita atualizada com sucesso!");
        window.location.href = "./my_recipe_page.html";
      } else {
        alert("Erro ao atualizar receita.");
      }
    } catch (error) {
      console.error("Erro ao atualizar receita:", error);
    }
  }

  async function deleteRecipe(recipeId) {
    try {
      const response = await fetch(
        `https://recipeshare-backend.onrender.com/recipes/${recipeId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.ok) {
        alert("Receita deletada com sucesso!");
        loadRecipes();
      } else {
        alert("Erro ao deletar receita.");
      }
    } catch (error) {
      console.error("Erro ao deletar receita:", error);
    }
  }

  function displayRecipes(recipes) {
    const recipeList = document.getElementById("recipe-list");
    recipeList.innerHTML = "";

    recipes.forEach((recipe) => {
      const recipeItem = document.createElement("div");
      recipeItem.classList.add("recipe-item");
      recipeItem.setAttribute("data-id", recipe.id);

      recipeItem.innerHTML = `
        <h3 class="name">${recipe.name}</h3>
        <p class="description">${recipe.description}</p>
        <p><strong>Criado por:</strong> ${recipe.username}</p>
      `;

      recipeList.appendChild(recipeItem);
    });

    document.querySelectorAll(".recipe-item").forEach((card) => {
      card.addEventListener("click", (event) => {
        const recipeId = event.currentTarget.getAttribute("data-id");
        localStorage.setItem("recipeId", recipeId); // Armazena o ID no localStorage
        window.location.href = "./recipe_page.html"; // Redireciona para a página de edição
      });
    });
  }

  async function addRecipe() {
    const name = document.getElementById("recipe-name").value;
    const description = document.getElementById("recipe-description").value;

    try {
      const response = await fetch(
        "https://recipeshare-backend.onrender.com/recipes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ name, description }),
        }
      );

      if (response.ok) {
        alert("Receita adicionada com sucesso!");
        loadRecipes();
      } else {
        alert("Erro ao adicionar receita.");
      }
    } catch (error) {
      console.error("Erro ao adicionar receita:", error);
    }
  }

  async function loadRecipes() {
    try {
      const response = await fetch(
        "https://recipeshare-backend.onrender.com/recipes",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.ok) {
        const recipes = await response.json();
        displayMyRecipes(recipes);
      } else {
        alert("Erro ao carregar receitas.");
      }
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
    }
  }

  async function loadRecipeById(recipeId) {
    try {
      const response = await fetch(
        `https://recipeshare-backend.onrender.com/recipes/${recipeId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.ok) {
        const recipes = await response.json();
        displayRecipeDetails([recipes]);
      } else {
        alert("Erro ao carregar receita por ID.");
      }
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
    }
  }

  function displayRecipeDetails(recipes) {
    const recipeList = document.getElementById("recipe-list");
    recipeList.innerHTML = "";

    recipes.forEach((recipe) => {
      const recipeItem = document.createElement("div");
      recipeItem.classList.add("recipe-item");

      recipeItem.innerHTML = `
        <h3 class="name">${recipe.name}</h3>
        <p class="description">${recipe.description}</p>
      `;

      recipeList.appendChild(recipeItem);
    });
  }

  async function loadRecipeDetails(recipeId) {
    try {
      const response = await fetch(
        `https://recipeshare-backend.onrender.com/recipes/${recipeId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.ok) {
        const recipe = await response.json();
        document.getElementById("recipe-name").value = recipe.name;
        document.getElementById("recipe-description").value =
          recipe.description;
      } else {
        alert("Erro ao carregar detalhes da receita.");
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da receita:", error);
    }
  }

  async function logout() {
    try {
      await auth.signOut();
      localStorage.removeItem("token");
      window.location.href = "./index.html"; // Navegação para página de login após logout
      alert("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      alert("Erro ao realizar logout.");
    }
  }

  async function initializePage() {
    if (document.getElementById("loginBtn")) {
      document.getElementById("loginBtn").addEventListener("click", () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        login(email, password);
      });
    }

    if (document.getElementById("signupBtn")) {
      document.getElementById("signupBtn").addEventListener("click", () => {
        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        signup(username, email, password);
      });
    }

    if (document.getElementById("home-page")) {
      document.getElementById("all-recipes").addEventListener("click", () => {
        window.location.href = "./home_page.html";
      });
      document.getElementById("logout").addEventListener("click", logout);
      document
        .getElementById("recipe-navigate")
        .addEventListener("click", () => {
          window.location.href = "./my_recipe_page.html";
        });
      loadAllRecipes();
    }
    if (document.getElementById("createBtn")) {
      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "./home_page.html";
      });
      document.getElementById("createBtn").addEventListener("click", addRecipe);
      loadRecipes();
    }
    if (document.getElementById("recipe-page")) {
      document.getElementById("all-recipes").addEventListener("click", () => {
        window.location.href = "./home_page.html";
      });
      document.getElementById("logout").addEventListener("click", logout);
      document
        .getElementById("recipe-navigate")
        .addEventListener("click", () => {
          window.location.href = "./my_recipe_page.html";
        });
      const recipeId = localStorage.getItem("recipeId");
      loadRecipeById(recipeId);
    }
    if (document.getElementById("saveBtn")) {
      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "./my_recipe_page.html";
      });
      const recipeId = localStorage.getItem("editRecipeId");
      if (recipeId) {
        loadRecipeDetails(recipeId);
        document.getElementById("saveBtn").addEventListener("click", () => {
          updateRecipe(recipeId);
        });
      } else {
        alert("ID da receita não encontrado.");
        window.location.href = "./my_recipe_page.html";
      }
    }
  }
});
