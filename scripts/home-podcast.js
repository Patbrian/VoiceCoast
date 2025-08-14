// Spotify API credentials
const clientId = '03ee85035cae4bfeada30defb3a31dce';
const clientSecret = 'ade1d4bbc1464ea797117d38d5725c18';
const showId = '4G8qSFJJ1SNYoowvx3k8TP';
const websiteUrl = 'https://cotedesvoix.com';

// Function to get Spotify access token
async function getSpotifyToken() {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });
        
        const data = await response.json();
        console.log('Got Spotify token response:', data);
        return data.access_token;
    } catch (error) {
        console.error('Error getting Spotify token:', error);
        throw new Error('Failed to authenticate with Spotify');
    }
}

// Cache management
const CACHE_KEY = 'spotify_episodes_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCache() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    try {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return data;
    } catch (e) {
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

function setCache(data) {
    const cache = {
        timestamp: Date.now(),
        data: data
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

async function fetchLatestPodcasts() {
    const loading = document.getElementById('podcast-loading');
    const latestPodcasts = document.getElementById('latest-podcasts');
    const errorContainer = document.getElementById('podcast-error');
    
    console.log('Loading element:', loading);
    console.log('Latest podcasts element:', latestPodcasts);
    
    if (!loading || !latestPodcasts) {
        console.error('Required elements not found');
        return;
    }
    
    try {
        // Always check and display cached data first
        const cachedData = getCache();
        if (cachedData) {
            // Show cached content immediately
            displayPodcasts(cachedData);
            // Show a subtle loading indicator for refresh
            loading.innerHTML = '<div class="refresh-indicator">Actualisation en arrière-plan...</div>';
            loading.classList.remove('hidden');
            loading.style.opacity = '0.5';  // Make it less prominent
        } else {
            // Show full loading indicator if no cached data
            loading.innerHTML = '<div class="loading-spinner"></div><div>Chargement des podcasts...</div>';
            loading.classList.remove('hidden');
        }
        
        if (errorContainer) errorContainer.classList.add('hidden');
        
        // Get access token
        const token = await getSpotifyToken();
        
        // Fetch episodes with retry mechanism
        const maxRetries = 3;
        let retryCount = 0;
        let response;
        
        while (retryCount < maxRetries) {
            try {
                console.log(`Attempt ${retryCount + 1} of ${maxRetries}`);
                response = await fetch(`https://api.spotify.com/v1/shows/${showId}/episodes?market=FR&limit=3`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    console.log('Successfully fetched episodes');
                    break;
                }
                
                // If rate limited, wait before retrying
                if (response.status === 429) {
                    const retryAfter = parseInt(response.headers.get('Retry-After')) || 5;
                    console.log(`Rate limited. Waiting ${retryAfter} seconds before retry`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                } else {
                    console.log(`Request failed with status: ${response.status}`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between retries
                }
                
                retryCount++;
            } catch (e) {
                console.error('Fetch error:', e);
                retryCount++;
                if (retryCount === maxRetries) throw e;
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            }
        }
        
        if (!response.ok) {
            throw new Error(`Erreur de chargement: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Spotify API response:', data);
        
        // Filter out null items and validate episode data
        const validEpisodes = (data.items || [])
            .filter(episode => episode !== null && 
                typeof episode === 'object' &&
                episode.id &&
                episode.name &&
                episode.release_date
            );
            
        console.log('Valid episodes:', validEpisodes);
        
        if (validEpisodes.length === 0) {
            const cachedData = getCache();
            if (cachedData) {
                console.log('No valid episodes found, keeping cached data');
                return;
            }
            throw new Error('Aucun épisode valide trouvé');
        }

        const currentCache = getCache();
        const newData = validEpisodes;
        
        // Only update if we have new valid data that's different from cache
        if (newData && newData.length > 0) {
            if (!currentCache || JSON.stringify(currentCache) !== JSON.stringify(newData)) {
                console.log('Updating with new episodes:', newData);
                setCache(newData);
                displayPodcasts(newData);
            } else {
                console.log('No changes in podcast data');
            }
        } else if (currentCache) {
            console.log('Using cached data');
            displayPodcasts(currentCache);
        }
        
    } catch (error) {
        console.error('Error fetching podcasts:', error);
        const cachedData = getCache();
        if (cachedData) {
            // If we have cached data, show it and a subtle error message
            displayPodcasts(cachedData);
            loading.innerHTML = '<div class="refresh-indicator" style="color: #d32f2f">Actualisation impossible. Affichage du contenu en cache.</div>';
            setTimeout(() => loading.classList.add('hidden'), 3000);
        } else {
            // If no cached data, show the full error
            showError('Impossible de charger les podcasts. Veuillez réessayer plus tard.');
            loading.classList.add('hidden');
        }
    } finally {
        loading.style.opacity = '1'; // Reset opacity
    }
}

// Display error message
function showError(message) {
    const errorContainer = document.getElementById('podcast-error') || createErrorContainer();
    errorContainer.classList.remove('hidden');
    errorContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button onclick="retryLoading()">Réessayer</button>
        </div>
    `;
}

// Create error container if it doesn't exist
function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'podcast-error';
    container.classList.add('podcast-error');
    document.getElementById('latest-podcasts').parentNode.insertBefore(container, document.getElementById('latest-podcasts'));
    return container;
}

// Function to display podcasts
async function retryLoading() {
    const errorContainer = document.getElementById('podcast-error');
    if (errorContainer) {
        errorContainer.classList.add('hidden');
    }
    localStorage.removeItem(CACHE_KEY); // Clear cache on retry
    await fetchLatestPodcasts();
}

function displayPodcasts(episodes) {
    const latestPodcasts = document.getElementById('latest-podcasts');
    console.log('Display podcasts called with episodes:', episodes);
    if (!latestPodcasts) {
        console.error('Latest podcasts element not found');
        return;
    }
    
    if (!Array.isArray(episodes) || episodes.length === 0) {
        console.error('No valid episodes to display');
        showError('Aucun épisode à afficher');
        return;
    }
    
    // Filter out invalid episodes first
    const validEpisodes = episodes.filter(episode => 
        episode && 
        episode.id && 
        episode.name && 
        episode.release_date
    );

    if (validEpisodes.length === 0) {
        console.error('No valid episodes to display');
        showError('Aucun épisode à afficher');
        return;
    }

    const podcastsHTML = validEpisodes.map(episode => {
        // Format date with fallback
        let dateStr = 'Date non disponible';
        if (episode.release_date) {
            try {
                dateStr = new Date(episode.release_date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                console.warn('Error formatting date:', error);
            }
        }
    
        // Convert duration from milliseconds to minutes
        const duration = Math.floor((episode.duration_ms || 0) / 60000);
        
        // Get image URL with fallback
        const imageUrl = episode.images && episode.images[0] ? episode.images[0].url : 'Images/favicon.png';
        const episodeName = episode.name || 'Épisode sans titre';
        const spotifyUrl = episode.external_urls?.spotify || `https://open.spotify.com/episode/${episode.id}`;
        
        return `
            <div class="podcast-card" data-episode-id="${episode.id}">
                <div class="podcast-image">
                    <img src="${imageUrl}" alt="${episodeName}" onerror="this.src='Images/favicon.png'">
                    <div class="podcast-play">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="podcast-content">
                    <h3 class="podcast-title">${episodeName}</h3>
                    <div class="podcast-meta">
                        <span class="podcast-date">
                            <i class="far fa-calendar-alt"></i>
                            ${dateStr}
                        </span>
                        <span class="podcast-duration">
                            <i class="far fa-clock"></i>
                            ${duration} min
                        </span>
                    </div>
                    <div class="podcast-player" id="player-${episode.id}" style="display: none;">
                        <iframe 
                            src="https://open.spotify.com/embed/episode/${episode.id}?utm_source=generator&theme=0" 
                            width="100%" 
                            height="152" 
                            frameBorder="0" 
                            allowfullscreen="" 
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                            loading="lazy">
                        </iframe>
                    </div>
                    <a href="${spotifyUrl}" class="listen-btn" target="_blank" rel="noopener">
                        Écouter sur Spotify
                    </a>
                </div>
            </div>
        `;
    }).join('');
    
    latestPodcasts.innerHTML = podcastsHTML;
    
    // Initialize players after they're added to the DOM
    initializePlayers();
}

// Function to initialize players
function initializePlayers() {
    // Add click handlers for play buttons
    document.querySelectorAll('.podcast-play').forEach(playButton => {
        playButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = playButton.closest('.podcast-card');
            const player = card.querySelector('.podcast-player');
            
            // Toggle player visibility
            player.style.display = player.style.display === 'none' ? 'block' : 'none';
            
            // Update play button icon
            const icon = playButton.querySelector('i');
            icon.className = player.style.display === 'none' ? 'fas fa-play' : 'fas fa-pause';
        });
    });
}

// Add event listeners for podcast cards
function addPodcastEventListeners() {
    document.querySelectorAll('.podcast-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on the Spotify link
            if (!e.target.closest('.listen-btn')) {
                const spotifyLink = card.querySelector('.listen-btn').href;
                window.open(spotifyLink, '_blank');
            }
        });
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchLatestPodcasts();
    // Add event listeners after podcasts are loaded
    setTimeout(addPodcastEventListeners, 1000);
}); 