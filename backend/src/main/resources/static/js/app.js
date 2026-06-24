let allProjects = [];
let activeTag = 'all';
let searchQuery = '';

// Derive an "activity pulse" label from project creation date
function getPulseBadge(project) {
    if (!project.createdAt) return '<span class="pulse-badge pulse-active">⚡ Active</span>';
    const days = Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7)  return '<span class="pulse-badge pulse-new">🟢 New</span>';
    if (days <= 30) return '<span class="pulse-badge pulse-active">⚡ Active</span>';
    return '<span class="pulse-badge pulse-established">🏛️ Established</span>';
}

function getCommitmentLabel(level) {
    const map = {
        'Casual': '🌱 Casual',
        'Part-time': '⚡ Part-time',
        'Full-time': '🚀 Full-time'
    };
    return map[level] || level || 'Flexible';
}

// Compute Match Score based on profile skills compatibility
function getCompatibilityScoreBadge(project) {
    const user = ApiService.getUser();
    if (!user || !user.skills) return '';

    const userSkills = user.skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (userSkills.length === 0) return '';

    const combinedProjSkills = [
        ...(project.techStack || '').split(','),
        ...(project.requirements || '').split(',')
    ].map(s => s.trim().toLowerCase()).filter(Boolean);

    if (combinedProjSkills.length === 0) return '';

    let matchCount = 0;
    userSkills.forEach(skill => {
        if (combinedProjSkills.some(ps => ps.includes(skill) || skill.includes(ps))) {
            matchCount++;
        }
    });

    const score = Math.round((matchCount / Math.max(combinedProjSkills.length, 1)) * 100);
    if (score === 0) return '';

    const isHigh = score >= 50;
    const badgeClass = isHigh ? 'match-badge match-high' : 'match-badge';
    return `<span class="${badgeClass}">🎯 ${score}% Match</span>`;
}

// Sleek Custom Toast alert
function showToast(message) {
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// Clipboard copying for shareable links
window.shareProject = function(projectId, event) {
    if (event) event.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?project=${projectId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Direct link copied to clipboard! Share it with developers!');
    }).catch(err => {
        console.error('Copy to clipboard failed:', err);
    });
};

function renderProjects(projects, appliedProjectIds) {
    const container = document.getElementById('projects-container');
    const countBadge = document.getElementById('project-count');
    if (!container) return;

    // Apply tag filter
    let filtered = projects;
    if (activeTag !== 'all') {
        filtered = projects.filter(p =>
            p.techStack && p.techStack.toLowerCase().includes(activeTag.toLowerCase())
        );
    }

    // Apply search filter
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.techStack && p.techStack.toLowerCase().includes(q))
        );
    }

    if (countBadge) countBadge.textContent = `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <h3 style="margin-bottom: 0.5rem; color: var(--text-main)">No projects found</h3>
                <p>Try a different filter or search term.</p>
            </div>`;
        return;
    }

    const user = ApiService.getUser();

    container.innerHTML = filtered.map(project => {
        let buttonHtml = '';
        if (ApiService.isAuthenticated()) {
            const alreadyApplied = appliedProjectIds.has(project.id);
            if (user?.id === project.owner.id) {
                buttonHtml = `<button class="btn-secondary w-100" disabled style="opacity: 0.5; cursor: not-allowed">Your Project</button>`;
            } else if (alreadyApplied) {
                buttonHtml = `<button class="btn-primary w-100" disabled style="opacity: 0.6; cursor: not-allowed">✅ Applied</button>`;
            } else {
                buttonHtml = `<button class="btn-primary w-100 glow-effect" onclick="applyToProject(${project.id})">Request to Join →</button>`;
            }
        } else {
            buttonHtml = `<p style="font-size:0.85rem; text-align:center; color:var(--text-muted)"><a href="auth.html" style="color:var(--primary); font-weight:600">Sign in</a> to apply</p>`;
        }

        const techTags = (project.techStack || '').split(',').map(t =>
            `<span class="tech-badge">${t.trim()}</span>`
        ).join('');

        const ownerGithub = project.owner.githubUrl
            ? `<a href="${project.owner.githubUrl}" target="_blank" class="github-link">⚡ GitHub</a>`
            : '';

        return `
            <div class="project-card glass-panel" id="project-card-${project.id}">
                <div class="project-card-header">
                    <h3 class="project-title">${project.title}</h3>
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                        ${getCompatibilityScoreBadge(project)}
                        ${getPulseBadge(project)}
                    </div>
                </div>

                <p class="project-owner">
                    👤 ${project.owner.name}
                    ${ownerGithub}
                </p>

                <p class="project-desc">${project.description}</p>

                <div class="tech-stack">${techTags}</div>

                <div class="project-meta" style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="commitment-badge">🕐 ${getCommitmentLabel(project.commitmentLevel)}</span>
                    <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 8px;" onclick="shareProject(${project.id}, event)">🔗 Share</button>
                </div>

                ${project.requirements ? `
                <div class="project-reqs">
                    <strong>Looking for:</strong> ${project.requirements}
                </div>` : ''}

                ${buttonHtml}
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) return;

    let appliedProjectIds = new Set();
    try {
        if (ApiService.isAuthenticated()) {
            const apps = await ApiService.request('/join-requests/my-requests');
            appliedProjectIds = new Set(apps.map(a => a.project.id));
        }
        allProjects = await ApiService.request('/projects');
        renderProjects(allProjects, appliedProjectIds);

        // Highlight/scroll to project deep link if parameter exists
        const urlParams = new URLSearchParams(window.location.search);
        const targetProjectId = urlParams.get('project');
        if (targetProjectId) {
            setTimeout(() => {
                const targetCard = document.getElementById(`project-card-${targetProjectId}`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('highlighted');
                }
            }, 300);
        }
    } catch (err) {
        projectsContainer.innerHTML = `<p class="error-message">Failed to load projects: ${err.message}</p>`;
    }

    // Filter tag clicks
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTag = btn.dataset.tag;
            renderProjects(allProjects, appliedProjectIds);
        });
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProjects(allProjects, appliedProjectIds);
        });
    }
});

window.applyToProject = async function(projectId) {
    try {
        await ApiService.request(`/join-requests/apply/${projectId}`, { method: 'POST' });
        alert('🎉 Application submitted successfully!');
        location.reload();
    } catch (err) {
        alert('Error applying to project: ' + err.message);
    }
}
