'use client';

import React from 'react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { FeedbackSubmitRequest } from '@/lib/api/features/feedback-client';
import { FiMessageSquare, FiCheck, FiAlertCircle } from 'react-icons/fi';

const FEEDBACK_TYPES: Array<{
  value: FeedbackSubmitRequest['type'];
  label: string;
  description: string;
}> = [
    {
      value: 'SUGGESTION',
      label: 'Suggestion',
      description: 'Share your ideas for new features or improvements'
    },
    {
      value: 'BUG_REPORT',
      label: 'Bug Report',
      description: 'Report technical issues or unexpected behavior'
    },
    {
      value: 'COMPLAINT',
      label: 'Complaint',
      description: 'Let us know about problems or concerns'
    },
    {
      value: 'QUESTION',
      label: 'Question',
      description: 'Ask questions about the platform'
    },
    {
      value: 'OTHER',
      label: 'Other',
      description: 'Anything else you want to share'
    }
  ];

const SUBJECT_MAX_LENGTH = 200;
const MESSAGE_MAX_LENGTH = 2000;

export default function FeedbackPage () {
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState<FeedbackSubmitRequest['type']>('SUGGESTION');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const feedbackData: FeedbackSubmitRequest = {
        type: feedbackType,
        subject: subject.trim(),
        message: message.trim(),
        email: email.trim() || undefined
      };

      await api.feedback.submit(feedbackData);
      setSubmitSuccess(true);
      setSubject('');
      setMessage('');
      setEmail('');
      setFeedbackType('SUGGESTION');

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSubmitError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <FiMessageSquare className="text-6xl text-purple-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">We Value Your Feedback</h1>
        <p className="text-gray-400 text-lg">
          Help us improve Pixel Race by sharing your thoughts, reporting bugs, or asking questions.
        </p>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <FiCheck className="text-2xl text-green-400" />
          <div>
            <h3 className="font-semibold text-green-400">Thank you for your feedback!</h3>
            <p className="text-sm text-green-300">
              We have received your message and will review it soon.
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <FiAlertCircle className="text-2xl text-red-400" />
          <div>
            <h3 className="font-semibold text-red-400">Error</h3>
            <p className="text-sm text-red-300">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg space-y-6">
          {user && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-gray-400">Submitting as:</p>
              <p className="text-white font-mono">
                {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FEEDBACK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFeedbackType(type.value)}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${feedbackType === type.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                >
                  <div className="font-semibold text-white">{type.label}</div>
                  <div className="text-sm text-gray-400 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, SUBJECT_MAX_LENGTH))}
              placeholder="Brief summary of your feedback"
              maxLength={SUBJECT_MAX_LENGTH}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                Be clear and descriptive
              </span>
              <span className={`text-xs ${subject.length >= SUBJECT_MAX_LENGTH - 20 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {subject.length}/{SUBJECT_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
              placeholder="Provide details about your feedback. The more information you provide, the better we can help."
              rows={8}
              maxLength={MESSAGE_MAX_LENGTH}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                Include steps to reproduce if reporting a bug
              </span>
              <span className={`text-xs ${message.length >= MESSAGE_MAX_LENGTH - 100 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {message.length}/{MESSAGE_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Email <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide an email if you want us to follow up with you
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !subject.trim() || !message.trim()}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>

      <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="font-semibold text-blue-400 mb-2">What happens next?</h3>
        <ul className="space-y-2 text-sm text-blue-300">
          <li>• Your feedback will be reviewed by our team</li>
          <li>• We prioritize bugs and critical issues</li>
          <li>• Popular suggestions may be implemented in future updates</li>
          <li>• If you provided an email, we may reach out for clarification</li>
        </ul>
      </div>
    </div>
  );
}
