package com.teya1337.craigslist.auth.security;

import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.entity.UserStatus;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@ToString(exclude = "password")
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UserPrincipal implements UserDetails, CredentialsContainer {

    @Serial
    private static final long serialVersionUID = 1L;

    public static UserPrincipal from(User user) {
        return UserPrincipal.builder()
                .userId(user.getId())
                .pictureVersion(user.getPictureVersion())
                .privateEmail(user.getPrivateEmail())
                .username(user.getUsername())
                .password(user.getPassword())
                .privatePhoneNumber(user.getPrivatePhoneNumber())
                .address(user.getAddress())
                .status(user.getStatus())
                .build();
    }

    private final UUID userId;
    private final UUID pictureVersion;
    private final String privateEmail;
    private final String username;
    private String password;
    private final String privatePhoneNumber;
    private final String address;
    private final UserStatus status;

    @Override
    public @NonNull Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    // From CredentialsContainer interface
    // This method is called to remove sensitive data from the object after authentication is complete
    // In this case, it sets the password field to null to prevent it from being stored in the security context
    // the ProviderManager calls this after successful authentication
    @Override
    public void eraseCredentials() {
        password = null;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }
        if (!(object instanceof UserPrincipal that)) {
            return false;
        }
        return userId != null && userId.equals(that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(userId);
    }
}
