const token = localStorage.getItem('token');

const userNavbar = document.getElementById("userNavbar");

if (token) {
    userNavbar.innerHTML = `
        <li><a class="dropdown-item" href="profile.html">Profile</a></li>
        <li><button class="dropdown-item" id="logoutButton">Logout</button></li>
    `;
}

const logoutButton = document.getElementById('logoutButton');

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        alert('Successfully logged out!');
        window.location.href = 'index.html';
    });
}