const { Map } = Immutable; // Import Immutable.js

// Initialize the store as an Immutable Map
let store = Map({
    user: Map({ name: "User" }),
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    selectedRover: null,
    roverData: Map(),
    isLoading: false,
    roverManifestData: Map()
});

const root = document.getElementById('root');

const updateStore = (newState) => {
    store = store.merge(newState);
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
            <h1>Welcome,${name}!</h1>
        `;
    }
    return `
        <h1>Hello!</h1>
    `;
};

const roverDiv = async (rover) => {
    // Update the selected rover in the store
    updateStore({ selectedRover: rover });

    const roverResponse = await getRoverResponse(rover);
    const manifestData = await getRoverManifest(rover);
    if (!manifestData || manifestData.length === 0) {
        console.warn(`No manifest data found for rover: ${rover}`);
    }


    if (!roverResponse || roverResponse.length === 0) {
        console.warn(`No data found for rover: ${rover}`);
        return `<p>No photos available for the selected rover.</p>`;
    }

    const generateRoverCard = (data) => {
        const roverName = data.rover?.name || 'Unknown Rover';
        const imgSrc = data.img_src || 'placeholder.jpg';
        const cameraName = data.camera?.full_name || 'Unknown Camera';
        const launchDate = data.rover?.launch_date || 'N/A';
        const landingDate = data.rover?.landing_date || 'N/A';
        const status = data.rover?.status || 'Unknown';
        const latestPhotoDt = manifestData || 'N/A';

        return `
            <figure class="rover-card" data-name="<strong>${roverName}/strong>">
                <img src="${imgSrc}" alt="Photo taken by ${cameraName}">
                <header class="rover-header">${roverName}</header>
                <figcaption><strong>Launch Date:</strong> ${launchDate}</figcaption>
                <figcaption><strong>Landing Date:</strong> ${landingDate}</figcaption>
                <figcaption><strong>Latest Photo Date:</strong> ${latestPhotoDt}</figcaption>
                <figcaption><strong>Status:</strong> ${status}</figcaption>
            </figure>
        `;
    };

    const htmlOutput = roverResponse.map(generateRoverCard).join('');

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
        const roverData = store.getIn(['roverData', rover]);

        if (roverData && roverData.length > 0) {
            return Promise.resolve(roverData);
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
                updateStore({ roverData: store.get('roverData').set(rover, roverPhotos) });
                return roverPhotos;
            })
            .catch(err => {
                console.error('Error fetching rover latest photos:', err);
                return [];
            });
    };

    const getRoverManifest = (rover) => {
        const manifestData = store.getIn(['roverManifestData', rover]);
        if (manifestData && manifestData.length > 0) {
            return Promise.resolve(manifestData);
        }

        return fetch(`/manifest/${rover}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                const roverManifest = data.latestPhotoDate || 'N/A';
                updateStore({
                    roverManifestData: store.get('roverManifestData').set(rover, roverManifest)
                });
                return roverManifest;
            })
            .catch(err => {
                console.error('Error fetching rover manifest:', err);
                return [];
            });
    };


    const App = () => {
        const appHTML = `
        <header id="app-header"></header>
        <main>
                <div id="rover-container">
                    <h3 class="title">NASA's Mars Rovers</h3>
                    <p>View each rover's photos by clicking on them.</p>
                   <div class="description">
                      🚀 Step into the boots of a Martian explorer with our interactive Mars Rover Dashboard.
                      Choose between 🤖 Curiosity, 🔧 Spirit, or ⚙ Opportunity and instantly uncover a hands-on glimpse into NASAs robotic pioneers—no space suit required 👨‍🚀.
                   </div>
                    <button id="curiosity" class="rover-button">Curiosity</button>
                    <button id="opportunity" class="rover-button">Opportunity</button>
                    <button id="spirit" class="rover-button">Spirit</button>
                    <div id="rover-info"></div>
                    <button id="up" class="up-button">🔝</button>
                </div>
            </div>  
        </main>
        <footer>
        </footer>
    `;

        return appHTML;
    };

    // ------------------------------------------------------  EVENT LISTENERS

    window.addEventListener('load', () => {
        render(root, store);
        attachRoverButtonListeners();
        attachBackToTopListener();

    });

    const attachRoverButtonListeners = () => {
        const curiosityButton = document.getElementById('curiosity');
        const opportunityButton = document.getElementById('opportunity');
        const spiritButton = document.getElementById('spirit');

        curiosityButton.addEventListener('click', () => roverDiv('Curiosity'));
        opportunityButton.addEventListener('click', () => roverDiv('Opportunity'));
        spiritButton.addEventListener('click', () => roverDiv('Spirit'));
    };

    const attachBackToTopListener = () => {
        const upButton = document.getElementById('up');
        upButton.addEventListener('click', () => {
            window.scrollY = 0;
            // window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };
