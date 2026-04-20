package com.bitesize.backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;

@Document(indexName = "subtitles")
public class Subtitle {

    public Subtitle() {
    }

    public Subtitle(String id, String videoId, String videoTitle, Double startTime, Double duration, String textRaw,
            List<String> expressions) {
        this.id = id;
        this.videoId = videoId;
        this.videoTitle = videoTitle;
        this.startTime = startTime;
        this.duration = duration;
        this.textRaw = textRaw;
        this.expressions = expressions;
    }

    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String videoId;

    @Field(type = FieldType.Text)
    private String videoTitle;

    @Field(type = FieldType.Double)
    private Double startTime;

    @Field(type = FieldType.Double)
    private Double duration;

    @Field(type = FieldType.Text)
    private String textRaw;

    @Field(type = FieldType.Keyword)
    private List<String> expressions;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getVideoTitle() {
        return videoTitle;
    }

    public void setVideoTitle(String videoTitle) {
        this.videoTitle = videoTitle;
    }

    public Double getStartTime() {
        return startTime;
    }

    public void setStartTime(Double startTime) {
        this.startTime = startTime;
    }

    public Double getDuration() {
        return duration;
    }

    public void setDuration(Double duration) {
        this.duration = duration;
    }

    public String getTextRaw() {
        return textRaw;
    }

    public void setTextRaw(String textRaw) {
        this.textRaw = textRaw;
    }

    public List<String> getExpressions() {
        return expressions;
    }

    public void setExpressions(List<String> expressions) {
        this.expressions = expressions;
    }
}
