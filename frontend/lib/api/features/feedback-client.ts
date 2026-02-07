import { apiClient } from '../client';

export interface FeedbackSubmitRequest {
  type: 'SUGGESTION' | 'BUG_REPORT' | 'COMPLAINT' | 'QUESTION' | 'OTHER';
  subject: string;
  message: string;
  email?: string;
}

export interface FeedbackSubmitResponse {
  id: string;
  message: string;
}

export const feedbackApi = {
  submit: async (feedback: FeedbackSubmitRequest): Promise<FeedbackSubmitResponse> => {
    const { data } = await apiClient.post<FeedbackSubmitResponse>('/feedback/submit', feedback);
    return data;
  }
};
