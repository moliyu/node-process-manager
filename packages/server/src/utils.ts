export const parseJson = <T = Record<any, any>>(s: string | null, fb: T) => {
  if (!s) {
    return fb;
  }
  try {
    const res = JSON.parse(s);
    return res as T;
  } catch (err) {
    return fb;
  }
};
