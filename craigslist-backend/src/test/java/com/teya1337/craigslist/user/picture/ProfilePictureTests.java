package com.teya1337.craigslist.user.picture;

import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProfilePictureTests {
    private final UserRepository users = mock(UserRepository.class);
    private final ProfilePictureRepository pictures = mock(ProfilePictureRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final ProfilePictureService service = new ProfilePictureService(users, pictures, encoder);
    private final User user = User.builder().id(UUID.randomUUID()).username("test-user").password(encoder.encode("test-password")).build();

    private byte[] image(String format, int width, int height) throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), format, output);
        return output.toByteArray();
    }

    @Test void storesOriginalBytesDetectsFormatAndChangesVersionOnReplacement() throws Exception {
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        var existing = new ProfilePicture();
        existing.setUser(user);
        when(pictures.findById(user.getId())).thenReturn(Optional.of(existing));
        for (String format : new String[] { "png", "jpeg" }) {
            byte[] bytes = image(format, 20, 20);
            UUID previous = user.getPictureVersion();
            var result = service.upload(user.getId(), new MockMultipartFile("file", "misleading.txt", "text/plain", bytes), "test-password");
            assertThat(result.pictureVersion()).isNotNull().isNotEqualTo(previous);
            assertThat(existing.getImageData()).isEqualTo(bytes);
            assertThat(existing.getContentType()).isEqualTo(format.equals("png") ? "image/png" : "image/jpeg");
        }
    }

    @Test void rejectsBadPasswordFakeImagesUnsupportedFormatsAndOversizedFiles() throws Exception {
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        var valid = new MockMultipartFile("file", image("png", 20, 20));
        assertThatThrownBy(() -> service.upload(user.getId(), valid, "wrong")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.upload(user.getId(), new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes()), "test-password")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.upload(user.getId(), new MockMultipartFile("file", image("gif", 20, 20)), "test-password")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.upload(user.getId(), new MockMultipartFile("file", new byte[2 * 1024 * 1024 + 1]), "test-password")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.upload(user.getId(), new MockMultipartFile("file", image("png", 4097, 1)), "test-password")).isInstanceOf(ResponseStatusException.class);
        verify(pictures, never()).save(any());
        verify(users, never()).saveAndFlush(any());
    }

    @Test void removeRequiresPasswordAndClearsVersionAndStoredBytes() {
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        var picture = new ProfilePicture();
        when(pictures.findById(user.getId())).thenReturn(Optional.of(picture));
        user.setPictureVersion(UUID.randomUUID());
        assertThatThrownBy(() -> service.remove(user.getId(), "wrong")).isInstanceOf(ResponseStatusException.class);
        verify(pictures, never()).delete(any());
        assertThat(service.remove(user.getId(), "test-password").pictureVersion()).isNull();
        assertThat(user.getPictureVersion()).isNull();
        verify(pictures).delete(picture);
    }

    @Test void deletedUsersPicturesAreNotPublicAndCannotBeChanged() {
        user.setStatus(UserStatus.DELETED);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> service.find(user.getId())).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.remove(user.getId(), "test-password")).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(pictures);
    }
}
