const baseURL = 'http://localhost:3000';

// Function to update the calendar UI with the events
async function updateCalendarUI(xmlString) {
    const parser = new DOMParser();
  
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const events = xmlDoc.getElementsByTagName('event');
    const calendarContainer = document.getElementById('calendar');
    calendarContainer.innerHTML = ''; // Clear the existing calendar
    for(let i = 0; i < events.length; i++) {
        const id = events[i].getElementsByTagName('id')[0].textContent;
        const title = events[i].getElementsByTagName('title')[0].textContent;
        const date = events[i].getElementsByTagName('date')[0].textContent;
        const description = events[i].getElementsByTagName('description')[0].textContent;
        const location = events[i].getElementsByTagName('location')[0].textContent;

        const response = await fetch(`${baseURL}/api/photos?query=${location}`);
        const data = await response.json();
        const imageUrl = data.urls.full; // Get image URL

        
        const eventElement = document.createElement('div');
        eventElement.className = 'col-sm-4';
        eventElement.innerHTML = `
            <div class="card h-100">
                <img src="${imageUrl}" class="card-img-top object-fit-cover w-100" style="height: 300px;" alt="${title}" />
                <div class="card-body">
                    <h5 class="card-title">${title}</h5>
                    <p class="card-text">
                        <span class="text-muted small">
                            ${new Date(date).toDateString()} 
                        </span>
                        </br>
                        <span>
                            ${description.slice(0, 120)}
                            ${description.length > 120 ? '...' : ''}
                        </span></br>
                        <a href="details.html?id=${id}" class="btn btn-outline-primary">Read More</a>
                    </p>
                </div>
            </div>
        `;
        calendarContainer.appendChild(eventElement);
    }
}

document.getElementById("searchForm").addEventListener("submit", async function (e) {
    const searchValue = document.getElementById('searchInput').value;
    e.preventDefault();
    window.location.href = `index.html?q=${searchValue}`;
});