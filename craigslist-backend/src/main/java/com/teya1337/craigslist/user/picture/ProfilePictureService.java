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

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Locale;
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
        if (file.isEmpty() || file.getSize() > MAX_IMAGE_BYTES) {
            throw badRequest("Choose a JPEG or PNG image up to 2 MB.");
        }
        byte[] imageData;
        String contentType;
        try {
            imageData = file.getBytes();
            if (imageData.length > MAX_IMAGE_BYTES) throw badRequest("Choose an image up to 2 MB.");
            contentType = validateImage(imageData);
        } catch (IOException exception) {
            throw badRequest("We could not read that image. Choose a valid JPEG or PNG.");
        }
        ProfilePicture picture = pictures.findById(userId).orElseGet(ProfilePicture::new);
        picture.setUser(user);
        picture.setContentType(contentType);
        picture.setImageData(imageData);
        pictures.save(picture);
        user.setPictureVersion(UUID.randomUUID());
        users.saveAndFlush(user);
        return new PictureResponse(user.getPictureVersion());
    }

    private String validateImage(byte[] imageData) throws IOException {
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(imageData))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw badRequest("Choose a valid JPEG or PNG image.");
            var reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!format.equals("jpeg") && !format.equals("png")) throw badRequest("Choose a JPEG or PNG image.");
                reader.setInput(input);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > 4096 || height > 4096) {
                    throw badRequest("Choose an image no larger than 4096 × 4096 pixels.");
                }
                if (reader.read(0) == null) throw badRequest("Choose a valid JPEG or PNG image.");
                return format.equals("png") ? "image/png" : "image/jpeg";
            } finally {
                reader.dispose();
            }
        }
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
