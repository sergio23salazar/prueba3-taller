// Obtener el menú y el botón para mostrar/ocultar el menú
let btnMenu = document.getElementById('btnmenu');
let menu = document.getElementById('menu');

// Alternar la visibilidad del menú al hacer clic en el botón
btnMenu.addEventListener('click', function () {
    'use strict';
    menu.classList.toggle('mostrar');
});

// Obtener todos los elementos del menú
let menuItems = document.querySelectorAll('.menu__item');

// Eliminar todas las clases de selección de los elementos del menú
function clearMenuSelection() {
    menuItems.forEach(function (item) {
        item.querySelector('.menu__link').classList.remove('menu__link--select');
    });
}

// Obtener el nombre de la página actual para determinar la sección activa
let currentPage = window.location.pathname.split('/').pop();

// Identificar la sección activa en el menú y agregar la clase 'menu__link--select'
menuItems.forEach(function (item) {
    let menuLink = item.querySelector('.menu__link');
    let menuHref = menuLink.getAttribute('href');

    if (menuHref === currentPage) {
        clearMenuSelection(); // Asegurarse de eliminar todas las selecciones
        menuLink.classList.add('menu__link--select'); // Agregar solo a la sección activa
    }

    // Escuchar el evento de clic para cambiar la selección al hacer clic en una nueva sección
    menuLink.addEventListener('click', function () {
        'use strict';
        clearMenuSelection(); // Eliminar todas las selecciones
        this.classList.add('menu__link--select'); // Agregar la clase solo al elemento clicado
    });
});
