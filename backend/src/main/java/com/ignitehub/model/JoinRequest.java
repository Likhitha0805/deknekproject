package com.ignitehub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "join_requests")
public class JoinRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    public JoinRequest() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public User getApplicant() { return applicant; }
    public void setApplicant(User applicant) { this.applicant = applicant; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
