package com.teya1337.craigslist.auth.dto;

/**
 * CsrfTokenResponse
 *
 * @author teya1337
 * @since 10/12/26
 */
public record CsrfTokenResponse(
        String headerName,
        String parameterName,
        String token
) {}
