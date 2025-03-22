async function fetchWordPressPosts() {
    const loading = document.getElementById('loading');
    const blogContainer = document.querySelector('.blog-container');
    
    try {
        loading.classList.remove('hidden');
        blogContainer.innerHTML = ''; // Clear any existing content
        
        // Replace with your WordPress site URL
        const response = await fetch('https://cotedesvoix.com/wp/wp-json/wp/v2/posts?_embed');
        const posts = await response.json();
        
        posts.forEach(post => {
            const featuredImage = post._embedded['wp:featuredmedia'] 
                ? post._embedded['wp:featuredmedia'][0].source_url 
                : 'default-image.jpg';
                
            const date = new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const articleHTML = `
                <article class="blog-card">
                    <div class="blog-image">
                        <img src="${featuredImage}" alt="${post.title.rendered}">
                    </div>
                    <div class="blog-content">
                        <h2 class="blog-title">${post.title.rendered}</h2>
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
    } catch (error) {
        console.error('Error fetching posts:', error);
        blogContainer.innerHTML = '<p class="error">Error loading blog posts. Please try again later.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', fetchWordPressPosts);

// Scroll behavior for header
let lastScrollY = window.scrollY;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > lastScrollY) {
        header.classList.remove('header-visible');
        header.classList.add('header-hidden');
    } else {
        header.classList.remove('header-hidden');
        header.classList.add('header-visible');
    }
    
    lastScrollY = currentScrollY;
});
