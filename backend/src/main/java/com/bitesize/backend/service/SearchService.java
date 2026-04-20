package com.bitesize.backend.service;

import com.bitesize.backend.entity.Subtitle;
import com.bitesize.backend.repository.SubtitleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private static final Logger log = LoggerFactory.getLogger(SearchService.class);

    private final DeinflectionService deinflectionService;
    private final SubtitleRepository subtitleRepository;

    public SearchService(DeinflectionService deinflectionService, SubtitleRepository subtitleRepository) {
        this.deinflectionService = deinflectionService;
        this.subtitleRepository = subtitleRepository;
    }

    public List<Subtitle> searchByYomitan(String keyword) {
        log.info("Searching for: {}", keyword);
        Set<String> candidateSet = deinflectionService.getCandidates(keyword);
        List<String> candidates = new ArrayList<>(candidateSet);
        List<Subtitle> results = subtitleRepository.findByExpressionsIn(candidates);
        return rankResults(keyword, results);
    }

    public List<Subtitle> getContextLines(String videoId, Double startTime, int limit) {
        List<Subtitle> context = subtitleRepository.findByVideoIdAndStartTimeLessThanOrderByStartTimeDesc(
                videoId, startTime, PageRequest.of(0, limit));
        Collections.reverse(context);
        return context;
    }

    public List<Subtitle> getAfterLines(String videoId, Double startTime, int limit) {
        // Lấy n câu có startTime lớn hơn câu hiện tại, sắp xếp tăng dần
        return subtitleRepository.findByVideoIdAndStartTimeGreaterThanOrderByStartTimeAsc(
                videoId, startTime, PageRequest.of(0, limit));
    }

    private List<Subtitle> rankResults(String originalKeyword, List<Subtitle> results) {
        return results.stream()
                .sorted(Comparator.comparing((Subtitle s) -> {
                    if (s.getExpressions().contains(originalKeyword))
                        return 0;
                    int minDiff = Integer.MAX_VALUE;
                    for (String expr : s.getExpressions()) {
                        minDiff = Math.min(minDiff, Math.abs(expr.length() - originalKeyword.length()));
                    }
                    return 1 + minDiff;
                }))
                .collect(Collectors.toList());
    }
}
