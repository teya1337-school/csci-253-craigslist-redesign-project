package com.teya1337.craigslist.user.repository;

import com.teya1337.craigslist.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByUsernameIgnoreCaseAndIdNot(String username, UUID userId);

    boolean existsByPrivateEmailIgnoreCaseAndIdNot(String privateEmail, UUID userId);

    Optional<User> findByUsername(String username);
}
