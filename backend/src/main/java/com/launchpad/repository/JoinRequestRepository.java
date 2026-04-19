package com.launchpad.repository;

import com.launchpad.model.JoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    List<JoinRequest> findByProjectId(Long projectId);
    List<JoinRequest> findByApplicantId(Long applicantId);
}
