async function fetchLatestPosts() {
    const loading = document.getElementById('blog-loading');
    const latestPosts = document.getElementById('latest-posts');
    
    try {
        loading.classList.remove('hidden');
        
        // Fetch only 3 latest posts
        const response = await fetch('https://cotedesvoix.com/wp/wp-json/wp/v2/posts?_embed&per_page=3');
        const posts = await response.json();
        
        const postsHTML = posts.map(post => {
            const featuredImage = post._embedded['wp:featuredmedia'] 
                ? post._embedded['wp:featuredmedia'][0].source_url 
                : 'default-image.jpg';
                
            const date = new Date(post.date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            return `
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
        }).join('');
        
        latestPosts.innerHTML = postsHTML;
    } catch (error) {
        console.error('Error fetching posts:', error);
        latestPosts.innerHTML = '<p class="error">Error loading blog posts. Please try again later.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', fetchLatestPosts); 