const menuToggle = document.getElementById("menuToggle");
const menuOptions = document.getElementById("menuOptions");

menuToggle.addEventListener("click", () => {
  menuOptions.classList.toggle("hidden");
});
