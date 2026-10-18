package com.teya1337.craigslist.user.picture;

import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfilePictureService {
    public static final long MAX_IMAGE_BYTES = 2 * 1024 * 1024;
    private final UserRepository users;
    private final ProfilePictureRepository pictures;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public PictureResponse upload(UUID userId, MultipartFile file, String currentPassword) {
        User user = verifiedUser(userId, currentPassword);
        return store(user, file);
    }

    @Transactional
    public PictureResponse store(User user, MultipartFile file) {
        UUID userId = user.getId();
        var image = com.teya1337.craigslist.common.image.ImageUpload.read(file);
        ProfilePicture picture = pictures.findById(userId).orElseGet(ProfilePicture::new);
        picture.setUser(user);
        picture.setContentType(image.contentType());
        picture.setImageData(image.data());
        pictures.save(picture);
        user.setPictureVersion(UUID.randomUUID());
        users.saveAndFlush(user);
        return new PictureResponse(user.getPictureVersion());
    }

    @Transactional
    public PictureResponse remove(UUID userId, String currentPassword) {
        User user = verifiedUser(userId, currentPassword);
        return removeStoredPicture(user);
    }

    @Transactional
    public PictureResponse removeStoredPicture(User user) {
        pictures.findById(user.getId()).ifPresent(pictures::delete);
        user.setPictureVersion(null);
        users.saveAndFlush(user);
        return new PictureResponse(null);
    }

    @Transactional(readOnly = true)
    public ProfilePicture find(UUID userId) {
        users.findById(userId).filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return pictures.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private User verifiedUser(UUID userId, String currentPassword) {
        User user = users.findById(userId).filter(candidate -> candidate.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (currentPassword == null || currentPassword.isBlank() || currentPassword.length() > 200
                || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw badRequest("Your current password is incorrect.");
        }
        return user;
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
