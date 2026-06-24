package com.ignitehub.controller;

import com.ignitehub.model.Notification;
import com.ignitehub.model.User;
import com.ignitehub.repository.NotificationRepository;
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
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping
    public List<Notification> getMyNotifications() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userDetails.getId());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Notification notification = notificationRepository.findById(id).orElseThrow();

        if (!notification.getRecipient().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok(notification);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearAll() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userDetails.getId());
        notificationRepository.deleteAll(notifications);
        return ResponseEntity.ok(Map.of("message", "Notifications cleared successfully"));
    }
}
