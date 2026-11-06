export interface ISmsProvider {
    send(to: string, message: string): Promise<{
        messageId: string;
    }>;
}
