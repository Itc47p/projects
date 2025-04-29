let store = {
    user: { name: "Chris" },
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    selectedRover: null,
    roverData: {},
    isLoading: false
};
let htmlOutput = '';

const root = document.getElementById('root')

const updateStore = (newState) => {
    Object.assign(store, newState);
    render(root, store);
};

const render = async (root, state) => {
    if (!root) {
        console.error('Root element is null or undefined!');
        return;
    }
    root.innerHTML = App(state);
    attachRoverButtonListeners();
};

const Greeting = (name) => {
    if (name) {
        return `
            <h1>Welcome, ${name}!</h1>
        `
    }
    return `
        <h1>Hello!</h1>
    `
}

const roverDiv = async (rover) => {
    // Update the selected rover in the store
    updateStore({ selectedRover: rover });

    // Get the rover data, conditionally
    const roverResponse = await getRoverResponse(rover);

    if (!roverResponse || roverResponse.length === 0) {
        console.warn(`No data found for rover: ${rover}`);
        return `<p>No photos available for the selected rover.</p>`;
    }

    // Generate HTML
    const generateRoverCard = (data) => {
        const roverName = data.rover?.name || 'Unknown Rover';
        const imgSrc = data.img_src || 'placeholder.jpg';
        const cameraName = data.camera?.full_name || 'Unknown Camera';
        const launchDate = data.rover?.launch_date || 'N/A';
        const landingDate = data.rover?.landing_date || 'N/A';
        const status = data.rover?.status || 'Unknown';

        return `
            <div class="rover-card" data-name="${roverName}">
                <img src="${imgSrc}" alt="Photo taken by ${cameraName}">
                <header class="rover-header">${roverName}</header>
                <p><span>Launch Date: </span>${launchDate}</p>
                <p><span>Landing Date: </span>${landingDate}</p>
                <p><span>Status: </span>${status}</p>
            </div>
        `;
    };

    const htmlOutput = roverResponse.map(generateRoverCard).join('');

    // Insert the HTML
    const roverContainer = document.getElementById('rover-info');
    if (roverContainer) {
        roverContainer.innerHTML = htmlOutput;
    } else {
        console.error('Rover container not found in the DOM.');
    }

    return htmlOutput;
};

// ------------------------------------------------------  API CALLS

const getRoverResponse = (rover) => {

    if (store.roverData[rover] && store.roverData[rover].length > 0) {
        return Promise.resolve(store.roverData[rover]);
    }

    return fetch(`/rovers/${rover}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            // Cache the data   
            const roverPhotos = data.data || [];
            updateStore({ roverData: { ...store.roverData, [rover]: roverPhotos } });
            return roverPhotos;
        })
        .catch(err => {
            console.error('Error fetching rover latest photos:', err);
            return [];
        });
};

const App = (state) => {
    const appHTML = `
        <header></header>
        <main>
            ${Greeting(store.user.name)}
                <h3 class="title">Mars Rover Dashboard</h3>
            <section id="photos">
                <div id="rover-container" align="center">
                    <h3 class="title">NASA's Mars Rovers</h3>
                    <p>View each rover's photos by clicking on them.</p>
                    <p>
                        The Mars Rover Photos API provides access to images taken by the Mars rovers. The API allows users to retrieve
                        images from specific dates, cameras, and rovers. It also provides information about the rovers and their missions.
                    </p>
                    <button id="curiosity" class="rover-button">Curiosity</button>
                    <button id="opportunity" class="rover-button">Opportunity</button>
                    <button id="spirit" class="rover-button">Spirit</button>
                    <div id="rover-info"></div>
                </div>
            </section>
        </main>
        <footer>
        </footer>
    `;

    return appHTML;
};;
// ------------------------------------------------------  EVENT LISTENERS

window.addEventListener('load', () => {
    render(root, store);
    attachRoverButtonListeners();
});

const attachRoverButtonListeners = () => {
    const curiosityButton = document.getElementById('curiosity');
    const opportunityButton = document.getElementById('opportunity');
    const spiritButton = document.getElementById('spirit');

    if (!curiosityButton || !opportunityButton || !spiritButton) {
        console.error('Rover buttons not found in the DOM!');
        return;
    }

    curiosityButton.addEventListener('click', () => roverDiv('Curiosity'));
    opportunityButton.addEventListener('click', () => roverDiv('Opportunity'));
    spiritButton.addEventListener('click', () => roverDiv('Spirit'));
};
