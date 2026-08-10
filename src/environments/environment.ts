// Entorno de DESARROLLO (ng serve / build por defecto).
//
// apiUrl se arma con el mismo host desde el que se abrió la página:
// - Si entras desde el navegador de tu PC → http://localhost:8080/api
// - Si entras desde el celular usando la IP de tu PC (ej. http://192.168.1.5:4200)
//   → automáticamente usa http://192.168.1.5:8080/api
// Así no hace falta editar nada para probar desde el celular.
export const environment = {
  production: false,
  apiUrl: `http://${window.location.hostname}:8080/api`
};
