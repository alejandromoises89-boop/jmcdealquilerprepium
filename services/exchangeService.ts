
export const fetchBrlToPyg = async (): Promise<number> => {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/BRL");
    const data = await response.json();
    return Math.round(data.rates.PYG || 1450);
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 1450;
  }
};
