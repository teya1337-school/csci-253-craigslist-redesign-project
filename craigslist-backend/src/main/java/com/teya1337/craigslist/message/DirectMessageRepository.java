package com.teya1337.craigslist.message;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, UUID> {
    List<DirectMessage> findAllByRecipientIdAndRecipientDeletedAtIsNullOrderBySentAtDescIdDesc(UUID userId);
    List<DirectMessage> findAllBySenderIdAndSenderDeletedAtIsNullOrderBySentAtDescIdDesc(UUID userId);

    long countByRecipientIdAndRecipientDeletedAtIsNullAndReadAtIsNull(UUID userId);

    // Serialize read/deletion changes so one participant cannot overwrite the other's mailbox state.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select message from DirectMessage message where message.id = :id")
    Optional<DirectMessage> findForUpdate(@Param("id") UUID id);
}
