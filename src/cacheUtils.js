import data from "./data"; // Correct way to import default export

const CACHE_KEY = "sampleDataCache";
const CACHE_TIMESTAMP_KEY = "sampleDataCacheTimestamp";
const CACHE_EXPIRATION_MS =  60 * 60 * 1000; // 24 hours in milliseconds

export const getCachedData = () => {
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

  if (
    cachedData &&
    cachedTimestamp &&
    Date.now() - parseInt(cachedTimestamp, 10) < CACHE_EXPIRATION_MS
  ) {
    return JSON.parse(cachedData);
  }
  return null;
};

export const setCachedData = (data) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
};

export const fetchSampleData = async () => {
  try {
    // Simulate a delay to mimic async fetching
    const fetchedData = await new Promise((resolve) =>
      setTimeout(() => resolve(data), 1000)
    );

    setCachedData(fetchedData); // Cache the data
    return fetchedData;
  } catch (error) {
    console.error("Error fetching sample data:", error);
    return []; // Return an empty array if an error occurs
  }
};
