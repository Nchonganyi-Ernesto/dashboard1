  const hamburger = document.getElementById('hamburgerMenu');
        const authDropMenu = document.getElementById('authDropMenu');

        hamburger.addEventListener('click', () => {
            authDropMenu.classList.toggle('open');
        });