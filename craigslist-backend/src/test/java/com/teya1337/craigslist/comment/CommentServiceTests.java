package com.teya1337.craigslist.comment;

import com.teya1337.craigslist.comment.dto.CommentRequest;
import com.teya1337.craigslist.comment.entity.Comment;
import com.teya1337.craigslist.comment.repository.CommentRepository;
import com.teya1337.craigslist.common.error.ForbiddenOperationException;
import com.teya1337.craigslist.common.error.ResourceNotFoundException;
import com.teya1337.craigslist.post.entity.Post;
import com.teya1337.craigslist.post.entity.PostStatus;
import com.teya1337.craigslist.post.repository.PostRepository;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class CommentServiceTests {
    private final CommentRepository comments = mock(CommentRepository.class);
    private final PostRepository posts = mock(PostRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final CommentService service = new CommentService(comments, posts, users);
    private final UUID userId = UUID.randomUUID();
    private final UUID postId = UUID.randomUUID();
    private final User user = User.builder().id(userId).username("alice").build();
    private final Post post = Post.builder().id(postId).status(PostStatus.PUBLISHED).build();

    private Comment parent() {
        Comment parent = Comment.builder().id(UUID.randomUUID()).user(user).post(post).content("Parent").build();
        when(comments.findById(parent.getId())).thenReturn(Optional.of(parent));
        when(posts.findByIdAndStatus(postId, PostStatus.PUBLISHED)).thenReturn(Optional.of(post));
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(comments.save(any(Comment.class))).thenAnswer(call -> call.getArgument(0));
        return parent;
    }

    @Test void createsRepliesAndRepliesToReplies() {
        Comment parent = parent();
        parent.setParent(Comment.builder().id(UUID.randomUUID()).build());
        var reply = service.createComment(userId, postId, new CommentRequest(" Reply ", parent.getId()));
        assertThat(reply.parentId()).isEqualTo(parent.getId());
        assertThat(reply.content()).isEqualTo("Reply");
    }

    @Test void rejectsParentFromAnotherPost() {
        Comment parent = parent();
        parent.setPost(Post.builder().id(UUID.randomUUID()).build());
        assertThatThrownBy(() -> service.createComment(userId, postId, new CommentRequest("Reply", parent.getId())))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(comments, never()).save(any());
    }

    @Test void rejectsReplyToDeletedComment() {
        Comment parent = parent();
        parent.setDeleted(true);
        assertThatThrownBy(() -> service.createComment(userId, postId, new CommentRequest("Reply", parent.getId())))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test void deletionPreservesThreadAndHidesContent() {
        Comment parent = parent();
        service.deleteComment(userId, postId, parent.getId());
        assertThat(parent.isDeleted()).isTrue();
        assertThat(parent.getContent()).isEmpty();
        verify(comments, never()).delete(any());
        when(comments.findAllByPostId(postId)).thenReturn(java.util.List.of(parent));
        var result = service.findComments(postId).getFirst();
        assertThat(result.content()).isEqualTo("Comment deleted");
        assertThat(result.userId()).isNull();
    }

    @Test void postAuthorCannotDeleteAnotherUsersReply() {
        Comment parent = parent();
        UUID postAuthor = UUID.randomUUID();
        post.setUser(User.builder().id(postAuthor).build());
        assertThatThrownBy(() -> service.deleteComment(postAuthor, postId, parent.getId()))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThat(parent.isDeleted()).isFalse();
    }

    @Test void newCommentHasNoEditDate() {
        parent();
        var result = service.createComment(userId, postId, new CommentRequest("New comment", null));
        assertThat(result.editedAt()).isNull();
    }

    @Test void unchangedCommentDoesNotBecomeEdited() {
        Comment comment = parent();
        var result = service.updateComment(userId, postId, comment.getId(), new CommentRequest(" Parent ", null));
        assertThat(result.editedAt()).isNull();
        verify(comments, never()).saveAndFlush(any());
    }

    @Test void changedCommentRecordsEditAndUnchangedSavePreservesIt() {
        Comment comment = parent();
        when(comments.saveAndFlush(any(Comment.class))).thenAnswer(call -> call.getArgument(0));
        var edited = service.updateComment(userId, postId, comment.getId(), new CommentRequest("Changed", null));
        assertThat(edited.editedAt()).isNotNull();
        var unchanged = service.updateComment(userId, postId, comment.getId(), new CommentRequest("Changed", null));
        assertThat(unchanged.editedAt()).isEqualTo(edited.editedAt());
        service.deleteComment(userId, postId, comment.getId());
        when(comments.findAllByPostId(postId)).thenReturn(java.util.List.of(comment));
        assertThat(service.findComments(postId).getFirst().editedAt()).isNull();
    }
}
