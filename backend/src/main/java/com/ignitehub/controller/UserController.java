package com.ignitehub.controller;

import com.ignitehub.model.User;
import com.ignitehub.repository.UserRepository;
import com.ignitehub.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> profileData) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        if (profileData.containsKey("name")) {
            user.setName(profileData.get("name"));
        }
        if (profileData.containsKey("skills")) {
            user.setSkills(profileData.get("skills"));
        }
        if (profileData.containsKey("githubUrl")) {
            user.setGithubUrl(profileData.get("githubUrl"));
        }

        userRepository.save(user);

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("skills", user.getSkills() != null ? user.getSkills() : "");
        response.put("githubUrl", user.getGithubUrl() != null ? user.getGithubUrl() : "");
        return ResponseEntity.ok(response);
    }
}
