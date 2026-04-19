document.addEventListener('DOMContentLoaded', async () => {
    if (!ApiService.isAuthenticated()) {
        window.location.href = 'auth.html';
        return;
    }

    const user = ApiService.getUser();

    // Modal logic
    const modal = document.getElementById('create-project-modal');
    const btnCreate = document.getElementById('btn-create-project');
    const closeBtn = document.querySelector('.close-modal');

    btnCreate.onclick = () => modal.classList.remove('hidden');
    closeBtn.onclick = () => modal.classList.add('hidden');
    window.onclick = (e) => { if (e.target == modal) modal.classList.add('hidden'); }

    // Load Applications and Projects
    loadApplications();
    loadMyProjects();

    // Create Project Form
    document.getElementById('create-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await ApiService.request('/projects', {
                method: 'POST',
                body: JSON.stringify({
                    title: document.getElementById('proj-title').value,
                    description: document.getElementById('proj-desc').value,
                    techStack: document.getElementById('proj-stack').value
                })
            });
            alert('Project published!');
            modal.classList.add('hidden');
            window.location.href = 'index.html'; // Go to discover page to see it
        } catch (err) {
            alert('Error creating project: ' + err.message);
        }
    });
});

async function loadApplications() {
    const list = document.getElementById('my-applications-list');
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
                    <p class="text-muted" style="font-size:0.85rem">Status: <strong>${app.status}</strong></p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="error-message">Failed to load applications</p>`;
    }
}

async function loadMyProjects() {
    const list = document.getElementById('my-projects-list');
    try {
        const projects = await ApiService.request('/projects/my-projects');
        if (projects.length === 0) {
            list.innerHTML = '<p class="text-muted">You haven\'t created any projects yet.</p>';
            return;
        }

        list.innerHTML = projects.map(proj => `
            <div class="list-item" style="display: block;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="margin-bottom:0">${proj.title}</h4>
                    <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="viewApplicants(${proj.id})">View Applicants</button>
                </div>
                <div id="applicants-${proj.id}" style="display: none; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem;">
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="error-message">Failed to load projects</p>`;
    }
}

window.viewApplicants = async function(projectId) {
    const container = document.getElementById(`applicants-${projectId}`);
    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = '<p class="text-muted" style="font-size:0.85rem">Loading applicants...</p>';
    
    try {
        const requests = await ApiService.request(`/join-requests/project/${projectId}`);
        if (requests.length === 0) {
            container.innerHTML = '<p class="text-muted" style="font-size:0.85rem">No applicants yet.</p>';
            return;
        }
        
        container.innerHTML = requests.map(req => `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding: 0.5rem 0;">
                <span style="font-size:0.9rem">${req.applicant.name} <br> <span style="font-size:0.75rem; color:var(--text-muted)">(${req.applicant.email})</span> <br> <strong>${req.status}</strong></span>
                ${req.status === 'PENDING' ? `
                    <div style="display:flex; flex-direction: column; gap: 0.25rem;">
                        <button style="background:var(--primary); border:none; border-radius:4px; cursor:pointer; color:white; padding:0.2rem 0.5rem; font-size:0.7rem" onclick="updateStatus(${req.id}, 'APPROVED', ${projectId})">Accept</button>
                        <button style="background:var(--error); border:none; border-radius:4px; cursor:pointer; color:white; padding:0.2rem 0.5rem; font-size:0.7rem" onclick="updateStatus(${req.id}, 'REJECTED', ${projectId})">Reject</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p class="error-message" style="font-size:0.85rem">Error loading applicants.</p>';
    }
}

window.updateStatus = async function(requestId, status, projectId) {
    try {
        await ApiService.request(`/join-requests/${requestId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        document.getElementById(`applicants-${projectId}`).style.display = 'none';
        viewApplicants(projectId);
    } catch (err) {
        alert('Error: ' + err.message);
    }
}
