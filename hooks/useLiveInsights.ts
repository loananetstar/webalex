import { useMemo } from 'react';
import { useMqtt } from '../context/MqttContext';

export interface RealTimeSummary {
    key_points: string[];
    summary: string;
    action_items: string[];
    turn_count: number;
    processing_time_ms: number;
    timestamp: string;
}

export interface TopicClassification {
    domain: string;
    subtopics: string[];
    tags: string[];
    confidence: number;
}

export const useLiveInsights = () => {
    const { messages } = useMqtt();

    const summary = useMemo<RealTimeSummary | null>(() => {
        const raw = messages['agent/summary/realtime'];
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('Failed to parse RealTimeSummary', e);
            return null;
        }
    }, [messages['agent/summary/realtime']]);

    const topic = useMemo<TopicClassification | null>(() => {
        const raw = messages['agent/topics/current'];
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('Failed to parse TopicClassification', e);
            return null;
        }
    }, [messages['agent/topics/current']]);

    return { summary, topic };
};
