package com.bitesize.backend.dto;

public class DeinflectionRule {

    public DeinflectionRule() {
    }

    public DeinflectionRule(String suffix, String replacement, String type, String reason) {
        this.suffix = suffix;
        this.replacement = replacement;
        this.type = type;
        this.reason = reason;
    }

    private String suffix;
    private String replacement;
    private String type;
    private String reason;

    public String getSuffix() {
        return suffix;
    }

    public void setSuffix(String suffix) {
        this.suffix = suffix;
    }

    public String getReplacement() {
        return replacement;
    }

    public void setReplacement(String replacement) {
        this.replacement = replacement;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
