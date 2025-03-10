export const getQueryParam = (param: string) => {
  const url = new URL(window.location.href);
  return url.searchParams.get(param);
};

export const setQueryParam = (param: string, value: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set(param, value);
  window.history.replaceState({}, '', url.toString());
};

export const removeQueryParam = (param: string) => {
  const url = new URL(window.location.href);
  url.searchParams.delete(param);
  window.history.replaceState({}, '', url.toString());
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};
