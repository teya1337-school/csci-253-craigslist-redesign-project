package com.teya1337.craigslist.post.picture;

import com.teya1337.craigslist.post.entity.*;
import com.teya1337.craigslist.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PostPictureTests {
    private final PostPictureRepository pictures = mock(PostPictureRepository.class);
    private final PostPictureService service = new PostPictureService(pictures);
    private final UUID ownerId = UUID.randomUUID();
    private final Post post = Post.builder().id(UUID.randomUUID()).user(User.builder().id(ownerId).build()).build();
    private MockMultipartFile image() throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB), "png", bytes);
        return new MockMultipartFile("files", "picture.png", "image/png", bytes.toByteArray());
    }
    @Test void savesOriginalBytesAndOrdersNewPictures() throws Exception {
        when(pictures.findPictureIds(post.getId())).thenReturn(List.of());
        var file = image();
        assertThat(service.update(post, List.of(file, file), List.of())).isTrue();
        var capture = org.mockito.ArgumentCaptor.forClass(PostPicture.class);
        verify(pictures, times(2)).save(capture.capture());
        assertThat(capture.getAllValues()).extracting(PostPicture::getDisplayOrder).containsExactly(0, 1);
        assertThat(capture.getValue().getImageData()).isEqualTo(file.getBytes());
        assertThat(capture.getValue().getContentType()).isEqualTo("image/png");
    }
    @Test void rejectsTooManyPicturesForeignRemovalsAndInvalidImagesBeforeWriting() throws Exception {
        when(pictures.findPictureIds(post.getId())).thenReturn(List.of());
        var file = image();
        assertThatThrownBy(() -> service.update(post, Collections.nCopies(6, file), List.of())).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.update(post, List.of(), List.of(UUID.randomUUID()))).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.update(post, List.of(file, new MockMultipartFile("files", "invalid".getBytes())), List.of())).isInstanceOf(ResponseStatusException.class);
        verify(pictures, never()).save(any());
        verify(pictures, never()).deleteAllById(any());
    }
    @Test void removalUsesOnlyPicturesBelongingToThePostAndLeavesNoGap() throws Exception {
        UUID removedId = UUID.randomUUID(), retainedId = UUID.randomUUID();
        var retained = new PostPicture();
        retained.setPost(post); retained.setDisplayOrder(1);
        when(pictures.findPictureIds(post.getId())).thenReturn(List.of(removedId, retainedId));
        when(pictures.findById(retainedId)).thenReturn(Optional.of(retained));
        service.update(post, List.of(image()), List.of(removedId));
        verify(pictures).deleteAllById(Set.of(removedId));
        assertThat(retained.getDisplayOrder()).isZero();
        verify(pictures).save(argThat(picture -> picture.getDisplayOrder() == 1));
    }
    @Test void imageUrlsEnforcePostVisibilityAndCorrectPostId() {
        UUID pictureId = UUID.randomUUID();
        var picture = new PostPicture(); picture.setPost(post);
        when(pictures.findById(pictureId)).thenReturn(Optional.of(picture));
        assertThat(service.find(post.getId(), pictureId, null)).isSameAs(picture);
        assertThatThrownBy(() -> service.find(UUID.randomUUID(), pictureId, ownerId)).isInstanceOf(ResponseStatusException.class);
        post.setStatus(PostStatus.UNPUBLISHED);
        assertThat(service.find(post.getId(), pictureId, ownerId)).isSameAs(picture);
        assertThatThrownBy(() -> service.find(post.getId(), pictureId, null)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.find(post.getId(), pictureId, UUID.randomUUID())).isInstanceOf(ResponseStatusException.class);
        post.setStatus(PostStatus.DELETED);
        assertThatThrownBy(() -> service.find(post.getId(), pictureId, ownerId)).isInstanceOf(ResponseStatusException.class);
    }
}
