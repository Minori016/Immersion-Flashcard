package com.bitesize.backend.service;

import com.bitesize.backend.dto.DeinflectionRule;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class DeinflectionService {

    private static final Logger log = LoggerFactory.getLogger(DeinflectionService.class);

    private List<DeinflectionRule> rules;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("verb-rules.json");
            try (InputStream inputStream = resource.getInputStream()) {
                rules = objectMapper.readValue(inputStream, new TypeReference<List<DeinflectionRule>>() {
                });
                log.info("Loaded {} deinflection rules", rules.size());
            }
        } catch (IOException e) {
            log.error("Failed to load deinflection rules", e);
            rules = List.of();
        }
    }

    public Set<String> getCandidates(String text) {
        Set<String> candidates = new HashSet<>();
        candidates.add(text);
        if (rules != null) {
            deinflectRecursive(text, candidates);
        }
        return candidates;
    }

    private void deinflectRecursive(String text, Set<String> candidates) {
        for (DeinflectionRule rule : rules) {
            if (text.endsWith(rule.getSuffix())) {
                String stem = text.substring(0, text.length() - rule.getSuffix().length());
                String deinflected = stem + rule.getReplacement();

                if (!candidates.contains(deinflected)) {
                    candidates.add(deinflected);
                    deinflectRecursive(deinflected, candidates);
                }
            }
        }
    }
}
