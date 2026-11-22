package com.example.demo.domain.claim;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClaimValidationBoundaryTest {

    @Test
    void should_AcceptMinimumValidAmountAndTextLengths() {
        Claim claim = new Claim(
                UUID.randomUUID(),
                UUID.randomUUID(),
                LocalDate.now(),
                "12345",
                "1234567890",
                new BigDecimal("0.01")
        );

        assertEquals(new BigDecimal("0.01"), claim.getClaimAmount());
        assertEquals(5, claim.getIncidentLocation().length());
        assertEquals(10, claim.getDescription().length());
    }

    @Test
    void should_AcceptMaximumValidAmountAndTextLengths() {
        String location = "l".repeat(200);
        String description = "d".repeat(1000);
        Claim claim = new Claim(
                UUID.randomUUID(),
                UUID.randomUUID(),
                LocalDate.now(),
                location,
                description,
                Claim.MAX_CLAIM_AMOUNT
        );

        assertEquals(Claim.MAX_CLAIM_AMOUNT, claim.getClaimAmount());
        assertEquals(200, claim.getIncidentLocation().length());
        assertEquals(1000, claim.getDescription().length());
    }
}
