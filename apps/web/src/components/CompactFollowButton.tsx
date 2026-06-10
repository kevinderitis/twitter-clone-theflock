type CompactFollowButtonProps = {
  isFollowing: boolean;
  isPending: boolean;
  onClick: () => void;
};

export const CompactFollowButton = ({
  isFollowing,
  isPending,
  onClick,
}: CompactFollowButtonProps) => {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      disabled={isPending}
      className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
        isFollowing
          ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
          : 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600'
      } disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {isPending
        ? isFollowing
          ? 'Unfollowing...'
          : 'Following...'
        : isFollowing
          ? 'Unfollow'
          : 'Follow'}
    </button>
  );
};
