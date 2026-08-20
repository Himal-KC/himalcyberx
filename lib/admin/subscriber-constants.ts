export const SUBSCRIBER_SOURCES = ["website", "newsletter", "modal"] as const;

export type SubscriberSource = (typeof SUBSCRIBER_SOURCES)[number];
