package com.bitesize.backend.controller;

import com.bitesize.backend.entity.Subtitle;
import com.bitesize.backend.service.SearchService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
@CrossOrigin(origins = "*")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public List<Subtitle> search(@RequestParam String q) {
        return searchService.searchByYomitan(q);
    }

    @GetMapping("/context")
    public Map<String, List<Subtitle>> getContext(
            @RequestParam String videoId,
            @RequestParam Double startTime,
            @RequestParam(defaultValue = "4") int limit) {

        Map<String, List<Subtitle>> response = new HashMap<>();
        response.put("prev", searchService.getContextLines(videoId, startTime, limit));
        response.put("next", searchService.getAfterLines(videoId, startTime, limit));
        return response;
    }
}
