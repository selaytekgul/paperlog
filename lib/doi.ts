const doiPattern = /^10\.\d{4,9}\/[-._;()/:a-z0-9]+$/i;

export function normalizeDoi(input: string): string | null {
  let value = input.trim();
  if (!value) return null;

  try {
    value = decodeURIComponent(value);
  } catch {
    return null;
  }

  value = value
    .trim()
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");

  return doiPattern.test(value) ? value.toLowerCase() : null;
}

export function canonicalPaperPath(workId: string): string | null {
  const normalized = workId.trim().toUpperCase();
  return /^W\d+$/.test(normalized) ? `/paper/${normalized}` : null;
}

type DoiResolverDependencies<T> = {
  lookupRemote: (doi: string) => Promise<T | null>;
  lookupStored: (doi: string) => Promise<T | null>;
  cacheRemote?: (paper: T) => Promise<void>;
};

export async function resolveDoiWithFallback<T>(
  input: string,
  dependencies: DoiResolverDependencies<T>,
): Promise<T | null> {
  const doi = normalizeDoi(input);
  if (!doi) return null;

  try {
    const remote = await dependencies.lookupRemote(doi);
    if (remote) {
      if (dependencies.cacheRemote) {
        try {
          await dependencies.cacheRemote(remote);
        } catch {
          // A cache write must not prevent a valid DOI redirect.
        }
      }
      return remote;
    }
  } catch {
    // Paperlog's stored catalog keeps known papers reachable during provider outages.
  }

  return dependencies.lookupStored(doi);
}
