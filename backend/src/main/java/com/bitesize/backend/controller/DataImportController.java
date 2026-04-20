package com.bitesize.backend.controller;

import com.bitesize.backend.service.IndexingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/import")
@CrossOrigin(origins = "*")
public class DataImportController {

    private final IndexingService indexingService;

    public DataImportController(IndexingService indexingService) {
        this.indexingService = indexingService;
    }

    @PostMapping
    public ResponseEntity<?> triggerImport(@RequestParam(required = false) String path) {
        String defaultPath = "../data-pipeline/dataset.json";
        String finalPath = (path != null && !path.isEmpty()) ? path : defaultPath;

        try {
            indexingService.importFromDataset(finalPath);
            return ResponseEntity.ok(Map.of("message", "Import successful from " + finalPath));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Unexpected error: " + e.getMessage()));
        }
    }
}
