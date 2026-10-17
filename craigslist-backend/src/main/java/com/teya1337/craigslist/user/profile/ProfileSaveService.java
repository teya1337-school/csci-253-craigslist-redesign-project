package com.teya1337.craigslist.user.profile;

import com.teya1337.craigslist.account.AccountService;
import com.teya1337.craigslist.user.picture.PictureResponse;
import com.teya1337.craigslist.user.picture.ProfilePictureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileSaveService {
    private final AccountService accounts;
    private final ProfilePictureService pictures;

    @Transactional
    public PictureResponse save(UUID userId, ProfileUpdateRequest profile, MultipartFile file, boolean removePicture) {
        if (file != null && removePicture) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a replacement picture or remove it, not both.");
        }
        var user = accounts.updateProfile(userId, profile);
        if (file != null) return pictures.store(user, file);
        if (removePicture) return pictures.removeStoredPicture(user);
        return new PictureResponse(user.getPictureVersion());
    }
}
