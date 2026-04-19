document.addEventListener('DOMContentLoaded', async () => {
    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) return;

    try {
        const projects = await ApiService.request('/projects');
        if (projects.length === 0) {
            projectsContainer.innerHTML = '<p class="text-muted">No projects found. Be the first to create one!</p>';
            return;
        }

        projectsContainer.innerHTML = projects.map(project => `
            <div class="project-card glass-panel">
                <h3 class="project-title">${project.title}</h3>
                <p class="text-muted" style="font-size:0.85rem; margin-bottom: 0.5rem">By: ${project.owner.name}</p>
                <p class="project-desc">${project.description}</p>
                <div class="tech-stack">
                    ${project.techStack.split(',').map(tech => `<span class="tech-badge">${tech.trim()}</span>`).join('')}
                </div>
                ${ApiService.isAuthenticated() ? 
                    `<button class="btn-primary w-100" onclick="applyToProject(${project.id})">Request to Join</button>` : 
                    `<p class="text-muted" style="font-size:0.85rem"><a href="auth.html" style="color:var(--primary)">Sign in</a> to apply</p>`
                }
            </div>
        `).join('');

    } catch (err) {
        projectsContainer.innerHTML = `<p class="error-message">Failed to load projects: ${err.message}</p>`;
    }
});

window.applyToProject = async function(projectId) {
    try {
        await ApiService.request(`/join-requests/apply/${projectId}`, { method: 'POST' });
        alert('Application submitted successfully!');
    } catch (err) {
        alert('Error applying to project: ' + err.message);
    }
}
