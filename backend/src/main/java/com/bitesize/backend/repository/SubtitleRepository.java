package com.bitesize.backend.repository;

import com.bitesize.backend.entity.Subtitle;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface SubtitleRepository extends ElasticsearchRepository<Subtitle, String> {

    // Tìm chính xác bất kỳ từ nào trong danh sách candidates
    List<Subtitle> findByExpressionsIn(List<String> candidates);

    // Lấy context (các câu trước đó)
    List<Subtitle> findByVideoIdAndStartTimeLessThanOrderByStartTimeDesc(String videoId, Double startTime,
            Pageable pageable);

    // Lấy context (các câu sau đó)
    List<Subtitle> findByVideoIdAndStartTimeGreaterThanOrderByStartTimeAsc(String videoId, Double startTime,
            Pageable pageable);
}
