package com.launchpad.controller;

import com.launchpad.model.JoinRequest;
import com.launchpad.model.Project;
import com.launchpad.model.User;
import com.launchpad.repository.JoinRequestRepository;
import com.launchpad.repository.ProjectRepository;
import com.launchpad.repository.UserRepository;
import com.launchpad.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        User applicant = userRepository.findById(userDetails.getId()).orElseThrow();
        Project project = projectRepository.findById(projectId).orElseThrow();

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
