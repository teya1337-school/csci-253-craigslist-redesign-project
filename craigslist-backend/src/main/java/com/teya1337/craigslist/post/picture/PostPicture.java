package com.teya1337.craigslist.post.picture;

import com.teya1337.craigslist.post.entity.Post;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "post_pictures")
@Getter @Setter @NoArgsConstructor
public class PostPicture {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;
    @Column(name = "display_order", nullable = false)
    private int displayOrder;
    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;
    @Column(name = "image_data", nullable = false, columnDefinition = "bytea")
    private byte[] imageData;
}
