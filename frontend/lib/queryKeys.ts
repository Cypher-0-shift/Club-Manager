export const QK = {
  tasks: {
    all: () => ['tasks'] as const,
    byDomain: (domainId: string) => ['tasks', 'domain', domainId] as const,
    mine: () => ['tasks', 'mine'] as const,
  },
  users: {
    all: () => ['users'] as const,
  },
  domains: {
    all: () => ['domains'] as const,
  },
};
