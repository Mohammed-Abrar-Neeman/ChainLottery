import { useEffect, useState } from "react";

export function useEthPrice() {
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
      .then(res => res.json())
      .then(data => {
        setEthPrice(data["ethereum"].usd);
      })
      .catch(() => setEthPrice(null));
  }, []);

  return ethPrice;
} 