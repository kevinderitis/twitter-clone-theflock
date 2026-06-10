import { Link } from 'react-router-dom';

type PublicUserCardUser = {
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const PublicUserCard = ({ user }: { user: PublicUserCardUser }) => (
  <Link
    to={`/profile/${user.username}`}
    className="block rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-semibold text-brand-700">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.name} avatar`}
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : (
          getInitials(user.name)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">{user.name}</p>
        <p className="mt-1 text-sm text-slate-500">@{user.username}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {user.bio ?? 'No bio yet.'}
        </p>
      </div>
    </div>
  </Link>
);
