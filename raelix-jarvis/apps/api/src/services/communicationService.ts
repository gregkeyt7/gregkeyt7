export interface CommunicationProviderStatus {
  gmailReady: boolean;
  twilioReady: boolean;
}

export const getCommunicationProviderStatus = (config: {
  gmailClientId: string;
  gmailClientSecret: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
}): CommunicationProviderStatus => ({
  gmailReady: Boolean(config.gmailClientId && config.gmailClientSecret),
  twilioReady: Boolean(config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber),
});
