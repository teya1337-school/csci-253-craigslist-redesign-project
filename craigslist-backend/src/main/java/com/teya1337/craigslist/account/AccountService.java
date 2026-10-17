package com.teya1337.craigslist.account;

import com.teya1337.craigslist.auth.security.UserPrincipal;
import com.teya1337.craigslist.user.profile.ProfileUpdateRequest;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.repository.UserRepository;
import com.teya1337.craigslist.user.picture.ProfilePictureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProfilePictureRepository profilePictureRepository;

    @Transactional
    public UserPrincipal updateAccount(UUID userId, AccountRequest request) {
        User user = findActiveUser(userId);
        verifyCurrentPassword(user, request.currentPassword());
        String username = request.username().strip();
        String privateEmail = request.privateEmail().strip();
        if (userRepository.existsByUsernameIgnoreCaseAndIdNot(username, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already in use.");
        }
        if (userRepository.existsByPrivateEmailIgnoreCaseAndIdNot(privateEmail, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That email is already in use.");
        }
        user.setUsername(username);
        user.setPrivateEmail(privateEmail);
        userRepository.saveAndFlush(user);
        return principalWithoutPassword(user);
    }

    @Transactional
    public UserPrincipal changePassword(UUID userId, PasswordChangeRequest request) {
        User user = findActiveUser(userId);
        verifyCurrentPassword(user, request.currentPassword());
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The new passwords do not match.");
        }
        if (request.newPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a new password of 72 UTF-8 bytes or fewer.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a password different from your current password.");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.saveAndFlush(user);
        return principalWithoutPassword(user);
    }

    @Transactional
    public void deleteAccount(UUID userId, DeleteAccountRequest request) {
        User user = findActiveUser(userId);
        verifyCurrentPassword(user, request.currentPassword());
        if (!request.confirmed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirm that you want to delete your account.");
        }
        user.setStatus(UserStatus.DELETED);
        user.setUsername("deleted:" + userId);
        user.setPrivateEmail("deleted-" + userId + "@deleted.invalid");
        user.setPassword("");
        user.setPrivatePhoneNumber("");
        user.setAddress("");
        user.setBio(null);
        user.setPublicEmail(null);
        user.setPublicPhoneNumber(null);
        user.setPictureVersion(null);
        profilePictureRepository.deleteById(userId);
        userRepository.saveAndFlush(user);
    }

    @Transactional
    public User updateProfile(UUID userId, ProfileUpdateRequest request) {
        User user = findActiveUser(userId);
        verifyCurrentPassword(user, request.currentPassword());
        user.setBio(optionalText(request.bio()));
        user.setPublicEmail(optionalText(request.publicEmail()));
        user.setPublicPhoneNumber(optionalText(request.publicPhoneNumber()));
        userRepository.saveAndFlush(user);
        return user;
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private void verifyCurrentPassword(User user, String currentPassword) {
        if (currentPassword == null || currentPassword.isBlank()
                || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your current password is incorrect.");
        }
    }

    private User findActiveUser(UUID userId) {
        return userRepository.findById(userId)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private UserPrincipal principalWithoutPassword(User user) {
        UserPrincipal principal = UserPrincipal.from(user);
        principal.eraseCredentials();
        return principal;
    }
}
