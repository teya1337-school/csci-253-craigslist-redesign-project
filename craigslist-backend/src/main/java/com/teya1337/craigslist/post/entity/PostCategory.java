package com.teya1337.craigslist.post.entity;

public enum PostCategory {
    COMMUNITY,
    SERVICES,
    FOR_SALE,
    HOUSING,
    JOBS,
    GIGS;

    public boolean supports(PostType postType) {
        return switch (this) {
            case COMMUNITY -> postType == PostType.GENERAL || postType == PostType.EVENTS
                    || postType == PostType.GROUPS;
            case SERVICES -> postType == PostType.COMPUTER || postType == PostType.AUTOMOTIVE;
            case FOR_SALE -> postType == PostType.ELECTRONICS || postType == PostType.FURNITURE;
            case HOUSING -> postType == PostType.APARTMENTS || postType == PostType.ROOMS;
            case JOBS -> postType == PostType.CUSTOMER_SERVICE || postType == PostType.GENERAL_LABOR;
            case GIGS -> postType == PostType.COMPUTER || postType == PostType.CREATIVE;
        };
    }
}
