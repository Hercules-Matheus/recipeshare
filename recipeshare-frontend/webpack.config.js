const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: "./src/index.js", // Entrada principal
  output: {
    filename: "bundle.js", // Arquivo de saída JS
    path: path.resolve(__dirname, "dist"), // Pasta de saída
    clean: true, // Limpa o diretório dist antes de cada build
  },
  module: {
    rules: [
      {
        test: /\.css$/i, // Processa arquivos CSS
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.html$/i, // Processa arquivos HTML
        loader: "html-loader",
        options: {
          sources: false, // Evitar problemas com imagens
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "style.css", // Arquivo de saída CSS
    }),
    new HtmlWebpackPlugin({
      template: "./index.html", // Ponto de entrada do HTML
      filename: "index.html",
    }),
    // Geração de outras páginas HTML
    new HtmlWebpackPlugin({
      template: "./pages/edit_recipe_page.html",
      filename: "edit_recipe_page.html",
    }),
    new HtmlWebpackPlugin({
      template: "./pages/home_page.html",
      filename: "home_page.html",
    }),
    new HtmlWebpackPlugin({
      template: "./pages/my_recipe_page.html",
      filename: "my_recipe_page.html",
    }),
    new HtmlWebpackPlugin({
      template: "./pages/recipe_page.html",
      filename: "recipe_page.html",
    }),
    new HtmlWebpackPlugin({
      template: "./pages/signup_page.html",
      filename: "signup_page.html",
    }),
  ],
  devServer: {
    static: "./dist", // Serve a pasta de saída
    port: 8080,
    open: true,
  },
  mode: "production",
};
