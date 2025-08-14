async function fetchWordPressPosts(page = 1) {
    const loading = document.getElementById('loading');
    const blogContainer = document.querySelector('.blog-container');
    const paginationContainer = document.querySelector('.pagination');
    
    try {
        loading.classList.remove('hidden');
        blogContainer.innerHTML = ''; // Clear any existing content
        
        // Fetch posts with pagination parameters
        const response = await fetch(`https://cotedesvoix.com/wp/wp-json/wp/v2/posts?_embed&per_page=12&page=${page}&orderby=date&order=desc`);
        const posts = await response.json();
        
        // Get total number of pages from response headers
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages')) || 1;
        
        // Display posts
        posts.forEach(post => {
            const featuredImage = post._embedded['wp:featuredmedia'] 
                ? post._embedded['wp:featuredmedia'][0].source_url 
                : 'default-image.jpg';
                
            const date = new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Get excerpt: use post.excerpt.rendered if available, else generate from content
            let excerpt = '';
            if (post.excerpt && post.excerpt.rendered) {
                // Strip HTML tags and limit to 10 words
                const div = document.createElement('div');
                div.innerHTML = post.excerpt.rendered;
                excerpt = div.textContent || div.innerText || '';
                excerpt = excerpt.split(' ').slice(0, 10).join(' ');
                if (excerpt.length > 0) excerpt += '...';
            } else if (post.content && post.content.rendered) {
                // Strip HTML tags and limit to 10 words
                const div = document.createElement('div');
                div.innerHTML = post.content.rendered;
                excerpt = div.textContent || div.innerText || '';
                excerpt = excerpt.split(' ').slice(0, 10).join(' ');
                if (excerpt.length > 0) excerpt += '...';
            }

            const articleHTML = `
                <article class="blog-card">
                    <div class="blog-image">
                        <img src="${featuredImage}" alt="${post.title.rendered}">
                    </div>
                    <div class="blog-content">
                        <h2 class="blog-title">${post.title.rendered}</h2>
                        <p class="blog-excerpt">${excerpt}</p>
                        <div class="blog-meta">
                            <span class="blog-date">
                                <i class="far fa-calendar-alt"></i>
                                ${date}
                            </span>
                            <a href="${post.link}" class="read-more" title="Lire plus">
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </article>
            `;
            
            blogContainer.innerHTML += articleHTML;
        });

        // Create pagination controls
        let paginationHTML = '';
        if (totalPages > 1) {
            paginationHTML = `
                <div class="pagination-controls">
                    ${page > 1 ? `<button class="pagination-btn" onclick="fetchWordPressPosts(${page - 1})">Précédent</button>` : ''}
                    <span class="page-info">Page ${page} de ${totalPages}</span>
                    ${page < totalPages ? `<button class="pagination-btn" onclick="fetchWordPressPosts(${page + 1})">Suivant</button>` : ''}
                </div>
            `;
        }
        paginationContainer.innerHTML = paginationHTML;
    } catch (error) {
        console.error('Error fetching posts:', error);
        blogContainer.innerHTML = '<p class="error">Erreur de chargement des articles de blog. Veuillez réessayer plus tard.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchWordPressPosts(1);
});

// Scroll behavior for nav
let lastScrollY = window.scrollY;
const nav = document.querySelector('.main-nav');

window.addEventListener('scroll', () => {
    if (!nav) return; // Guard clause
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > lastScrollY) {
        nav.classList.remove('header-visible');
        nav.classList.add('header-hidden');
    } else {
        nav.classList.remove('header-hidden');
        nav.classList.add('header-visible');
    }
    
    lastScrollY = currentScrollY;
});
