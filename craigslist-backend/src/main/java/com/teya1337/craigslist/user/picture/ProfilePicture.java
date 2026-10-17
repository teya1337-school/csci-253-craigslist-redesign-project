package com.teya1337.craigslist.user.picture;

import com.teya1337.craigslist.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "profile_pictures")
@Getter
@Setter
@NoArgsConstructor
public class ProfilePicture {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    @Column(name = "image_data", nullable = false, columnDefinition = "bytea")
    private byte[] imageData;
}
