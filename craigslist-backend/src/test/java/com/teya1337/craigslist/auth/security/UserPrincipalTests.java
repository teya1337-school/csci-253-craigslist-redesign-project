package com.teya1337.craigslist.auth.security;

import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.entity.UserStatus;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserPrincipalTests {

    @Test
    void eraseCredentialsRemovesPasswordFromSessionPrincipal() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("alice@example.test")
                .username("alice")
                .password("stored-hash")
                .phoneNumber("5595550101")
                .address("1000 A Street, Fresno, CA 93722")
                .status(UserStatus.ACTIVE)
                .build();

        UserPrincipal principal = UserPrincipal.from(user);
        principal.eraseCredentials();

        assertThat(principal.getPassword()).isNull();
    }
}
