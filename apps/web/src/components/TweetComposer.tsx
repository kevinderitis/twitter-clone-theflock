import { type FormEvent, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '../lib/api';
import { createTweetRequest } from '../modules/tweets/tweet-api';
import { useAuth } from '../modules/auth/use-auth';

const MAX_TWEET_LENGTH = 280;

export const TweetComposer = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [content, setContent] = useState('');
  const [submissionError, setSubmissionError] = useState<{
    message: string;
    details?: string[];
  } | null>(null);

  const trimmedContent = content.trim();
  const isEmpty = trimmedContent.length === 0;
  const isTooLong = content.length > MAX_TWEET_LENGTH;
  const isSubmitDisabled = isEmpty || isTooLong;

  const counterLabel = useMemo(
    () => `${content.length} / ${MAX_TWEET_LENGTH}`,
    [content.length],
  );

  const createTweetMutation = useMutation({
    mutationFn: (payload: { content: string }) =>
      createTweetRequest(token!, payload),
    onSuccess: async () => {
      setContent('');
      setSubmissionError(null);
      await queryClient.invalidateQueries({
        queryKey: ['timeline'],
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setSubmissionError({
          message: error.message,
          details: error.details,
        });
        return;
      }

      setSubmissionError({
        message: 'Something went wrong. Please try again.',
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    setSubmissionError(null);
    createTweetMutation.mutate({
      content: trimmedContent,
    });
  };

  return (
    <form
      className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.15rem] bg-brand-100 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Post
        </div>

        <div className="min-w-0 flex-1">
          <label className="block">
            <span className="sr-only">Tweet content</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={400}
              rows={3}
              placeholder="What's happening?"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </label>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              className={[
                'text-xs font-semibold uppercase tracking-[0.2em]',
                isTooLong ? 'text-rose-600' : 'text-slate-400',
              ].join(' ')}
            >
              {counterLabel}
            </span>

            <button
              type="submit"
              disabled={isSubmitDisabled || createTweetMutation.isPending}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {createTweetMutation.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>

          {submissionError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p className="font-semibold">{submissionError.message}</p>
              {submissionError.details?.length ? (
                <ul className="mt-2 space-y-1">
                  {submissionError.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </form>
  );
};
