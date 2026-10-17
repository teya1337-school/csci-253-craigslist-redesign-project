package com.teya1337.craigslist.auth.service;

import com.teya1337.craigslist.auth.dto.SignupRequest;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class SignupService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void signup(SignupRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The passwords do not match.");
        }
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your password is too long. Use fewer characters.");
        }
        String username = request.username().strip();
        String privateEmail = request.privateEmail().strip();
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already in use.");
        }
        if (users.existsByPrivateEmailIgnoreCase(privateEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That email is already in use.");
        }
        users.saveAndFlush(User.builder().username(username).privateEmail(privateEmail)
                .password(passwordEncoder.encode(request.password()))
                .privatePhoneNumber("").address("").build());
    }
}
