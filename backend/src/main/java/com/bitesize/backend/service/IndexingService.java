package com.bitesize.backend.service;

import com.atilika.kuromoji.ipadic.Token;
import com.atilika.kuromoji.ipadic.Tokenizer;
import com.bitesize.backend.entity.Subtitle;
import com.bitesize.backend.repository.SubtitleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.*;

@Service
public class IndexingService {

    private static final Logger log = LoggerFactory.getLogger(IndexingService.class);

    private final SubtitleRepository subtitleRepository;
    private final Tokenizer tokenizer;
    private final ObjectMapper objectMapper;

    public IndexingService(SubtitleRepository subtitleRepository) {
        this.subtitleRepository = subtitleRepository;
        this.tokenizer = new Tokenizer();
        this.objectMapper = new ObjectMapper();
    }

    public void importFromDataset(String filePath) throws IOException {
        log.info("Starting import from {}", filePath);

        // 1. Load metadata mapping for Titles
        Map<String, String> videoMetadata = new HashMap<>();
        File metadataFile = new File("../data-pipeline/video_metadata.json");
        if (metadataFile.exists()) {
            videoMetadata = objectMapper.readValue(metadataFile, new TypeReference<Map<String, String>>() {
            });
            log.info("Loaded metadata for {} videos", videoMetadata.size());
        }

        List<JsonNode> rawData = objectMapper.readValue(new File(filePath), new TypeReference<List<JsonNode>>() {
        });
        log.info("Loaded {} raw entries from JSON", rawData.size());

        // Xóa index cũ để tránh trùng lặp
        subtitleRepository.deleteAll();

        List<Subtitle> batch = new ArrayList<>();
        int count = 0;

        for (JsonNode node : rawData) {
            String videoId = node.get("video_id").asText();
            String title = videoMetadata.getOrDefault(videoId, "Episode " + videoId);
            String textRaw = node.get("text_raw").asText();

            Subtitle subtitle = new Subtitle();
            subtitle.setId(UUID.randomUUID().toString());
            subtitle.setVideoId(videoId);
            subtitle.setVideoTitle(title);
            subtitle.setStartTime(node.get("start_time").asDouble());
            subtitle.setDuration(node.get("duration").asDouble());
            subtitle.setTextRaw(textRaw);

            // Extract dictionary forms
            subtitle.setExpressions(extractBaseForms(textRaw));

            batch.add(subtitle);
            count++;

            if (batch.size() >= 500) {
                subtitleRepository.saveAll(batch);
                batch.clear();
                log.info("Indexed {}/{} lines...", count, rawData.size());
            }
        }

        if (!batch.isEmpty()) {
            subtitleRepository.saveAll(batch);
        }

        log.info("Import complete! Total indexed: {}", count);
    }

    private List<String> extractBaseForms(String text) {
        List<Token> tokens = tokenizer.tokenize(text);
        Set<String> baseForms = new HashSet<>();

        for (Token token : tokens) {
            String base = token.getBaseForm();
            if (base == null || base.equals("*")) {
                baseForms.add(token.getSurface());
            } else {
                baseForms.add(base);
            }
        }
        return new ArrayList<>(baseForms);
    }
}
