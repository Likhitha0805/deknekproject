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
