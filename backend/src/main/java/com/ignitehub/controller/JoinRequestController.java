package com.ignitehub.controller;

import com.ignitehub.model.JoinRequest;
import com.ignitehub.model.Project;
import com.ignitehub.model.User;
import com.ignitehub.repository.JoinRequestRepository;
import com.ignitehub.repository.ProjectRepository;
import com.ignitehub.repository.UserRepository;
import com.ignitehub.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/join-requests")
public class JoinRequestController {
    @Autowired
    JoinRequestRepository joinRequestRepository;

    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    UserRepository userRepository;

    @PostMapping("/apply/{projectId}")
    public ResponseEntity<?> applyToProject(@PathVariable Long projectId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Project project = projectRepository.findById(projectId).orElseThrow();

        // 1. Restrict owner from applying to their own project
        if (project.getOwner().getId().equals(userDetails.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error: You cannot apply to your own project!"));
        }

        // 2. Prevent duplicate applications
        List<JoinRequest> existingRequests = joinRequestRepository.findByApplicantId(userDetails.getId());
        boolean alreadyApplied = existingRequests.stream()
                .anyMatch(r -> r.getProject().getId().equals(projectId));
        
        if (alreadyApplied) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error: You have already applied to this project!"));
        }

        User applicant = userRepository.findById(userDetails.getId()).orElseThrow();

        JoinRequest request = new JoinRequest();
        request.setApplicant(applicant);
        request.setProject(project);
        request.setStatus("PENDING");

        joinRequestRepository.save(request);
        return ResponseEntity.ok(request);
    }

    @GetMapping("/my-requests")
    public List<JoinRequest> getMyRequests() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return joinRequestRepository.findByApplicantId(userDetails.getId());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getProjectRequests(@PathVariable Long projectId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Project project = projectRepository.findById(projectId).orElseThrow();
        
        if (!project.getOwner().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body("You don't own this project");
        }
        
        return ResponseEntity.ok(joinRequestRepository.findByProjectId(projectId));
    }

    @PutMapping("/{requestId}/status")
    public ResponseEntity<?> updateRequestStatus(@PathVariable Long requestId, @RequestBody java.util.Map<String, String> body) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        JoinRequest request = joinRequestRepository.findById(requestId).orElseThrow();
        
        if (!request.getProject().getOwner().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body("Unauthorized");
        }
        
        request.setStatus(body.get("status"));
        joinRequestRepository.save(request);
        return ResponseEntity.ok(request);
    }
}
