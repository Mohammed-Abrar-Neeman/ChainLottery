import { useEffect, useState } from "react";

export function useMaticPrice() {
  const [maticPrice, setMaticPrice] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd")
      .then(res => res.json())
      .then(data => {
        setMaticPrice(data["matic-network"].usd);
      })
      .catch(() => setMaticPrice(null));
  }, []);

  return maticPrice;
} 