import { auth, signInWithEmailAndPassword } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
  let authToken = localStorage.getItem("token") || ""; // Pega o token armazenado

  // Função de login
  async function login(username, email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken(); // Gera o token JWT
      console.log("Login bem-sucedido! Token:", token);

      // Armazena o token para usar nas próximas requisições
      localStorage.setItem("token", token);
      authToken = token;
      alert("Login bem-sucedido!");
      window.location.href = "pages/home_page.html"; // Redireciona para a página de receitas
    } catch (error) {
      console.error("Erro ao realizar login:", error.message);
      alert("Erro ao realizar login: " + error.message);
    }
  }

  // Verifica se estamos na página de login
  if (document.getElementById("loginBtn")) {
    // Vincular a função a um botão de login
    const loginBtn = document.getElementById("loginBtn");
    loginBtn.addEventListener("click", () => {
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      login(email, password);
    });
  }

  // Função para carregar todas as receitas (de todos os usuários)
  async function loadAllRecipes() {
    if (!authToken) {
      alert("Você precisa estar logado para acessar esta página.");
      window.location.href = "login.html"; // Redireciona para a página de login
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
        displayRecipes(recipes); // Reutilize a função displayRecipes
      } else {
        alert("Erro ao carregar receitas de todos os usuários");
      }
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
      alert("Erro ao carregar receitas de todos os usuários");
    }
  }

  // Chama loadAllRecipes automaticamente ao carregar a página
  document.addEventListener("DOMContentLoaded", () => {
    loadAllRecipes();
  });

  // Verifica se estamos na página de receitas
  if (document.getElementById("createBtn")) {
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
        const errorMessage = await response.text();
        alert("Erro ao adicionar receita: " + errorMessage);
      }
    }

    // Vincular a função ao botão de criar receita
    const createBtn = document.getElementById("createBtn");
    createBtn.addEventListener("click", () => {
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
          <button class="editBtn" data-id=${recipe.id}>Editar</button>
        `;

        recipeList.appendChild(recipeItem);
      });

      // Evento de clique para cada botão de editar
      const editButtons = document.querySelectorAll(".editBtn");
      editButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          const recipeId = event.target.getAttribute("data-id"); // Obtém o ID da receita
          localStorage.setItem("editRecipeId", recipeId); // Armazena o ID da receita a ser editada
          window.location.href = "edit_recipe_page.html"; // Redireciona para a página de edição
        });
      });

      // Evento de clique para cada botão de deletar
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
      const response = await fetch(
        `http://localhost:3000/recipes/${recipeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        alert("Receita deletada com sucesso!");
        loadRecipes(); // Recarrega a lista de receitas
      } else {
        alert("Erro ao deletar receita");
      }
    }

    // Carrega as receitas ao carregar a página de receitas
    loadRecipes();
  }

  // Verifica se estamos na página de edição de receitas
  if (document.getElementById("saveBtn")) {
    const recipeId = localStorage.getItem("editRecipeId"); // Pega o ID da receita a ser editada

    if (recipeId) {
      // Função para carregar os detalhes da receita
      async function loadRecipeDetails() {
        const response = await fetch(
          `http://localhost:3000/recipes/${recipeId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.ok) {
          const recipe = await response.json();
          document.getElementById("recipe-name").value = recipe.name;
          document.getElementById("recipe-description").value =
            recipe.description;
        } else {
          alert("Erro ao carregar detalhes da receita");
        }
      }

      // Carrega os detalhes da receita ao carregar a página
      loadRecipeDetails();

      // Função para atualizar a receita
      async function updateRecipe() {
        const name = document.getElementById("recipe-name").value;
        const description = document.getElementById("recipe-description").value;
        const response = await fetch(
          `http://localhost:3000/recipes/${recipeId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              name,
              description,
            }),
          }
        );

        if (response.ok) {
          alert("Receita atualizada com sucesso!");
          window.location.href = "recipe_page.html"; // Redireciona para a página de receitas
        } else {
          const errorMessage = await response.text();
          alert("Erro ao atualizar receita: " + errorMessage);
        }
      }

      // Vincular a função ao botão salvar
      const saveBtn = document.getElementById("saveBtn");
      saveBtn.addEventListener("click", () => {
        updateRecipe();
      });
    } else {
      alert("ID da receita não encontrado. Redirecionando...");
      window.location.href = "recipe_page.html"; // Redireciona para a página de receitas se o ID não for encontrado
    }
  }
});
