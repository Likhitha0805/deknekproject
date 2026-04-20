package com.ignitehub.controller;

import com.ignitehub.model.User;
import com.ignitehub.repository.UserRepository;
import com.ignitehub.security.jwt.JwtUtils;
import com.ignitehub.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.get("email"), loginRequest.get("password")));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("id", userDetails.getId());
        response.put("email", userDetails.getEmail());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.get("email"))) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "Error: Email is already in use!"));
        }

        User user = new User(signUpRequest.get("name"), 
                             signUpRequest.get("email"),
                             encoder.encode(signUpRequest.get("password")));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered successfully!"));
    }
}
