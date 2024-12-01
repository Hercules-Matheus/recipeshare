import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
  let authToken = localStorage.getItem("token") || "";

  async function validateAndRefreshToken() {
    // Verifique se o token está no localStorage
    authToken = localStorage.getItem("token") || "";

    if (!authToken) {
      console.warn("Nenhum token encontrado. O usuário não está autenticado.");
      return null;
    }

    // Verifique o estado do usuário
    const user = auth.currentUser;
    if (user) {
      try {
        const tokenResult = await user.getIdTokenResult();
        const expirationTime = tokenResult.expirationTime;
        const currentTime = Date.now();

        // Se o token estiver expirado, renove-o
        if (currentTime > expirationTime) {
          console.log("Token expirado. Renovando...");
          authToken = await user.getIdToken(true); // Força a renovação
          localStorage.setItem("token", authToken); // Atualiza o token no localStorage
        }
      } catch (error) {
        console.error("Erro ao validar/atualizar token:", error);
        authToken = "";
        localStorage.removeItem("token");
        return null;
      }
    } else {
      console.warn("Nenhum usuário autenticado.");
      return null;
    }

    return authToken;
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token); // Armazene o token no localStorage
      console.log("Login bem-sucedido!");
      window.location.href = "pages/home_page.html";
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
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username, email }),
      });

      if (response.ok) {
        alert("Usuário cadastrado com sucesso!");
        window.location.href = "home_page.html";
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
      window.location.href = "../index.html";
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/recipes/all", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const recipes = await response.json();
        displayAllRecipes(recipes);
      } else {
        alert("Erro ao carregar receitas de todos os usuários.");
      }
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
      alert("Erro ao carregar receitas.");
    }
  }

  function displayAllRecipes(recipes) {
    const recipeList = document.getElementById("recipe-list");
    recipeList.innerHTML = "";

    recipes.forEach((recipe) => {
      const recipeItem = document.createElement("div");
      recipeItem.classList.add("recipe-item");

      recipeItem.innerHTML = `
        <h3>${recipe.name}</h3>
        <p>${recipe.description}</p>
        <p><strong>Criado por:</strong> ${recipe.username}</p>
      `;

      recipeList.appendChild(recipeItem);
    });
  }

  function displayRecipes(recipes) {
    const recipeList = document.getElementById("recipe-list");
    recipeList.innerHTML = "";

    recipes.forEach((recipe) => {
      const recipeItem = document.createElement("div");
      recipeItem.classList.add("recipe-item");

      recipeItem.innerHTML = `
        <h3>${recipe.name}</h3>
        <p>${recipe.description}</p>
        <p><strong>Criado por:</strong> ${recipe.username}</p>
        <button class="deleteBtn" data-id=${recipe.id}>Deletar</button>
        <button class="editBtn" data-id=${recipe.id}>Editar</button>
      `;

      recipeList.appendChild(recipeItem);
    });

    document.querySelectorAll(".editBtn").forEach((button) => {
      button.addEventListener("click", (event) => {
        const recipeId = event.target.getAttribute("data-id");
        localStorage.setItem("editRecipeId", recipeId);
        window.location.href = "edit_recipe_page.html";
      });
    });

    document.querySelectorAll(".deleteBtn").forEach((button) => {
      button.addEventListener("click", (event) => {
        const recipeId = event.target.getAttribute("data-id");
        deleteRecipe(recipeId);
      });
    });
  }

  async function addRecipe() {
    const name = document.getElementById("recipe-name").value;
    const description = document.getElementById("recipe-description").value;

    try {
      const response = await fetch("http://localhost:3000/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name, description }),
      });

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
      const response = await fetch("http://localhost:3000/recipes", {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const recipes = await response.json();
        displayRecipes(recipes);
      } else {
        alert("Erro ao carregar receitas.");
      }
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
    }
  }

  async function loadRecipeDetails(recipeId) {
    try {
      const response = await fetch(
        `http://localhost:3000/recipes/${recipeId}`,
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

  async function searchRecipesByName(name) {
    if (!authToken) {
      alert("Você precisa estar logado para buscar receitas.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/recipes/search?name=${encodeURIComponent(name)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.ok) {
        const recipes = await response.json();
        displayAllRecipes(recipes);
      } else {
        alert("Nenhuma receita encontrada com o nome especificado.");
      }
    } catch (error) {
      console.error("Erro ao buscar receitas:", error);
      alert("Erro ao buscar receitas.");
    }
  }

  async function updateRecipe(recipeId) {
    const name = document.getElementById("recipe-name").value;
    const description = document.getElementById("recipe-description").value;

    try {
      const response = await fetch(
        `http://localhost:3000/recipes/${recipeId}`,
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
        window.location.href = "recipe_page.html";
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
        `http://localhost:3000/recipes/${recipeId}`,
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

  async function logout() {
    try {
      // Realiza o logout no Firebase
      await auth.signOut();

      // Remove o token armazenado no localStorage
      localStorage.removeItem("token");

      // Redireciona o usuário para a página de login
      window.location.href = "../index.html";
      alert("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      alert("Erro ao realizar logout.");
    }
  }

  async function initializePage() {
    const token = await validateAndRefreshToken();

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
      document.getElementById("searchBtn").addEventListener("click", () => {
        const name = document.getElementById("search-recipe-name").value;
        if (name) {
          searchRecipesByName(name);
        } else {
          alert("Por favor, insira o nome da receita.");
        }
      });
      document
        .getElementById("all-recipes")
        .addEventListener("click", () => loadAllRecipes());
      document.getElementById("logout").addEventListener("click", logout);
      document
        .getElementById("recipe-navigate")
        .addEventListener("click", () => {
          window.location.href = "recipe_page.html";
        });
      loadAllRecipes();
    }
    if (document.getElementById("createBtn")) {
      document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "home_page.html";
      });
      document.getElementById("createBtn").addEventListener("click", addRecipe);
      loadRecipes();
    }
    if (document.getElementById("saveBtn")) {
      const recipeId = localStorage.getItem("editRecipeId");
      if (recipeId) {
        loadRecipeDetails(recipeId);
        document.getElementById("saveBtn").addEventListener("click", () => {
          updateRecipe(recipeId);
        });
      } else {
        alert("ID da receita não encontrado.");
        window.location.href = "recipe_page.html";
      }
    }
  }

  initializePage();
});
