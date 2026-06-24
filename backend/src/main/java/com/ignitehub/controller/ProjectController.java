package com.ignitehub.controller;

import com.ignitehub.model.Project;
import com.ignitehub.model.User;
import com.ignitehub.repository.ProjectRepository;
import com.ignitehub.repository.UserRepository;
import com.ignitehub.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @GetMapping("/recommended")
    public List<Project> getRecommendedProjects() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        String skillsStr = user.getSkills();
        
        List<Project> allProjects = projectRepository.findAll();
        if (skillsStr == null || skillsStr.trim().isEmpty()) {
            return allProjects;
        }

        // Parse user skills
        String[] userSkills = skillsStr.split(",");
        for (int i = 0; i < userSkills.length; i++) {
            userSkills[i] = userSkills[i].trim().toLowerCase();
        }

        // Filter projects: return projects where requirements are empty or there is a matching skill
        return allProjects.stream().filter(project -> {
            // Creators shouldn't see their own projects in the recommendations
            if (project.getOwner().getId().equals(user.getId())) {
                return false;
            }
            String reqs = project.getRequirements();
            if (reqs == null || reqs.trim().isEmpty()) {
                return true; // No special requirements
            }
            String reqsLower = reqs.toLowerCase();
            for (String skill : userSkills) {
                if (!skill.isEmpty() && reqsLower.contains(skill)) {
                    return true;
                }
            }
            return false;
        }).collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/my-projects")
    public List<Project> getMyProjects() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return projectRepository.findByOwnerId(userDetails.getId());
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Project project) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User owner = userRepository.findById(userDetails.getId()).orElseThrow();
        
        project.setOwner(owner);
        Project savedProject = projectRepository.save(project);
        
        return ResponseEntity.ok(savedProject);
    }
}
