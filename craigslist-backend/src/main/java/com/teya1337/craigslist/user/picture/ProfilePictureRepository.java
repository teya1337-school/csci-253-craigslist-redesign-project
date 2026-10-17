package com.teya1337.craigslist.user.picture;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ProfilePictureRepository extends JpaRepository<ProfilePicture, UUID> {}
