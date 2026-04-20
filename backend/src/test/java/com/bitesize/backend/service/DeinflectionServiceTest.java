package com.bitesize.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

class DeinflectionServiceTest {

    private DeinflectionService deinflectionService;

    @BeforeEach
    void setUp() {
        deinflectionService = new DeinflectionService();
        deinflectionService.init();
    }

    @Test
    void testDeinflectionRecursive() {
        // Test case: 食べさせられた (tabesaserareta - đã bị bắt ăn)
        // Expected candidates: 食べさせられた, 食べさせられる, 食べさせる, 食べる
        String input = "食べさせられた";
        Set<String> candidates = deinflectionService.getCandidates(input);

        System.out.println("Candidates for " + input + ": " + candidates);

        assertTrue(candidates.contains("食べさせられた"));
        assertTrue(candidates.contains("食べさせられる"));
        assertTrue(candidates.contains("食べさせる"));
        assertTrue(candidates.contains("食べる"));
    }

    @Test
    void testPolite() {
        // Test case: 食べます (tabemasu)
        // Expected to find: 食べる
        String input = "食べます";
        Set<String> candidates = deinflectionService.getCandidates(input);

        System.out.println("Candidates for " + input + ": " + candidates);

        assertTrue(candidates.contains("食べます"));
        assertTrue(candidates.contains("食べる"));
    }
}
