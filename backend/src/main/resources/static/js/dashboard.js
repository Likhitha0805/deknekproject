document.addEventListener('DOMContentLoaded', async () => {
    if (!ApiService.isAuthenticated()) {
        window.location.href = 'auth.html';
        return;
    }

    const user = ApiService.getUser();
    
    // Greeting & Description configuration
    document.getElementById('user-name-display').innerText = user.name || 'User';
    const roleDesc = document.getElementById('dashboard-role-desc');
    if (roleDesc) roleDesc.innerText = 'Post projects, edit profile, and request to collaborate with others.';

    const btnCreate = document.getElementById('btn-create-project');
    if (btnCreate) btnCreate.style.display = 'inline-block';

    // Populate Profile Fields
    const profileNameInput = document.getElementById('profile-name');
    const profileSkillsInput = document.getElementById('profile-skills');
    const profileGithubInput = document.getElementById('profile-github');
    if (profileNameInput) profileNameInput.value = user.name || '';
    if (profileSkillsInput) profileSkillsInput.value = user.skills || '';
    if (profileGithubInput) profileGithubInput.value = user.githubUrl || '';

    // Profile Form Submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const updatedUser = await ApiService.request('/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: profileNameInput.value,
                        skills: profileSkillsInput.value,
                        githubUrl: profileGithubInput ? profileGithubInput.value : ''
                    })
                });
                
                // Update stored user details
                const token = localStorage.getItem('token');
                ApiService.setToken(token, {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    skills: updatedUser.skills,
                    githubUrl: updatedUser.githubUrl
                });
                
                document.getElementById('user-name-display').innerText = updatedUser.name;
                alert('Profile updated successfully!');
                
                // Reload recommended projects to align with new skills
                loadRecommendedProjects();
            } catch (err) {
                alert('Failed to update profile: ' + err.message);
            }
        });
    }

    // Load all data
    loadRecommendedProjects();
    loadApplications();
    loadNotifications();
    loadMyProjects();

    // Modal logic
    const modal = document.getElementById('create-project-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (btnCreate && modal && closeBtn) {
        btnCreate.onclick = () => {
            modal.classList.remove('hidden');
            const statusDiv = document.getElementById('github-sync-status');
            if (statusDiv) statusDiv.style.display = 'none';
        };
        closeBtn.onclick = () => modal.classList.add('hidden');
        window.onclick = (e) => { if (e.target == modal) modal.classList.add('hidden'); }
    }

    // GitHub Sync Button Event Listener
    const btnSync = document.getElementById('btn-github-sync');
    if (btnSync) {
        btnSync.addEventListener('click', async () => {
            const urlInput = document.getElementById('proj-github-sync');
            const statusDiv = document.getElementById('github-sync-status');
            if (!urlInput || !statusDiv) return;

            const url = urlInput.value.trim();
            if (!url) {
                statusDiv.style.color = 'var(--error)';
                statusDiv.innerText = 'Please enter a GitHub repository URL.';
                statusDiv.style.display = 'block';
                return;
            }

            const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
            if (!match) {
                statusDiv.style.color = 'var(--error)';
                statusDiv.innerText = 'Invalid GitHub repository URL format. Please use https://github.com/owner/repo';
                statusDiv.style.display = 'block';
                return;
            }

            const owner = match[1];
            const repo = match[2].replace(/\.git$/, '');

            statusDiv.style.color = 'var(--text-muted)';
            statusDiv.innerText = 'Syncing repository metadata from GitHub...';
            statusDiv.style.display = 'block';

            try {
                const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
                if (!repoRes.ok) {
                    throw new Error('Repository not found or public API limit exceeded.');
                }
                const repoData = await repoRes.json();

                // Auto-fill form values
                const titleInput = document.getElementById('proj-title');
                if (titleInput) {
                    titleInput.value = repoData.name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                }

                const descInput = document.getElementById('proj-desc');
                if (descInput && repoData.description) {
                    descInput.value = repoData.description;
                }

                // Fetch top programming languages
                try {
                    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
                    if (langRes.ok) {
                        const langData = await langRes.json();
                        const languages = Object.keys(langData).slice(0, 5);
                        const stackInput = document.getElementById('proj-stack');
                        if (stackInput && languages.length > 0) {
                            stackInput.value = languages.join(', ');
                        }
                    }
                } catch (langErr) {
                    console.warn('Languages fetch failed:', langErr);
                }

                statusDiv.style.color = 'var(--success)';
                statusDiv.innerText = 'Successfully synced from GitHub repo! ⚡';
            } catch (err) {
                statusDiv.style.color = 'var(--error)';
                statusDiv.innerText = 'Sync Error: ' + err.message;
            }
        });
    }

    // Create Project Form Submit
    const createProjectForm = document.getElementById('create-project-form');
    if (createProjectForm) {
        createProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await ApiService.request('/projects', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: document.getElementById('proj-title').value,
                        description: document.getElementById('proj-desc').value,
                        techStack: document.getElementById('proj-stack').value,
                        requirements: document.getElementById('proj-reqs').value,
                        commitmentLevel: document.getElementById('proj-commitment').value
                    })
                });
                alert('Project published!');
                if (modal) modal.classList.add('hidden');
                loadMyProjects();
                createProjectForm.reset();
            } catch (err) {
                alert('Error creating project: ' + err.message);
            }
        });
    }
});

// Load Projects for Creator
async function loadMyProjects() {
    const list = document.getElementById('my-projects-list');
    if (!list) return;
    try {
        const projects = await ApiService.request('/projects/my-projects');
        if (projects.length === 0) {
            list.innerHTML = '<p class="text-muted">You haven\'t created any projects yet.</p>';
            return;
        }

        list.innerHTML = projects.map(proj => `
            <div class="list-item" style="display: block; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div>
                        <h4 style="margin-bottom:0.25rem">${proj.title}</h4>
                        <p class="text-muted" style="font-size:0.8rem">Reqs: ${proj.requirements || 'None'}</p>
                    </div>
                    <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="viewApplicants(${proj.id})">View Applicants</button>
                </div>
                <div id="applicants-${proj.id}" style="display: none; background: rgba(0,0,0,0.03); padding: 0.5rem; border-radius: 8px; margin-top: 0.5rem; border: 1px solid var(--border-color)">
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="error-message">Failed to load projects: ${err.message}</p>`;
    }
}

// View Applicants for a Creator's Project
window.viewApplicants = async function(projectId) {
    const container = document.getElementById(`applicants-${projectId}`);
    if (!container) return;
    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = '<p class="text-muted" style="font-size:0.85rem">Loading applicants...</p>';
    
    try {
        const requests = await ApiService.request(`/join-requests/project/${projectId}`);
        console.log('Join requests response:', requests);
        if (requests.length === 0) {
            container.innerHTML = '<p class="text-muted" style="font-size:0.85rem">No applicants yet.</p>';
            return;
        }
        
        container.innerHTML = requests.map(req => `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding: 0.75rem 0;">
                <span style="font-size:0.9rem">
                    <strong>${req.applicant.name}</strong> <br>
                    <span style="font-size:0.8rem; color:var(--text-muted)">Email: ${req.applicant.email}</span> <br>
                    <span style="font-size:0.8rem; color:var(--primary-hover)">Skills: ${req.applicant.skills || 'None'}</span> <br>
                    Status: <strong style="color:${req.status === 'APPROVED' ? 'var(--success)' : req.status === 'REJECTED' ? 'var(--error)' : 'var(--primary)'}">${req.status === 'APPROVED' ? 'Collaboration Approved' : req.status === 'REJECTED' ? 'Collaboration Rejected' : 'Pending'}</strong>
                </span>
                ${req.status === 'PENDING' ? `
                    <div style="display:flex; flex-direction: column; gap: 0.25rem;">
                        <button style="background:var(--success); border:none; border-radius:6px; cursor:pointer; color:white; padding:0.3rem 0.6rem; font-size:0.75rem; font-weight:bold" onclick="updateStatus(${req.id}, 'APPROVED', ${projectId})">Accept</button>
                        <button style="background:var(--error); border:none; border-radius:6px; cursor:pointer; color:white; padding:0.3rem 0.6rem; font-size:0.75rem; font-weight:bold" onclick="updateStatus(${req.id}, 'REJECTED', ${projectId})">Reject</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p class="error-message" style="font-size:0.85rem">Error loading applicants.</p>';
    }
}

// Accept/Reject an applicant
window.updateStatus = async function(requestId, status, projectId) {
    try {
        await ApiService.request(`/join-requests/${requestId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        document.getElementById(`applicants-${projectId}`).style.display = 'none';
        viewApplicants(projectId);
    } catch (err) {
        alert('Error updating status: ' + err.message);
    }
}

// Load Recommended Projects for Collaborator
async function loadRecommendedProjects() {
    const list = document.getElementById('recommended-projects-list');
    if (!list) return;
    try {
        const user = ApiService.getUser();
        // Load recommended projects and user's own applications in parallel
        const [projects, apps] = await Promise.all([
            ApiService.request('/projects/recommended'),
            ApiService.request('/join-requests/my-requests')
        ]);

        const appliedProjectIds = new Set(apps.map(a => a.project.id));

        if (projects.length === 0) {
            list.innerHTML = '<p class="text-muted">No recommended projects found matching your skills. Try adding more skills to your profile!</p>';
            return;
        }

        list.innerHTML = projects.map(proj => {
            const alreadyApplied = appliedProjectIds.has(proj.id);
            return `
                <div class="list-item" style="display: block; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex-grow: 1; padding-right: 1rem;">
                            <h4 style="margin-bottom:0.25rem">${proj.title}</h4>
                            <p style="font-size:0.85rem; margin-bottom:0.5rem">${proj.description}</p>
                            <div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-bottom:0.5rem">
                                <span class="tech-badge" style="font-size:0.7rem; padding:0.2rem 0.5rem">Stack: ${proj.techStack}</span>
                                <span class="tech-badge" style="font-size:0.7rem; padding:0.2rem 0.5rem; background:rgba(16, 185, 129, 0.1); color:var(--success); border-color:rgba(16, 185, 129, 0.2)">Reqs: ${proj.requirements || 'None'}</span>
                            </div>
                            <p class="text-muted" style="font-size:0.75rem">By: ${proj.owner.name} (${proj.owner.email})</p>
                        </div>
                        <div>
                            ${alreadyApplied ? 
                                `<button class="btn-primary" disabled style="opacity: 0.5; cursor: not-allowed; padding:0.4rem 0.8rem; font-size:0.8rem">Applied</button>` :
                                `<button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem" onclick="collabWithProject(${proj.id})">Collab</button>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = `<p class="error-message">Failed to load recommended projects: ${err.message}</p>`;
    }
}

// Request to collaborate (join project)
window.collabWithProject = async function(projectId) {
    try {
        await ApiService.request(`/join-requests/apply/${projectId}`, { method: 'POST' });
        alert('Collaboration request submitted!');
        loadRecommendedProjects();
        loadApplications();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Load Collaborator's Active Applications
async function loadApplications() {
    const list = document.getElementById('my-applications-list');
    if (!list) return;
    try {
        const apps = await ApiService.request('/join-requests/my-requests');
        if (apps.length === 0) {
            list.innerHTML = '<p class="text-muted">You haven\'t applied to any projects yet.</p>';
            return;
        }

        list.innerHTML = apps.map(app => `
            <div class="list-item">
                <div>
                    <h4 style="margin-bottom:0.25rem">${app.project.title}</h4>
                    <p class="text-muted" style="font-size:0.85rem">
                        Status: <strong style="color:${app.status === 'APPROVED' ? 'var(--success)' : app.status === 'REJECTED' ? 'var(--error)' : 'var(--primary)'}">${app.status === 'APPROVED' ? 'Collaboration Approved' : app.status === 'REJECTED' ? 'Collaboration Rejected' : 'Pending'}</strong>
                    </p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="error-message">Failed to load applications</p>`;
    }
}

// Load Notifications for Collaborator
async function loadNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    try {
        const notifications = await ApiService.request('/notifications');
        if (notifications.length === 0) {
            list.innerHTML = '<p class="text-muted">No notifications.</p>';
            return;
        }

        list.innerHTML = `
            <div style="text-align: right; margin-bottom: 0.5rem;">
                <a href="#" style="font-size: 0.75rem; color: var(--primary-hover); text-decoration: none;" onclick="clearAllNotifications(event)">Clear All</a>
            </div>
            ` + notifications.map(notif => `
            <div class="list-item" style="border-left: 3px solid ${notif.read ? 'var(--border-color)' : 'var(--primary)'}; ${notif.read ? 'opacity: 0.7;' : ''}">
                <div style="flex-grow: 1;">
                    <p style="font-size: 0.85rem; margin-bottom: 0.25rem;">${notif.message}</p>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${new Date(notif.createdAt).toLocaleString()}</span>
                </div>
                ${!notif.read ? `
                    <button class="btn-secondary" style="padding: 0.2rem 0.4rem; font-size: 0.7rem;" onclick="markNotificationAsRead(${notif.id})">Read</button>
                ` : ''}
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="error-message">Failed to load notifications</p>`;
    }
}

window.markNotificationAsRead = async function(id) {
    try {
        await ApiService.request(`/notifications/${id}/read`, { method: 'PUT' });
        loadNotifications();
    } catch (err) {
        console.error(err);
    }
}

window.clearAllNotifications = async function(e) {
    e.preventDefault();
    try {
        await ApiService.request('/notifications/clear', { method: 'DELETE' });
        loadNotifications();
    } catch (err) {
        console.error(err);
    }
}
