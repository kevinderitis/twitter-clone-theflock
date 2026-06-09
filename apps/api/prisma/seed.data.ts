type SeedUserDefinition = {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
};

type SeedTweet = {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

type SeedFollow = {
  followerId: string;
  followingId: string;
  createdAt: Date;
};

type SeedLike = {
  userId: string;
  tweetId: string;
  createdAt: Date;
};

type SeedUser = SeedUserDefinition & {
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SeedPlan = {
  users: SeedUser[];
  tweets: SeedTweet[];
  follows: SeedFollow[];
  likes: SeedLike[];
};

const baseDate = new Date('2026-01-10T09:00:00.000Z');

const userDefinitions: SeedUserDefinition[] = [
  {
    id: 'seed_user_demo',
    email: 'demo@example.com',
    username: 'demo',
    name: 'Demo User',
    bio: 'Building The Flock one endpoint at a time.',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Demo%20User',
  },
  {
    id: 'seed_user_kevin',
    email: 'kevin@example.com',
    username: 'kevin',
    name: 'Kevin',
    bio: 'Shipping clean full-stack code and strong commit history.',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Kevin',
  },
  {
    id: 'seed_user_ada',
    email: 'ada@example.com',
    username: 'ada',
    name: 'Ada Lovelace',
    bio: 'Notes on analytical engines, abstractions, and elegant systems.',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Ada%20Lovelace',
  },
  {
    id: 'seed_user_grace',
    email: 'grace@example.com',
    username: 'grace',
    name: 'Grace Hopper',
    bio: 'Compilers, leadership, and finding the bug in the room.',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Grace%20Hopper',
  },
  {
    id: 'seed_user_barbara',
    email: 'barbara@example.com',
    username: 'barbara',
    name: 'Barbara Liskov',
    bio: 'Reliability comes from good interfaces and stronger guarantees.',
    avatarUrl:
      'https://api.dicebear.com/9.x/initials/svg?seed=Barbara%20Liskov',
  },
  {
    id: 'seed_user_margaret',
    email: 'margaret@example.com',
    username: 'margaret',
    name: 'Margaret Hamilton',
    bio: 'Testing what matters before launch day arrives.',
    avatarUrl:
      'https://api.dicebear.com/9.x/initials/svg?seed=Margaret%20Hamilton',
  },
  {
    id: 'seed_user_linus',
    email: 'linus@example.com',
    username: 'linus',
    name: 'Linus Torvalds',
    bio: 'Prefers practical tradeoffs, fast feedback, and honest review.',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Linus',
  },
  {
    id: 'seed_user_guido',
    email: 'guido@example.com',
    username: 'guido',
    name: 'Guido van Rossum',
    bio: 'Trying to keep things readable even when the requirements grow.',
    avatarUrl:
      'https://api.dicebear.com/9.x/initials/svg?seed=Guido%20van%20Rossum',
  },
  {
    id: 'seed_user_dan',
    email: 'dan@example.com',
    username: 'dan',
    name: 'Dan Abramov',
    bio: 'Thinking out loud about UI architecture and developer experience.',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Dan%20Abramov',
  },
  {
    id: 'seed_user_sarah',
    email: 'sarah@example.com',
    username: 'sarah',
    name: 'Sarah Drasner',
    bio: 'Design systems, motion, and making interfaces feel human.',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Sarah%20Drasner',
  },
  {
    id: 'seed_user_kent',
    email: 'kent@example.com',
    username: 'kent',
    name: 'Kent C. Dodds',
    bio: 'Confidence comes from tests that reflect real user behavior.',
    avatarUrl:
      'https://api.dicebear.com/9.x/initials/svg?seed=Kent%20C.%20Dodds',
  },
  {
    id: 'seed_user_taylor',
    email: 'taylor@example.com',
    username: 'taylor',
    name: 'Taylor Otwell',
    bio: 'Enjoys sharp DX, thoughtful defaults, and clear APIs.',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Taylor%20Otwell',
  },
];

const tweetBodiesByUsername: Record<string, string[]> = {
  demo: [
    'Started the morning by tightening a route contract. Tiny change, huge confidence boost.',
    'A healthy repo is one where the README, tests, and code all tell the same story.',
    'Short update: timeline pagination is finally feeling predictable.',
    'Today I am biasing toward smaller commits. The reviewer experience matters as much as the end state.',
    'The fastest way to ship is still the boring trio: clear naming, strong tests, and no surprise side effects.',
  ],
  kevin: [
    'Docker is behaving, migrations are clean, and the app actually feels alive now.',
    'Small step today: verifying every endpoint manually after the test suite passes.',
    'Realistic seed data is underrated. It turns placeholder screens into product conversations.',
    'Spent time simplifying an API response instead of adding more fields. It was the right trade.',
    'Longer thought: senior-level work is often just reducing ambiguity before it becomes rework for the rest of the team.',
  ],
  ada: [
    'I still think the best abstractions are the ones that make the next feature easier to explain.',
    'A short function with a strong name can save more time than a clever helper ever will.',
    'Working on data shapes first makes the HTTP layer feel almost mechanical.',
    'Today’s note: when the types align with the mental model, implementation speed jumps.',
    'There is something satisfying about seeing a monorepo go from scaffold to coherent system one commit at a time.',
  ],
  grace: [
    'Found a bug by reading the logs out loud. Highly recommend the dramatic approach.',
    'Compilers taught me to respect exactness. APIs teach the same lesson every day.',
    'A route returning a clear 409 is a kindness to every future client.',
    'One of my favorite smells in a codebase is a test name that reads like product documentation.',
    'Longer note: deleting accidental complexity is often more strategic than adding a flashy new feature.',
  ],
  barbara: [
    'Interfaces are promises. The rest of the system gets calmer when those promises stay small.',
    'You can feel design quality when invalid states become hard to express.',
    'Short thought: stable pagination is less glamorous than it is important.',
    'A profile endpoint should be boring in the best possible way.',
    'Reliable systems tend to emerge when we keep choosing explicitness over interpretation.',
  ],
  margaret: [
    'Testing before launch is not pessimism. It is respect for the people who depend on the software.',
    'We caught a regression because the integration test reflected a real workflow, not an internal detail.',
    'Small note from today: a deterministic seed makes demos dramatically easier.',
    'I like when failure messages teach the next person exactly what to fix.',
    'Longer reflection: a calm release day is usually the visible result of many invisible quality choices made earlier.',
  ],
  linus: [
    'If a cleanup makes the code easier to review, that cleanup counts as product work.',
    'Short update: I removed one layer and the whole module got easier to reason about.',
    'People overcomplicate architecture when a direct dependency would do.',
    'I trust code that is comfortable being read by someone skeptical.',
    'Longer thought: maintainability is really just empathy expressed through structure, naming, and ruthless trimming.',
  ],
  guido: [
    'Readable code scales conversations. That is half the reason I care so much about it.',
    'A good default limit says a lot about how much you expect clients to behave.',
    'Tiny victory: the validation errors are now specific enough that the frontend barely has to guess.',
    'I appreciate APIs that respond exactly once and mean it.',
    'Longer note: the nicest developer experience usually comes from many ordinary decisions made consistently.',
  ],
  dan: [
    'The best UI discussions often start with data contracts, not pixels.',
    'Short one: naming the public shape first made the route straightforward.',
    'Refactoring toward dependency injection paid off again in tests today.',
    'It is surprisingly easy to move fast when every step stays reversible.',
    'Longer reflection: the real productivity gain from AI help is not speed alone, it is preserving focus between decisions.',
  ],
  sarah: [
    'A screen with believable content instantly changes how everyone talks about the product.',
    'Motion is great, but honestly good spacing fixes more confusion than animation ever will.',
    'Short note: placeholder avatars are enough if the surrounding data feels intentional.',
    'I love when the mobile layout still feels designed, even before the final polish pass.',
    'Longer thought: the difference between mock data and demo data is whether a teammate can actually learn something from it.',
  ],
  kent: [
    'Every time I manually test a happy path after the suite passes, I find one more valuable question to automate later.',
    'Short update: one new route, one focused test file, one clean commit.',
    'A great integration test feels like a trustworthy rehearsal.',
    'There is no shame in starting with the simplest thing that could possibly be production-worthy.',
    'Longer note: confidence is cumulative, and tiny well-verified increments compound faster than heroics.',
  ],
  taylor: [
    'Developer experience improves when the defaults are kind and the commands are memorable.',
    'Short one: I want the local setup to be obvious enough that nobody needs a walkthrough.',
    'A realistic seed turns “does it work?” into “does it feel right?”',
    'Today was mostly about sanding down rough edges in the environment, which is usually time well spent.',
    'Longer reflection: product momentum often comes from infrastructure work nobody notices until it is missing.',
  ],
};

const followGraph: Record<string, string[]> = {
  demo: ['kevin', 'ada', 'grace', 'dan', 'sarah'],
  kevin: ['demo', 'ada', 'grace', 'kent', 'taylor'],
  ada: ['demo', 'grace', 'barbara', 'margaret', 'guido'],
  grace: ['demo', 'kevin', 'ada', 'margaret', 'linus'],
  barbara: ['ada', 'grace', 'margaret', 'guido', 'kent'],
  margaret: ['demo', 'grace', 'barbara', 'linus', 'kent'],
  linus: ['kevin', 'grace', 'guido', 'dan', 'taylor'],
  guido: ['ada', 'barbara', 'linus', 'kent', 'taylor'],
  dan: ['demo', 'kevin', 'sarah', 'kent', 'taylor'],
  sarah: ['demo', 'dan', 'kent', 'taylor', 'ada'],
  kent: ['demo', 'kevin', 'dan', 'sarah', 'grace'],
  taylor: ['kevin', 'guido', 'dan', 'sarah', 'kent'],
};

const likePatterns: Array<{ tweetIndex: number; usernames: string[] }> = [
  {
    tweetIndex: 0,
    usernames: [
      'kevin',
      'ada',
      'grace',
      'barbara',
      'margaret',
      'dan',
      'sarah',
      'kent',
      'taylor',
    ],
  },
  {
    tweetIndex: 1,
    usernames: ['demo', 'ada', 'grace', 'kent', 'taylor'],
  },
  {
    tweetIndex: 2,
    usernames: ['demo', 'kevin'],
  },
  {
    tweetIndex: 5,
    usernames: ['demo', 'ada', 'grace', 'dan'],
  },
  {
    tweetIndex: 7,
    usernames: ['demo'],
  },
  {
    tweetIndex: 9,
    usernames: ['kevin', 'grace', 'barbara', 'margaret', 'linus', 'guido'],
  },
  {
    tweetIndex: 12,
    usernames: ['demo', 'kevin', 'sarah'],
  },
  {
    tweetIndex: 16,
    usernames: [
      'demo',
      'kevin',
      'ada',
      'grace',
      'barbara',
      'margaret',
      'linus',
    ],
  },
  {
    tweetIndex: 18,
    usernames: ['dan', 'sarah'],
  },
  {
    tweetIndex: 20,
    usernames: [
      'demo',
      'kevin',
      'ada',
      'grace',
      'barbara',
      'margaret',
      'linus',
      'guido',
      'dan',
      'sarah',
    ],
  },
  {
    tweetIndex: 24,
    usernames: ['kent', 'taylor', 'demo'],
  },
  {
    tweetIndex: 27,
    usernames: ['demo', 'kevin', 'ada', 'grace'],
  },
  {
    tweetIndex: 31,
    usernames: ['barbara', 'margaret'],
  },
  {
    tweetIndex: 34,
    usernames: ['demo', 'kevin', 'grace', 'dan', 'kent'],
  },
  {
    tweetIndex: 36,
    usernames: ['ada', 'barbara', 'guido'],
  },
  {
    tweetIndex: 40,
    usernames: [
      'demo',
      'kevin',
      'ada',
      'grace',
      'barbara',
      'margaret',
      'linus',
      'guido',
    ],
  },
  {
    tweetIndex: 44,
    usernames: ['sarah', 'kent'],
  },
  {
    tweetIndex: 48,
    usernames: ['demo', 'kevin', 'taylor'],
  },
  {
    tweetIndex: 53,
    usernames: ['demo', 'kevin', 'ada', 'grace', 'barbara'],
  },
  {
    tweetIndex: 57,
    usernames: ['linus', 'guido', 'dan', 'sarah', 'kent', 'taylor'],
  },
];

export const buildSeedPlan = (passwordHash: string): SeedPlan => {
  const users: SeedUser[] = userDefinitions.map((user, index) => {
    const createdAt = new Date(baseDate.getTime() + index * 60 * 60 * 1000);

    return {
      ...user,
      passwordHash,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const userIdByUsername = new Map(
    users.map((user) => [user.username, user.id]),
  );

  const tweets = users.flatMap((user, userIndex) =>
    tweetBodiesByUsername[user.username].map((content, tweetIndex) => {
      const createdAt = new Date(
        baseDate.getTime() +
          (userIndex * 5 + tweetIndex) * 6 * 60 * 60 * 1000 +
          tweetIndex * 13 * 60 * 1000,
      );

      return {
        id: `seed_tweet_${String(userIndex * 5 + tweetIndex + 1).padStart(3, '0')}`,
        content,
        authorId: user.id,
        createdAt,
        updatedAt: createdAt,
      };
    }),
  );

  const follows: SeedFollow[] = Object.entries(followGraph).flatMap(
    ([followerUsername, followingUsernames], index) =>
      followingUsernames.map((followingUsername, innerIndex) => ({
        followerId: userIdByUsername.get(followerUsername)!,
        followingId: userIdByUsername.get(followingUsername)!,
        createdAt: new Date(
          baseDate.getTime() + (index * 10 + innerIndex) * 60 * 60 * 1000,
        ),
      })),
  );

  const likes: SeedLike[] = likePatterns.flatMap((pattern, patternIndex) =>
    pattern.usernames.map((username, usernameIndex) => ({
      userId: userIdByUsername.get(username)!,
      tweetId: tweets[pattern.tweetIndex]!.id,
      createdAt: new Date(
        tweets[pattern.tweetIndex]!.createdAt.getTime() +
          (patternIndex + usernameIndex + 1) * 5 * 60 * 1000,
      ),
    })),
  );

  return {
    users,
    tweets,
    follows,
    likes,
  };
};
